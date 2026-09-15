import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Upload,
  Image,
  FileText,
  Music,
  Play,
  Trash2,
} from 'lucide-react';
import { loadStoredEventsForArchive, type StoredTimelineEventData } from '../../utils/timelineSample';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import { loadLegacyArchives, resolveCurrentArchiveId } from '../../utils/mobileArchives';
import Annotate from '../../components/annotation/Annotate';
import './MobileArchive.css';
import './MobileEventDetail.css';

type MediaType = 'image' | 'video' | 'audio' | 'doc';

interface MediaItem {
  id: string;
  title: string;
  date: string;
  type: MediaType;
  stage?: string;
  dataUrl?: string;
}

const MEDIA_ACCEPT = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';

function formatYear(event: StoredTimelineEventData): string {
  return event.endYear && event.endYear !== event.year
    ? `${event.year} - ${event.endYear}`
    : event.year;
}

function loadMediaItems(archiveId: string): MediaItem[] {
  try {
    const raw = localStorage.getItem(`cj_media_${archiveId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function deriveMediaType(file: File): MediaType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'doc';
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
}

function mediaIcon(type: MediaType, size = 18) {
  if (type === 'image') return <Image size={size} />;
  if (type === 'video') return <Play size={size} />;
  if (type === 'audio') return <Music size={size} />;
  return <FileText size={size} />;
}

export default function MobileEventDetail() {
  const navigate = useNavigate();
  const { year = '' } = useParams();
  const { addToast } = useToast();
  const allArchives = useMemo(() => loadLegacyArchives(), []);
  const archiveId = resolveCurrentArchiveId(allArchives) || 'default';
  const [loaded, setLoaded] = useState(false);
  const [event, setEvent] = useState<StoredTimelineEventData | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    const found = loadStoredEventsForArchive(archiveId).find((item) => item.year === year) || null;
    setEvent(found);
    setMediaItems(loadMediaItems(archiveId));
    setLoaded(true);
  }, [archiveId, year]);

  const stage = event ? `${event.year}·${event.title}` : '';
  const relatedMedia = mediaItems.filter((item) => item.stage === stage);

  const persistMedia = (next: MediaItem[]) => {
    localStorage.setItem(`cj_media_${archiveId}`, JSON.stringify(next));
    setMediaItems(next);
  };

  const openUpload = () => {
    setPendingMedia([]);
    setUploadOpen(true);
  };

  const selectFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList || []).slice(0, 5);
    if (!files.length) return;
    if (Array.from(fileList || []).length > 5) addToast('一次最多上传 5 个文件，已保留前 5 个', 'info');
    try {
      const next = await Promise.all(files.map(async (file) => {
        if (file.size > 5 * 1024 * 1024) throw new Error(`「${file.name}」超过 5MB 限制`);
        const type = deriveMediaType(file);
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: file.name,
          date: new Date().toISOString().slice(0, 10),
          type,
          dataUrl: type === 'image' ? await readAsDataUrl(file) : undefined,
        } satisfies MediaItem;
      }));
      setPendingMedia(next);
    } catch (error: any) {
      addToast(error?.message || '文件读取失败', 'error');
    }
  };

  const confirmUpload = () => {
    if (!pendingMedia.length) {
      addToast('请先选择要上传的文件', 'error');
      return;
    }
    persistMedia([...mediaItems, ...pendingMedia.map((item) => ({ ...item, stage: stage || undefined }))]);
    setUploadOpen(false);
    setPendingMedia([]);
    addToast(`已上传 ${pendingMedia.length} 个素材`, 'success');
  };

  const deleteMedia = (item: MediaItem) => {
    if (!window.confirm(`确定删除「${item.title}」吗？`)) return;
    persistMedia(mediaItems.filter((media) => media.id !== item.id));
    addToast('素材已删除', 'success');
  };

  if (loaded && !event) {
    return (
      <div className="mobile-event-detail-page">
        <button className="mobile-event-back" type="button" onClick={() => navigate('/m/archive')}>
          <ChevronLeft size={16} /> 返回档案
        </button>
        <div className="mobile-archive-empty">
          <p>未找到该人生事件，可能已被删除</p>
          <button className="mobile-archive-primary-btn" type="button" onClick={() => navigate('/m/archive')}>返回人生档案</button>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="mobile-event-detail-page">
      <button className="mobile-event-back" type="button" onClick={() => navigate('/m/archive')}>
        <ChevronLeft size={16} /> 返回档案
      </button>

      <Annotate id="mobile-event-detail.info">
        <section className="mobile-event-detail">
          <div className="mobile-event-detail-head">
            <div>
              <span>{formatYear(event)}</span>
              <h4>{event.title}</h4>
            </div>
            <button className="mobile-archive-outline-btn" type="button" onClick={openUpload}><Upload size={14} /> 上传资料</button>
          </div>
          <p>{event.desc || '暂未填写事件描述'}</p>

          <Annotate id="mobile-event-detail.media">
            <div className="mobile-event-detail-media">
              <div className="mobile-event-media-grid">
                {relatedMedia.filter((item) => item.type === 'image').map((item) => (
                  <div className="mobile-event-image" key={item.id}>
                    {item.dataUrl ? <img src={item.dataUrl} alt={item.title} /> : <Image size={22} />}
                  </div>
                ))}
                {relatedMedia.length === 0 && <span className="mobile-event-media-empty">暂未关联资料</span>}
              </div>
              {relatedMedia.length > 0 && (
                <div className="mobile-media-list mobile-event-media-list">
                  {relatedMedia.map((item) => (
                    <article className="mobile-media-item" key={item.id}>
                      <div className={`mobile-media-preview ${item.type}`}>
                        {item.type === 'image' && item.dataUrl ? <img src={item.dataUrl} alt={item.title} /> : mediaIcon(item.type, 22)}
                      </div>
                      <div className="mobile-media-info">
                        <strong>{item.title}</strong>
                        <span>{item.date}</span>
                      </div>
                      <button className="mobile-media-delete" type="button" title="删除素材" onClick={() => deleteMedia(item)}><Trash2 size={15} /></button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </Annotate>
        </section>
      </Annotate>

      <Modal
        open={uploadOpen}
        title="上传素材"
        onClose={() => setUploadOpen(false)}
        footer={<div className="mobile-archive-modal-actions"><button className="mobile-archive-modal-btn" type="button" onClick={() => setUploadOpen(false)}>取消</button><button className="mobile-archive-modal-btn primary" type="button" onClick={confirmUpload}>确认上传</button></div>}
      >
        <div className="mobile-upload-form">
          <label className="mobile-upload-picker" htmlFor="mobile-event-upload">
            <Upload size={22} />
            <span>{pendingMedia.length ? `已选择 ${pendingMedia.length} 个文件` : '选择图片、视频、音频或文档'}</span>
            <small>图片将保存在本机原型中，单个文件不超过 5MB</small>
          </label>
          <input id="mobile-event-upload" type="file" accept={MEDIA_ACCEPT} multiple hidden onChange={(e) => { void selectFiles(e.target.files); e.target.value = ''; }} />
          {pendingMedia.length > 0 && <div className="mobile-upload-pending">{pendingMedia.map((item) => <span key={item.id}>{mediaIcon(item.type, 14)} {item.title}</span>)}</div>}
          <label>关联人生阶段<input value={`${formatYear(event)} · ${event.title}`} readOnly /></label>
        </div>
      </Modal>
    </div>
  );
}
