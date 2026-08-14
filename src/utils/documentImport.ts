import { unzipSync, strFromU8 } from 'fflate';
import { biographyChapterTitles } from '../data/aiMock';

/** 上传文档 → 纯文本。支持 .txt / .md / .docx（.doc 为老式二进制格式，无法在前端解析） */

export async function readDocumentText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt') || name.endsWith('.md')) {
    return file.text();
  }
  if (name.endsWith('.docx')) {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const files = unzipSync(buffer);
    const documentXml = files['word/document.xml'];
    if (!documentXml) throw new Error('文档结构无法识别');
    const xml = strFromU8(documentXml);
    return xml
      .replace(/<\/w:p>/g, '\n')
      .replace(/<w:br\s*\/>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  if (name.endsWith('.doc')) {
    throw new Error('暂不支持老式 .doc 格式，请在 Word 中另存为 .docx 或 .txt 后上传');
  }
  throw new Error('不支持的文件格式，请上传 .docx / .txt 文件');
}

export interface ImportedChapter {
  title: string;
  content: string;
}

const NUMBERED_HEADING = /^\s*第[一二三四五六七八九十百零\d]+[章节篇回][：:、\s]*\S*/;
const CHINESE_INDEX_HEADING = /^\s*[一二三四五六七八九十]+[、.．]\s*\S+/;
const BRACKET_HEADING = /^\s*【[^】]{1,20}】\s*$/;

function isHeadingLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 30) return false;
  if ((biographyChapterTitles as string[]).includes(t)) return true;
  return NUMBERED_HEADING.test(t) || CHINESE_INDEX_HEADING.test(t) || BRACKET_HEADING.test(t);
}

function cleanHeading(line: string): string {
  return line
    .trim()
    .replace(/^第[一二三四五六七八九十百零\d]+[章节篇回][：:、\s]*/, '')
    .replace(/^[一二三四五六七八九十]+[、.．]\s*/, '')
    .replace(/^【|】$/g, '')
    .trim() || '未命名章节';
}

/** 把整篇文本按常见章节标题切分；识别不到标题时整篇作为「全文」一章 */
export function splitIntoChapters(text: string): ImportedChapter[] {
  const lines = text.split(/\r?\n/);
  const chapters: ImportedChapter[] = [];
  let current: ImportedChapter | null = null;

  const pushPreamble = (buf: string[]) => {
    const content = buf.join('\n').trim();
    if (content) chapters.push({ title: '开篇', content });
  };

  let buffer: string[] = [];
  for (const line of lines) {
    if (isHeadingLine(line)) {
      if (current) {
        current.content = buffer.join('\n').trim();
        chapters.push(current);
      } else {
        pushPreamble(buffer);
      }
      current = { title: cleanHeading(line), content: '' };
      buffer = [];
    } else {
      buffer.push(line);
    }
  }
  if (current) {
    current.content = buffer.join('\n').trim();
    chapters.push(current);
  } else {
    pushPreamble(buffer);
  }

  if (chapters.length === 0) {
    const content = text.trim();
    return content ? [{ title: '全文', content }] : [];
  }
  return chapters;
}
