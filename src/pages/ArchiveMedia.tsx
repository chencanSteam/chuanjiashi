import { useState } from 'react';
import { ArrowLeft, Image, Play, FileText, Music, Plus, Download, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { generateImageDataUrl, generateVideoPoster, generateAudioUrl } from '../utils/mediaPlaceholder';
import './ArchiveMedia.css';

const mediaItems = [
  { title: '家庭合影', date: '2024-05-01', type: 'image' },
  { title: '公司年会视频', date: '2023-12-20', type: 'video' },
  { title: '个人演讲稿.pdf', date: '2023-06-18', type: 'doc' },
  { title: '家庭旅行', date: '2022-08-15', type: 'image' },
  { title: '春节团圆', date: '2024-02-10', type: 'image' },
  { title: '创业访谈录音', date: '2023-09-05', type: 'audio' },
  { title: '家训手稿', date: '2022-11-11', type: 'doc' },
  { title: '成长纪念册', date: '2021-06-01', type: 'image' },
];

const filters = ['全部', '照片', '视频', '音频', '文档'];

export default function ArchiveMedia() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [mediaFilter, setMediaFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<{ title: string; type: string } | null>(null);

  const filteredItems = mediaItems.filter((m) => {
    const typeMap: Record<string, string> = { image: '照片', video: '视频', audio: '音频', doc: '文档' };
    const typeOk = mediaFilter === '全部' || typeMap[m.type] === mediaFilter;
    const searchOk = m.title.includes(search);
    return typeOk && searchOk;
  });

  const iconMap: Record<string, typeof Image> = {
    image: Image,
    video: Play,
    doc: FileText,
    audio: Music,
  };

  return (
    <div className="detail-page archive-media-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">多媒体档案库</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">全部素材（2,345）</h3>
          <label className="btn btn-primary">
            <Plus size={14} /> 上传
            <input type="file" hidden onChange={() => addToast('素材上传成功', 'success')} />
          </label>
        </div>
        <div className="card-body">
          <div className="media-toolbar">
            <div className="media-search">
              <Search size={14} />
              <input type="text" placeholder="搜索素材名称" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="media-filters">
              {filters.map((f) => (
                <button key={f} className={`media-filter ${f === mediaFilter ? 'active' : ''}`} onClick={() => setMediaFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className="archive-media-grid">
            {filteredItems.map((m, i) => {
              const Icon = iconMap[m.type] ?? Image;
              return (
                <div className="archive-media-item" key={i} onClick={() => setPreview({ title: m.title, type: m.type })}>
                  <div className="archive-media-thumb"><Icon size={24} /></div>
                  <div className="archive-media-title">{m.title}</div>
                  <div className="archive-media-date">{m.date}</div>
                  <button className="archive-media-download" onClick={(e) => { e.stopPropagation(); addToast('开始下载素材', 'success'); }}><Download size={14} /></button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>{preview.title}</h4><button className="modal-close" onClick={() => setPreview(null)}>关闭</button></div>
            <div className="modal-body preview-body">
              {preview.type === 'image' && <img className="preview-image" src={generateImageDataUrl(preview.title)} alt={preview.title} />}
              {preview.type === 'video' && <video className="preview-video" controls poster={generateVideoPoster(preview.title)} />}
              {preview.type === 'audio' && <audio className="preview-audio" controls src={generateAudioUrl()} />}
              {preview.type === 'doc' && <div className="preview-doc"><FileText size={48} /></div>}
              <p>正在预览：{preview.title}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
