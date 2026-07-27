import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  FileText,
  BookOpen,
  BookMarked,
  Video,
  QrCode,
  ShieldCheck,
  Download,
  Printer,
  Play,
  Settings2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Modal from '../components/ui/Modal';
import { loadJson, type ChapterData } from '../data/aiMock';
import { buildEpub, downloadBlob, stripHtml } from '../utils/epub';
import './DigitalAssets.css';

type GenState = 'idle' | 'generating' | 'done';

interface AssetCard {
  key: string;
  icon: typeof FileText;
  title: string;
  description: string;
  points: string[];
}

const ASSET_CARDS: AssetCard[] = [
  {
    key: 'pdf',
    icon: FileText,
    title: 'PDF 传记',
    description: '排版精美的电子版传记，支持打印与长期保存。',
    points: ['A4 标准排版', '含照片插页', '可随时下载打印'],
  },
  {
    key: 'epub',
    icon: BookOpen,
    title: 'EPUB 电子书',
    description: '适配手机、平板与电子阅读器的电子书格式。',
    points: ['支持微信读书 / Kindle', '自动生成目录', '夜间模式友好'],
  },
  {
    key: 'hardcover',
    icon: BookMarked,
    title: '精装书排版稿',
    description: '专业印厂级排版文件，用于定制实体精装传记。',
    points: ['300dpi 印刷级图片', '锁线精装 / 布面可选', '提交申请后专人对接'],
  },
  {
    key: 'video',
    icon: Video,
    title: '60 秒纪念短视频',
    description: '精选照片与人生节点自动生成纪念短片。',
    points: ['AI 自动字幕', '真人感配音', '温情背景音乐'],
  },
  {
    key: 'qrcode',
    icon: QrCode,
    title: '码记二维码',
    description: '一枚二维码，扫码即可进入数字博物馆与传记。',
    points: ['支持高清下载', '可镌刻于墓碑 / 纪念牌', '永久有效'],
  },
];

const BLOCKCHAIN_EVIDENCE = {
  hash: '0x8f3a2c7e9b1d4f6a5c8e2b7d9f1a3c5e7b9d2f4a6c8e1b3d5f7a9c2e4b6d8f1a3c',
  time: '2026-06-18 14:32:07',
  chain: '至信链',
  status: '已存证',
};

interface PdfExportOptions {
  watermark: boolean;
  password: string;
  protect: boolean;
}

const PDF_OPTIONS_KEY = 'cj_pdf_export_options';
const PDF_WATERMARK_TEXT = '传家世 · 仅供留念';

function loadPdfOptions(): PdfExportOptions {
  try {
    const raw = localStorage.getItem(PDF_OPTIONS_KEY);
    if (raw) return { watermark: false, password: '', protect: false, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { watermark: false, password: '', protect: false };
}

/** 数字资产页纪念视频生成状态标记（Museum 页读取） */
const VIDEO_STATUS_KEY = 'cj_memorial_video_status';

/** 由链接文本生成确定性的 21x21 码点矩阵（占位图案，含定位框与定时图案） */
function qrMatrix(text: string): boolean[] {
  const size = 21;
  const cells = new Array<boolean>(size * size).fill(false);
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  for (let i = 0; i < size * size; i += 1) {
    h = (h * 1103515245 + 12345 + i) >>> 0;
    cells[i] = (h & 0x10000) !== 0;
  }
  // 定时图案（第 6 行 / 第 6 列）
  for (let i = 8; i < size - 8; i += 1) {
    cells[6 * size + i] = i % 2 === 0;
    cells[i * size + 6] = i % 2 === 0;
  }
  // 三个角的定位框（7x7）
  const finder = (ox: number, oy: number) => {
    for (let y = -1; y < 8; y += 1) {
      for (let x = -1; x < 8; x += 1) {
        const px = ox + x;
        const py = oy + y;
        if (px < 0 || py < 0 || px >= size || py >= size) continue;
        const inOuter = x >= 0 && x < 7 && y >= 0 && y < 7;
        const border = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        cells[py * size + px] = inOuter && (border || core);
      }
    }
  };
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
  return cells;
}

/** 在 canvas 上真实绘制二维码图案 */
function drawQrCode(canvas: HTMLCanvasElement, text: string, scale = 8): void {
  const size = 21;
  const quiet = 4;
  const total = (size + quiet * 2) * scale;
  canvas.width = total;
  canvas.height = total;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, total, total);
  ctx.fillStyle = '#1f2937';
  const cells = qrMatrix(text);
  cells.forEach((filled, i) => {
    if (!filled) return;
    ctx.fillRect((i % size + quiet) * scale, (Math.floor(i / size) + quiet) * scale, scale, scale);
  });
}

/** 从当前档案的传记数据构建 EPUB 并返回文件名 */
function buildBiographyEpub(): { blob: Blob; filename: string } {
  const archiveId = localStorage.getItem('cj_current_archive_id') || 'default';
  let name = '主人公';
  try {
    const archives = JSON.parse(localStorage.getItem('cj_archives') || '[]') as { id: string; name: string }[];
    const current = archives.find((a) => a.id === archiveId);
    if (current?.name) name = current.name;
  } catch {
    // ignore
  }

  const saved = loadJson<{ title?: string; chapters?: { title: string; content: string }[] } | null>(
    `cj_biography_${archiveId}`,
    null
  );
  let chapters = (saved?.chapters || []).filter((c) => stripHtml(c.content || ''));

  if (chapters.length === 0) {
    const local = loadJson<ChapterData[]>(`cj_biography_chapters_${archiveId}`, []);
    chapters = local
      .filter((c) => c.status !== 'notGenerated' && stripHtml(c.content || ''))
      .map((c) => ({ title: c.title, content: c.content }));
  }
  if (chapters.length === 0) {
    chapters = [
      { title: '前言', content: '传记内容尚未生成。完成 AI 采访并生成传记章节后，导出的 EPUB 电子书将包含完整内容。' },
    ];
  }

  const title = saved?.title || `${name}传记`;
  return { blob: buildEpub(title, name, chapters), filename: `${title}.epub` };
}

export default function DigitalAssets() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [genState, setGenState] = useState<Record<string, GenState>>(() => {
    const empty: Record<string, GenState> = {};
    try {
      return localStorage.getItem(VIDEO_STATUS_KEY) === 'done' ? { video: 'done' } : empty;
    } catch {
      return empty;
    }
  });
  const [genProgress, setGenProgress] = useState<Record<string, number>>({});
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const [qrGenerated, setQrGenerated] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const qrLink = `${window.location.origin}${window.location.pathname}#/museum`;

  // PDF 导出高级选项（水印 / 查看密码 / 防复制防编辑），持久化到 localStorage
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const [pdfOptions, setPdfOptions] = useState<PdfExportOptions>(() => loadPdfOptions());

  const updatePdfOptions = (patch: Partial<PdfExportOptions>) => {
    const next = { ...pdfOptions, ...patch };
    setPdfOptions(next);
    try {
      localStorage.setItem(PDF_OPTIONS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    addToast('设置已保存，导出时将应用这些设置', 'success');
  };

  useEffect(() => {
    const map = timers.current;
    return () => {
      Object.values(map).forEach((t) => clearInterval(t));
    };
  }, []);

  const startGenerate = (key: string, label: string) => {
    if (genState[key] === 'generating') return;
    setGenState((prev) => ({ ...prev, [key]: 'generating' }));
    setGenProgress((prev) => ({ ...prev, [key]: 0 }));
    timers.current[key] = setInterval(() => {
      setGenProgress((prev) => {
        const next = Math.min(100, (prev[key] || 0) + Math.round(Math.random() * 18) + 6);
        if (next >= 100) {
          clearInterval(timers.current[key]);
          setGenState((s) => ({ ...s, [key]: 'done' }));
          if (key === 'video') {
            try {
              localStorage.setItem(VIDEO_STATUS_KEY, 'done');
            } catch {
              // ignore
            }
          }
          addToast(`${label}已生成，可下载`, 'success');
        }
        return { ...prev, [key]: next };
      });
    }, 400);
  };

  const handleDownload = (label: string) => {
    addToast(`${label}下载已开始（演示环境）`, 'success');
  };

  // EPUB：用当前档案的传记章节真实打包 EPUB 并触发浏览器下载
  const handleEpubDownload = () => {
    try {
      const { blob, filename } = buildBiographyEpub();
      downloadBlob(blob, filename);
      addToast(`《${filename}》已开始下载`, 'success');
    } catch {
      addToast('EPUB 生成失败，请稍后重试', 'error');
    }
  };

  // 二维码：canvas 真实绘制图案
  const handleGenerateQr = () => {
    setQrGenerated(true);
    // 等 canvas 渲染到 DOM 后再绘制
    requestAnimationFrame(() => {
      if (qrCanvasRef.current) drawQrCode(qrCanvasRef.current, qrLink);
    });
    addToast('码记二维码已生成', 'success');
  };

  // 二维码高清下载：canvas 转 PNG 触发浏览器下载
  const handleQrDownload = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    // 重新以更高分辨率绘制后导出
    drawQrCode(canvas, qrLink, 20);
    canvas.toBlob((blob) => {
      if (!blob) {
        addToast('二维码导出失败，请重试', 'error');
        return;
      }
      downloadBlob(blob, '传家世码记二维码.png');
      addToast('高清二维码已开始下载', 'success');
      // 恢复预览分辨率
      drawQrCode(canvas, qrLink);
    }, 'image/png');
  };

  const renderProgress = (key: string) => (
    <div className="digital-assets-progress-track">
      <div className="digital-assets-progress-fill" style={{ width: `${genProgress[key] || 0}%` }} />
    </div>
  );

  return (
    <div className="digital-assets-page">
      <header className="digital-assets-header">
        <h1><Package size={24} /> 数字资产交付</h1>
        <p>传记完成后，所有数字资产在此统一交付、下载与存证。</p>
      </header>

      <div className="digital-assets-grid">
        {ASSET_CARDS.map((card) => {
          const Icon = card.icon;
          const state = genState[card.key] || 'idle';
          return (
            <div className="digital-assets-card" key={card.key}>
              <div className="digital-assets-card-icon"><Icon size={28} /></div>
              <h3>{card.title}</h3>
              <p className="digital-assets-card-desc">{card.description}</p>
              <ul className="digital-assets-card-points">
                {card.points.map((p) => <li key={p}>{p}</li>)}
              </ul>

              {card.key === 'pdf' && (
                <>
                  <button className="btn btn-primary" onClick={() => navigate('/biography/print')}>
                    <Printer size={14} /> 查看 / 打印
                  </button>
                  <button
                    className="btn btn-ghost pdf-options-toggle"
                    onClick={() => setShowPdfOptions((v) => !v)}
                  >
                    <Settings2 size={14} /> 高级选项 {showPdfOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {showPdfOptions && (
                    <div className="pdf-options">
                      <div className="pdf-option-row">
                        <div className="pdf-option-label">
                          <span>添加水印</span>
                          {pdfOptions.watermark && <em className="pdf-watermark-preview">{PDF_WATERMARK_TEXT}</em>}
                        </div>
                        <label className="pdf-switch">
                          <input
                            type="checkbox"
                            checked={pdfOptions.watermark}
                            onChange={(e) => updatePdfOptions({ watermark: e.target.checked })}
                          />
                          <span className="pdf-switch-slider" />
                        </label>
                      </div>
                      <div className="pdf-option-row">
                        <div className="pdf-option-label"><span>查看密码</span></div>
                        <input
                          className="pdf-password-input"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="4-6 位数字"
                          value={pdfOptions.password}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setPdfOptions((prev) => {
                              const next = { ...prev, password: v };
                              try { localStorage.setItem(PDF_OPTIONS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
                              return next;
                            });
                          }}
                          onBlur={() => {
                            if (pdfOptions.password && pdfOptions.password.length < 4) {
                              addToast('密码需为 4-6 位数字', 'error');
                              updatePdfOptions({ password: '' });
                            } else if (pdfOptions.password) {
                              addToast('查看密码已设置，导出时将应用', 'success');
                            }
                          }}
                        />
                      </div>
                      <div className="pdf-option-row">
                        <div className="pdf-option-label"><span>防复制 / 防编辑</span></div>
                        <label className="pdf-switch">
                          <input
                            type="checkbox"
                            checked={pdfOptions.protect}
                            onChange={(e) => updatePdfOptions({ protect: e.target.checked })}
                          />
                          <span className="pdf-switch-slider" />
                        </label>
                      </div>
                      <p className="pdf-options-tip">以上设置将在导出 PDF 时生效（演示环境）。</p>
                    </div>
                  )}
                </>
              )}

              {card.key === 'epub' && (
                state === 'done' ? (
                  <button className="btn btn-primary" onClick={handleEpubDownload}>
                    <Download size={14} /> 下载 EPUB
                  </button>
                ) : (
                  <>
                    {state === 'generating' && renderProgress(card.key)}
                    <button className="btn btn-primary" disabled={state === 'generating'} onClick={() => startGenerate(card.key, 'EPUB 电子书')}>
                      <BookOpen size={14} /> {state === 'generating' ? `生成中 ${genProgress[card.key] || 0}%` : '生成 EPUB'}
                    </button>
                  </>
                )
              )}

              {card.key === 'hardcover' && (
                <button className="btn btn-outline" onClick={() => addToast('申请已提交，客服人员将在 1 个工作日内联系你', 'success')}>
                  <BookMarked size={14} /> 申请精装书制作
                </button>
              )}

              {card.key === 'video' && (
                <>
                  <div className="digital-assets-video-cover">
                    <Play size={28} />
                  </div>
                  {state === 'done' ? (
                    <button className="btn btn-primary" onClick={() => handleDownload('纪念短视频')}>
                      <Download size={14} /> 下载视频
                    </button>
                  ) : (
                    <>
                      {state === 'generating' && renderProgress(card.key)}
                      <button className="btn btn-primary" disabled={state === 'generating'} onClick={() => startGenerate(card.key, '纪念短视频')}>
                        <Video size={14} /> {state === 'generating' ? `生成中 ${genProgress[card.key] || 0}%` : '生成纪念视频'}
                      </button>
                    </>
                  )}
                </>
              )}

              {card.key === 'qrcode' && (
                <div className="digital-assets-qr-actions">
                  {qrGenerated && (
                    <div className="digital-assets-qr-preview">
                      <canvas ref={qrCanvasRef} className="digital-assets-qr-canvas" />
                      <span className="digital-assets-qr-link">扫码访问数字博物馆</span>
                    </div>
                  )}
                  <button className="btn btn-primary" onClick={handleGenerateQr}>
                    <QrCode size={14} /> {qrGenerated ? '重新生成二维码' : '生成二维码'}
                  </button>
                  <button className="btn btn-outline" disabled={!qrGenerated} onClick={handleQrDownload}>
                    <Download size={14} /> 高清下载
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div className="digital-assets-card digital-assets-evidence">
          <div className="digital-assets-card-icon"><ShieldCheck size={28} /></div>
          <h3>区块链存证</h3>
          <p className="digital-assets-card-desc">传记成品已上链存证，内容真实可信、不可篡改。</p>
          <div className="digital-assets-evidence-info">
            <div className="digital-assets-evidence-row">
              <span>存证哈希</span>
              <code>{BLOCKCHAIN_EVIDENCE.hash.slice(0, 20)}…{BLOCKCHAIN_EVIDENCE.hash.slice(-8)}</code>
            </div>
            <div className="digital-assets-evidence-row">
              <span>存证时间</span>
              <span>{BLOCKCHAIN_EVIDENCE.time}</span>
            </div>
            <div className="digital-assets-evidence-row">
              <span>存证链</span>
              <span>{BLOCKCHAIN_EVIDENCE.chain}</span>
            </div>
            <div className="digital-assets-evidence-row">
              <span>状态</span>
              <span className="digital-assets-evidence-status">
                <ShieldCheck size={12} /> {BLOCKCHAIN_EVIDENCE.status}
              </span>
            </div>
          </div>
          <button className="btn btn-outline digital-assets-evidence-btn" onClick={() => setShowEvidence(true)}>
            <ShieldCheck size={14} /> 查看存证
          </button>
        </div>
      </div>

      <Modal open={showEvidence} title="区块链存证信息" onClose={() => setShowEvidence(false)}>
        <div className="evidence-modal">
          <div className="evidence-modal-row">
            <span>存证哈希</span>
            <code className="evidence-modal-hash">{BLOCKCHAIN_EVIDENCE.hash}</code>
          </div>
          <div className="evidence-modal-row">
            <span>存证时间</span>
            <span>{BLOCKCHAIN_EVIDENCE.time}</span>
          </div>
          <div className="evidence-modal-row">
            <span>存证链</span>
            <span>{BLOCKCHAIN_EVIDENCE.chain}</span>
          </div>
          <div className="evidence-modal-row">
            <span>存证状态</span>
            <span className="digital-assets-evidence-status">
              <ShieldCheck size={12} /> {BLOCKCHAIN_EVIDENCE.status}
            </span>
          </div>
          <p className="evidence-modal-tip">
            传记成品文件哈希已写入{BLOCKCHAIN_EVIDENCE.chain}，链上记录不可篡改，可作为内容真实性与创作时间的存证依据。
          </p>
        </div>
      </Modal>
    </div>
  );
}
