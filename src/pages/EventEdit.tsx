import { ArrowLeft, Calendar, Tag, Image as ImageIcon, FileText, Save, X, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { downloadDataUrl } from '../utils/albumStorage';
import './EventEdit.css';

interface ArchiveEvent {
  year: string;
  endYear?: string;
  title: string;
  desc: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  mime: string;
  dataUrl?: string;
}

const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024; // 2MB

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${bytes}B`;
}

function readAttachments(files: FileList): Promise<Attachment[]> {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<Attachment>((resolve) => {
          const base = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: file.name, size: file.size, mime: file.type || 'application/octet-stream' };
          if (file.size > MAX_ATTACHMENT_SIZE) {
            resolve({ ...base });
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve({ ...base, dataUrl: String(reader.result) });
          reader.onerror = () => resolve({ ...base });
          reader.readAsDataURL(file);
        }),
    ),
  );
}

function loadArchiveEvents(archiveId: string): ArchiveEvent[] {
  try {
    const raw = localStorage.getItem(`cj_events_${archiveId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function formatYearRange(year: string, endYear?: string): string {
  if (endYear && endYear !== year) return `${year} - ${endYear}`;
  return year;
}

const eventDetails: Record<string, { title: string; subtitle: string; content: string; tags: string[] }> = {
  '1958': { title: '出生', subtitle: '出生于江苏苏州', content: '1958年3月12日，张明远出生于江苏苏州一个普通的教师家庭。', tags: ['出生', '苏州', '童年'] },
  '1992': { title: '创业', subtitle: '创立明远机械有限公司', content: '在国家改革开放的浪潮中，辞去稳定的工作，与两位合作伙伴共同创立明远机械有限公司，专注于精密零部件加工与设备研发。', tags: ['创业初心', '精密制造', '团队协作', '创新突破'] },
  '2020': { title: '退休', subtitle: '享受生活', content: '2020年，张明远正式退休，将公司交给年轻一代打理。', tags: ['退休', '传承', '家庭'] },
  '2024': { title: '当下', subtitle: '持续学习，传承家风', content: '如今，张明远坚持每日读书、练字，并通过「传家世」平台记录人生故事。', tags: ['当下', '家风', '传承'] },
};

export default function EventEdit() {
  const navigate = useNavigate();
  const { year } = useParams<{ year: string }>();
  const { addToast } = useToast();
  const safeYear = year ?? '1992';
  const archiveId = localStorage.getItem('cj_current_archive_id') ?? 'default';
  const detail = eventDetails[safeYear] ?? eventDetails['1992'];
  const loadSaved = (): typeof detail & { attachments: Attachment[] } => {
    const saved = localStorage.getItem(`event-${archiveId}-${safeYear}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          title: parsed.title ?? detail.title,
          subtitle: parsed.subtitle ?? detail.subtitle,
          content: parsed.content ?? detail.content,
          tags: parsed.tags ?? detail.tags,
          attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
        };
      } catch { /* ignore */ }
    }
    return { ...detail, attachments: [] };
  };
  const initial = loadSaved();
  const [archiveEvents, setArchiveEvents] = useState<ArchiveEvent[]>(() => loadArchiveEvents(archiveId));
  const currentEvent = archiveEvents.find((e) => e.year === safeYear);
  const [startYear, setStartYear] = useState(safeYear);
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [endYear, setEndYear] = useState(currentEvent?.endYear ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(initial.attachments);
  const [preview, setPreview] = useState<Attachment | null>(null);

  // 年份下拉选项
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1899 }, (_, i) => String(currentYear - i));

  const saveEvent = async () => {
    if (startYear !== safeYear) {
      localStorage.removeItem(`event-${archiveId}-${safeYear}`);
    }
    localStorage.setItem(`event-${archiveId}-${startYear}`, JSON.stringify({ title, subtitle: '', content, tags: [], attachments }));
    const nextEvents = archiveEvents.map((e) =>
      e.year === safeYear ? { ...e, year: startYear, endYear: endYear || undefined } : e
    );
    localStorage.setItem(`cj_events_${archiveId}`, JSON.stringify(nextEvents));
    setArchiveEvents(nextEvents);
    addToast('事件已保存', 'success');
    navigate(-1);
  };

  return (
    <div className="detail-page event-edit-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">编辑事件：{formatYearRange(safeYear, endYear || currentEvent?.endYear)}年</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">事件信息</h3>
          <button className="btn btn-primary" onClick={saveEvent}><Save size={14} /> 保存</button>
        </div>
        <div className="card-body event-edit-body">
          <div className="event-edit-form">
            <div className="form-field form-field-year">
              <label><Calendar size={14} /> 开始年份</label>
              <select value={startYear} onChange={(e) => setStartYear(e.target.value)}>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label><Calendar size={14} /> 结束年份</label>
              <select value={endYear} onChange={(e) => setEndYear(e.target.value)}>
                <option value="">（可选）</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label><Tag size={14} /> 事件标题</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：创业、结婚、退休" />
            </div>
            <div className="form-field form-field-full">
              <label><FileText size={14} /> 事件描述</label>
              <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="记录这个人生阶段的详细故事…" />
            </div>
            <div className="form-field form-field-full">
              <label><ImageIcon size={14} /> 附件与照片</label>
              <div className="edit-attachments">
                {attachments.map((att) => {
                  const isImage = att.mime.startsWith('image/');
                  return (
                    <div className="edit-attach-item" key={att.id} onClick={() => setPreview(att)}>
                      <div className={`edit-attach-icon ${isImage ? 'image' : 'doc'}`}>{isImage ? <ImageIcon size={18} /> : <FileText size={18} />}</div>
                      <div className="edit-attach-name">{att.name}</div>
                      <div className="edit-attach-meta">{isImage ? '图片' : '文档'} · {formatSize(att.size)}</div>
                      <button
                        className="edit-tag-remove"
                        title="删除附件"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachments((prev) => prev.filter((a) => a.id !== att.id));
                          addToast('附件已删除', 'info');
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
                <label className="edit-attach-item edit-attach-upload">
                  <Upload size={20} />
                  <span>上传附件</span>
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={async (e) => {
                      if (!e.target.files || e.target.files.length === 0) return;
                      const oversized = Array.from(e.target.files).filter((f) => f.size > MAX_ATTACHMENT_SIZE);
                      if (oversized.length > 0) addToast(`${oversized.length} 个文件超过 2MB，仅保存文件信息`, 'info');
                      const added = await readAttachments(e.target.files);
                      setAttachments((prev) => [...prev, ...added]);
                      e.target.value = '';
                      addToast(`已添加 ${added.length} 个附件，保存事件后生效`, 'success');
                    }}
                  />
                </label>
              </div>
              {attachments.length === 0 && <div className="edit-attach-empty">暂无附件，点击「上传附件」添加（单个不超过 2MB）</div>}
            </div>
          </div>
        </div>
      </div>
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>{preview.name}</h4><button className="modal-close" onClick={() => setPreview(null)}>关闭</button></div>
            <div className="modal-body preview-body">
              {preview.mime.startsWith('image/') && preview.dataUrl && <img className="preview-image" src={preview.dataUrl} alt={preview.name} />}
              {!preview.mime.startsWith('image/') && <div className="preview-doc"><FileText size={48} /></div>}
              <p>正在预览：{preview.name}（{formatSize(preview.size)}）</p>
              {preview.dataUrl && (
                <button className="btn btn-outline" onClick={() => downloadDataUrl(preview.dataUrl!, preview.name)}><Upload size={14} /> 下载附件</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
