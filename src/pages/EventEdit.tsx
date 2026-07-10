import { ArrowLeft, Calendar, MapPin, Tag, Image as ImageIcon, FileText, Save, X, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { familyApi } from '../api/family';
import { generateImageDataUrl } from '../utils/mediaPlaceholder';
import './EventEdit.css';

interface ArchiveEvent {
  year: string;
  endYear?: string;
  title: string;
  desc: string;
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
  const loadSaved = (): typeof detail => {
    const saved = localStorage.getItem(`event-${archiveId}-${safeYear}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          title: parsed.title ?? detail.title,
          subtitle: parsed.subtitle ?? detail.subtitle,
          content: parsed.content ?? detail.content,
          tags: parsed.tags ?? detail.tags,
        };
      } catch { /* ignore */ }
    }
    return detail;
  };
  const initial = loadSaved();
  const [archiveEvents, setArchiveEvents] = useState<ArchiveEvent[]>(() => loadArchiveEvents(archiveId));
  const currentEvent = archiveEvents.find((e) => e.year === safeYear);
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [content, setContent] = useState(initial.content);
  const [tags, setTags] = useState(initial.tags);
  const [endYear, setEndYear] = useState(currentEvent?.endYear ?? '');
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [preview, setPreview] = useState<{ title: string; type: string } | null>(null);

  const saveEvent = async () => {
    localStorage.setItem(`event-${archiveId}-${safeYear}`, JSON.stringify({ title, subtitle, content, tags }));
    const nextEvents = archiveEvents.map((e) =>
      e.year === safeYear ? { ...e, endYear: endYear.trim() || undefined } : e
    );
    localStorage.setItem(`cj_events_${archiveId}`, JSON.stringify(nextEvents));
    setArchiveEvents(nextEvents);
    try {
      await familyApi.syncPlace(archiveId, subtitle, safeYear, title);
    } catch {}
    addToast('事件已保存', 'success');
    navigate(-1);
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag) {
      setTags((prev) => [...prev, tag]);
      setNewTag('');
      setShowTagInput(false);
    }
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
              <input type="text" value={safeYear} readOnly />
            </div>
            <div className="form-field">
              <label><Calendar size={14} /> 结束年份</label>
              <input type="text" value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="可选，如 1998" />
            </div>
            <div className="form-field">
              <label><Tag size={14} /> 事件标题</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：创业、结婚、退休" />
            </div>
            <div className="form-field">
              <label><MapPin size={14} /> 副标题</label>
              <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="补充地点或简要说明" />
            </div>
            <div className="form-field form-field-full">
              <label><FileText size={14} /> 事件描述</label>
              <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="记录这个人生阶段的详细故事…" />
            </div>
            <div className="form-field form-field-full">
              <label><Tag size={14} /> 标签</label>
              <div className="edit-tags">
                {tags.map((t) => (
                  <span key={t} className="edit-tag">
                    {t}
                    <button className="edit-tag-remove" onClick={() => removeTag(t)} title="移除">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {showTagInput ? (
                  <span className="tag-input-wrap">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="输入标签"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      autoFocus
                    />
                    <button onClick={addTag}>保存</button>
                    <button onClick={() => { setShowTagInput(false); setNewTag(''); }}>取消</button>
                  </span>
                ) : (
                  <button className="edit-tag add" onClick={() => setShowTagInput(true)}>+ 添加标签</button>
                )}
              </div>
            </div>
            <div className="form-field form-field-full">
              <label><ImageIcon size={14} /> 附件与照片</label>
              <div className="edit-attachments">
                <div className="edit-attach-item" onClick={() => setPreview({ type: 'doc', title: '创业计划书.pdf' })}>
                  <div className="edit-attach-icon doc"><FileText size={18} /></div>
                  <div className="edit-attach-name">创业计划书.pdf</div>
                  <div className="edit-attach-meta">文档</div>
                </div>
                <div className="edit-attach-item" onClick={() => setPreview({ type: 'image', title: '老照片.jpg' })}>
                  <div className="edit-attach-icon image"><ImageIcon size={18} /></div>
                  <div className="edit-attach-name">老照片.jpg</div>
                  <div className="edit-attach-meta">图片</div>
                </div>
                <label className="edit-attach-item edit-attach-upload">
                  <Upload size={20} />
                  <span>上传附件</span>
                  <input type="file" hidden onChange={() => addToast('附件上传成功', 'success')} />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>{preview.title}</h4><button className="modal-close" onClick={() => setPreview(null)}>关闭</button></div>
            <div className="modal-body preview-body">
              {preview.type === 'image' && <img className="preview-image" src={generateImageDataUrl(preview.title)} alt={preview.title} />}
              {preview.type === 'doc' && <div className="preview-doc"><FileText size={48} /></div>}
              <p>正在预览：{preview.title}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
