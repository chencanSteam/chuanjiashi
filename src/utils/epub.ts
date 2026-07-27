/**
 * EPUB 生成工具：不依赖第三方库，按 ZIP STORE（无压缩）格式手工打包，
 * 生成符合 EPUB 3 规范的最小可用电子书文件。
 */

// ---------- CRC32 ----------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ---------- ZIP (STORE 无压缩) ----------
interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function buildZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry) => {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // method: store
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0, true); // mod date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, entry.data.length, true);
    lv.setUint32(22, entry.data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    chunks.push(local, entry.data);

    const cd = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, entry.data.length, true);
    cv.setUint32(24, entry.data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true); // local header offset
    cd.set(nameBytes, 46);
    central.push(cd);

    offset += local.length + entry.data.length;
  });

  const cdSize = central.reduce((sum, c) => sum + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);

  const total = offset + cdSize + eocd.length;
  const out = new Uint8Array(total);
  let pos = 0;
  [...chunks, ...central, eocd].forEach((c) => {
    out.set(c, pos);
    pos += c.length;
  });
  return out;
}

// ---------- EPUB ----------
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 去除 HTML 标签，保留纯文本 */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

export interface EpubChapter {
  title: string;
  content: string;
}

/** 生成 EPUB 3 电子书 Blob */
export function buildEpub(title: string, author: string, chapters: EpubChapter[]): Blob {
  const encoder = new TextEncoder();
  const bookId = `chuanjiashi-${Date.now()}`;
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  const safeChapters = chapters.length > 0 ? chapters : [{ title: '前言', content: '暂无内容' }];

  const chapterFiles = safeChapters.map((c, i) => {
    const body = escapeXml(stripHtml(c.content) || c.title)
      .split(/\n+/)
      .filter((p) => p.trim())
      .map((p) => `    <p>${p.trim()}</p>`)
      .join('\n');
    return {
      name: `OEBPS/chapter_${i + 1}.xhtml`,
      content: `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-CN">
<head><meta charset="utf-8"/><title>${escapeXml(c.title)}</title></head>
<body>
  <h2>${escapeXml(c.title)}</h2>
${body}
</body>
</html>`,
    };
  });

  const manifestItems = chapterFiles
    .map((_, i) => `    <item id="ch${i + 1}" href="chapter_${i + 1}.xhtml" media-type="application/xhtml+xml"/>`)
    .join('\n');
  const spineItems = safeChapters.map((_, i) => `    <itemref idref="ch${i + 1}"/>`).join('\n');
  const navItems = safeChapters
    .map((c, i) => `      <li><a href="chapter_${i + 1}.xhtml">${escapeXml(c.title)}</a></li>`)
    .join('\n');

  const entries: ZipEntry[] = [
    { name: 'mimetype', data: encoder.encode('application/epub+zip') },
    {
      name: 'META-INF/container.xml',
      data: encoder.encode(`<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`),
    },
    {
      name: 'OEBPS/content.opf',
      data: encoder.encode(`<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${bookId}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>zh-CN</dc:language>
    <meta property="dcterms:modified">${now}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
${manifestItems}
  </manifest>
  <spine>
${spineItems}
  </spine>
</package>`),
    },
    {
      name: 'OEBPS/toc.xhtml',
      data: encoder.encode(`<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="zh-CN">
<head><meta charset="utf-8"/><title>目录</title></head>
<body>
  <nav epub:type="toc">
    <h1>目录</h1>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>`),
    },
    ...chapterFiles.map((f) => ({ name: f.name, data: encoder.encode(f.content) })),
  ];

  const zipped = buildZip(entries);
  return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/epub+zip' });
}

/** 触发浏览器下载 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
