import { useEffect, useState } from 'react';
import { ArrowLeft, Image, Play, FileText, Music, Plus, Download, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { generateImageDataUrl, generateVideoPoster, generateAudioUrl } from '../utils/mediaPlaceholder';
import './ArchiveMedia.css';

const STORAGE_KEY_CURRENT_ARCHIVE = 'cj_current_archive_id';
const STORAGE_KEY_MEDIA_PREFIX = 'cj_media_';
const STORAGE_KEY_ROLE = 'cj_current_role';

const DEFAULT_ARCHIVE_ID = 'default';

interface MediaItem {
  id: string;
  title: string;
  date: string;
  type: 'image' | 'video' | 'audio' | 'doc';
  stage?: string;
}

const defaultMediaItems: MediaItem[] = [
  { id: '1', title: '家庭合影', date: '2024-05-01', type: 'image' },
  { id: '2', title: '公司年会视频', date: '2023-12-20', type: 'video' },
  { id: '3', title: '个人演讲稿.pdf', date: '2023-06-18', type: 'doc' },
  { id: '4', title: '家庭旅行', date: '2022-08-15', type: 'image' },
  { id: '5', title: '春节团圆', date: '2024-02-10', type: 'image' },
  { id: '6', title: '创业访谈录音', date: '2023-09-05', type: 'audio' },
  { id: '7', title: '家训手稿', date: '2022-11-11', type: 'doc' },
  { id: '8', title: '成长纪念册', date: '2021-06-01', type: 'image' },
];

const filters = ['全部', '照片', '视频', '音频', '文档'];

function getArchiveId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_ARCHIVE);
    if (saved) return saved;
  } catch { /* ignore */ }
  return DEFAULT_ARCHIVE_ID;
}

function loadMediaItems(archiveId: string): MediaItem[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_MEDIA_PREFIX}${archiveId}`);
    if (raw) return JSON.parse(raw) as MediaItem[];
  } catch { /* ignore */ }
  return archiveId === DEFAULT_ARCHIVE_ID ? defaultMediaItems : [];
}

function saveMediaItems(archiveId: string, items: MediaItem[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY_MEDIA_PREFIX}${archiveId}`, JSON.stringify(items));
  } catch { /* ignore */ }
}

function getRole(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ROLE);
    if (saved) return saved;
  } catch { /* ignore */ }
  return '';
}

function deriveType(name: string): MediaItem['type'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'mkv'];
  const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'];
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  return 'doc';
}

const typeMap: Record<string, string> = { image: '照片', video: '视频', audio: '音频', doc: '文档' };

const iconMap: Record<string, typeof Image> = {
  image: Image,
  video: Play,
  doc: FileText,
  audio: Music,
};

export default function ArchiveMedia() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const archiveId = getArchiveId();
  const role = getRole();
  const isObserver = role === '观察者';

  const [items, setItems] = useState<MediaItem[]>(() => loadMediaItems(archiveId));
  const [mediaFilter, setMediaFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<MediaItem | null>(null);

  useEffect(() => {
    saveMediaItems(archiveId, items);
  }, [archiveId, items]);

  const filteredItems = items.filter((m) => {
    const typeOk = mediaFilter === '全部' || typeMap[m.type] === mediaFilter;
    const searchOk = m.title.toLowerCase().includes(search.toLowerCase());
    return typeOk && searchOk;
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newItem: MediaItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: file.name,
      date: new Date().toISOString().split('T')[0],
      type: deriveType(file.name),
    };

    setItems((prev) => [...prev, newItem]);
    addToast('素材上传成功', 'success');
    e.target.value = '';
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((item) => item.id !== id));
    addToast('素材已删除', 'success');
  };

  const renderThumb = (item: MediaItem) => {
    if (item.type === 'image') {
      return <img src={generateImageDataUrl(item.title)} alt={item.title} className="archive-media-thumb-media" />;
    }
    if (item.type === 'video') {
      return (
        <div className="archive-media-thumb-video">
          <img src={generateVideoPoster(item.title)} alt={item.title} className="archive-media-thumb-media" />
          <Play size={24} className="archive-media-thumb-overlay-icon" />
        </div>
      );
    }
    const Icon = iconMap[item.type] ?? FileText;
    return (
      <div className="archive-media-thumb-placeholder">
        <img src={generateImageDataUrl(item.title)} alt={item.title} className="archive-media-thumb-media" />
        <Icon size={24} className="archive-media-thumb-overlay-icon" />
      </div>
    );
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
          <h3 className="card-title">全部素材（{items.length}）</h3>
          {!isObserver && (
            <label className="btn btn-primary">
              <Plus size={14} /> 上传素材
              <input type="file" hidden accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" onChange={handleUpload} />
            </label>
          )}
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

          {filteredItems.length === 0 ? (
            <div className="archive-media-empty">
              <Image size={40} />
              <p>暂无符合条件的素材</p>
              {!isObserver && (
                <label className="btn btn-primary archive-media-empty-upload">
                  <Plus size={14} /> 上传素材
                  <input type="file" hidden accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" onChange={handleUpload} />
                </label>
              )}
            </div>
          ) : (
            <div className="archive-media-grid">
              {filteredItems.map((m) => (
                <div className="archive-media-item" key={m.id} onClick={() => setPreview(m)}>
                  <div className="archive-media-thumb">{renderThumb(m)}</div>
                  <div className="archive-media-title">{m.title}</div>
                  <div className="archive-media-date">{m.date}</div>
                  {m.stage && <div className="archive-media-stage">{m.stage}</div>}
                  <button className="archive-media-download" onClick={(e) => { e.stopPropagation(); addToast('开始下载素材', 'success'); }}><Download size={14} /></button>
                  {!isObserver && (
                    <button className="archive-media-delete" onClick={(e) => handleDelete(e, m.id)} title="删除">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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
