import { ArrowLeft, Calendar, MapPin, Tag, Image as ImageIcon, FileText, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '../hooks/useToast';
import './EventEdit.css';

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
  const detail = eventDetails[safeYear] ?? eventDetails['1992'];
  const [title, setTitle] = useState(detail.title);
  const [content, setContent] = useState(detail.content);
  const [tags, setTags] = useState(detail.tags);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [preview, setPreview] = useState<{ title: string; type: string } | null>(null);

  return (
    <div className="detail-page event-edit-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">编辑事件：{safeYear}年</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">事件信息</h3>
          <button className="btn btn-primary" onClick={() => addToast('事件已保存', 'success')}><Save size={14} /> 保存</button>
        </div>
        <div className="card-body event-edit-body">
          <div className="form-row">
            <label><Calendar size={14} /> 年份</label>
            <input type="text" value={safeYear} readOnly />
          </div>
          <div className="form-row">
            <label><Tag size={14} /> 事件标题</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-row">
            <label><MapPin size={14} /> 副标题</label>
            <input type="text" defaultValue={detail.subtitle} />
          </div>
          <div className="form-row form-row-vertical">
            <label><FileText size={14} /> 事件描述</label>
            <textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <div className="form-row form-row-vertical">
            <label><Tag size={14} /> 标签</label>
            <div className="edit-tags">
              {tags.map((t) => (
                <span key={t} className="edit-tag">{t}</span>
              ))}
              {showTagInput ? (
                <span className="tag-input-wrap">
                  <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="标签" onKeyDown={(e) => { if (e.key === 'Enter') { const tag = newTag.trim(); if (tag) { setTags((prev) => [...prev, tag]); setNewTag(''); setShowTagInput(false); } } }} autoFocus />
                  <button onClick={() => { const tag = newTag.trim(); if (tag) { setTags((prev) => [...prev, tag]); setNewTag(''); setShowTagInput(false); } }}>保存</button>
                  <button onClick={() => { setShowTagInput(false); setNewTag(''); }}>取消</button>
                </span>
              ) : (
                <button className="edit-tag add" onClick={() => setShowTagInput(true)}>+ 添加标签</button>
              )}
            </div>
          </div>
          <div className="form-row form-row-vertical">
            <label><ImageIcon size={14} /> 附件与照片</label>
            <div className="edit-attachments">
              <div className="edit-attach-item" onClick={() => setPreview({ type: 'doc', title: '创业计划书.pdf' })}><FileText size={16} /> 创业计划书.pdf</div>
              <div className="edit-attach-item" onClick={() => setPreview({ type: 'image', title: '老照片.jpg' })}><ImageIcon size={16} /> 老照片.jpg</div>
              <label className="edit-attach-item add" style={{ cursor: 'pointer' }}>
                <input type="file" hidden onChange={() => addToast('附件上传成功', 'success')} />
                + 上传附件
              </label>
            </div>
          </div>
        </div>
      </div>
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>{preview.title}</h4><button className="modal-close" onClick={() => setPreview(null)}>关闭</button></div>
            <div className="modal-body preview-body">
              {preview.type === 'image' && <div className="preview-image"><ImageIcon size={64} /></div>}
              {preview.type === 'doc' && <div className="preview-doc"><FileText size={48} /></div>}
              <p>正在预览：{preview.title}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
