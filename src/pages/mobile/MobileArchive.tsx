import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Briefcase,
  Clock,
  Pencil,
  Plus,
  PlusCircle,
  Trash2,
  Upload,
  Image,
  FileText,
  Music,
  Play,
} from 'lucide-react';
import { loadStoredEventsForArchive, type StoredTimelineEventData } from '../../utils/timelineSample';
import { archiveApi } from '../../api/archive';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import { loadLegacyArchives, resolveCurrentArchiveId, saveLegacyArchives, setCurrentArchiveId } from '../../utils/mobileArchives';
import Annotate from '../../components/annotation/Annotate';
import './MobileArchive.css';

type MediaType = 'image' | 'video' | 'audio' | 'doc';
type ArchiveTab = 'timeline' | 'media';

interface MediaItem {
  id: string;
  title: string;
  date: string;
  type: MediaType;
  stage?: string;
  dataUrl?: string;
}

interface EventForm {
  year: string;
  endYear: string;
  title: string;
  desc: string;
}

const EMPTY_EVENT_FORM: EventForm = { year: '', endYear: '', title: '', desc: '' };
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

export default function MobileArchive() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const allArchives = useMemo(() => loadLegacyArchives(), []);
  const [currentArchiveId, setCurrentArchiveIdState] = useState(() => resolveCurrentArchiveId(allArchives));
  const archive = allArchives.find((item) => item.id === currentArchiveId) || null;
  const archiveId = archive?.id || 'default';
  const [activeTab, setActiveTab] = useState<ArchiveTab>('timeline');
  const [events, setEvents] = useState<StoredTimelineEventData[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | MediaType>('all');

  const [editOpen, setEditOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', gender: '男' as '男' | '女', birthYear: '', origin: '', occupation: '' });
  const [eventOpen, setEventOpen] = useState(false);
  const [editingEventYear, setEditingEventYear] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<EventForm>(EMPTY_EVENT_FORM);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<MediaItem[]>([]);
  const [uploadStage, setUploadStage] = useState('');

  useEffect(() => {
    const list = loadStoredEventsForArchive(archiveId).slice().sort((a, b) => Number(a.year) - Number(b.year));
    setEvents(list);
    setMediaItems(loadMediaItems(archiveId));
    setSelectedYear(list[0]?.year || '');
    setActiveTab('timeline');
  }, [archiveId]);

  const selectedEvent = events.find((item) => item.year === selectedYear) || null;
  const relatedMedia = selectedEvent
    ? mediaItems.filter((item) => item.stage === `${selectedEvent.year}·${selectedEvent.title}`)
    : [];
  const filteredMedia = mediaFilter === 'all' ? mediaItems : mediaItems.filter((item) => item.type === mediaFilter);

  const persistEvents = (next: StoredTimelineEventData[]) => {
    const sorted = next.slice().sort((a, b) => Number(a.year) - Number(b.year));
    localStorage.setItem(`cj_events_${archiveId}`, JSON.stringify(sorted));
    setEvents(sorted);
  };

  const persistMedia = (next: MediaItem[]) => {
    localStorage.setItem(`cj_media_${archiveId}`, JSON.stringify(next));
    setMediaItems(next);
  };

  const switchArchive = (id: string) => {
    if (!id || id === currentArchiveId) return;
    setCurrentArchiveId(id);
    setCurrentArchiveIdState(id);
  };

  const openProfileEdit = () => {
    if (!archive) return;
    setProfileForm({
      name: archive.name,
      gender: archive.gender || '男',
      birthYear: archive.birthYear,
      origin: archive.origin,
      occupation: archive.occupation,
    });
    setEditOpen(true);
  };

  const saveProfileEdit = async () => {
    const name = profileForm.name.trim();
    const birthYear = profileForm.birthYear.trim();
    if (!name || !/^\d{4}$/.test(birthYear)) {
      addToast('请填写姓名和 4 位出生年份', 'error');
      return;
    }
    if (!archive) return;
    const patch = {
      name,
      gender: profileForm.gender,
      birthYear,
      origin: profileForm.origin.trim(),
      occupation: profileForm.occupation.trim(),
    };
    try {
      const updated = await archiveApi.update(archive.id, {
        name,
        gender: profileForm.gender === '女' ? 'female' : 'male',
        birthDate: `${birthYear}-01-01`,
        birthPlace: patch.origin,
      });
      saveLegacyArchives(allArchives.map((item) => item.id === archive.id ? { ...item, ...patch, updatedAt: updated.updatedAt } : item));
      setEditOpen(false);
      addToast('档案资料已保存', 'success');
      window.location.reload();
    } catch (error: any) {
      addToast(error?.message || '保存档案失败', 'error');
    }
  };

  const openNewEvent = () => {
    setEditingEventYear(null);
    setEventForm(EMPTY_EVENT_FORM);
    setEventOpen(true);
  };

  const openEventEdit = (event: StoredTimelineEventData) => {
    setEditingEventYear(event.year);
    setEventForm({ year: event.year, endYear: event.endYear || '', title: event.title, desc: event.desc || '' });
    setEventOpen(true);
  };

  const saveEvent = () => {
    const year = eventForm.year.trim();
    const endYear = eventForm.endYear.trim();
    const title = eventForm.title.trim();
    const desc = eventForm.desc.trim();
    if (!/^\d{4}$/.test(year) || (endYear && !/^\d{4}$/.test(endYear))) {
      addToast('请填写 4 位开始年份，结束年份可选', 'error');
      return;
    }
    if (!title) {
      addToast('请填写事件标题', 'error');
      return;
    }
    if (endYear && Number(endYear) < Number(year)) {
      addToast('结束年份不能早于开始年份', 'error');
      return;
    }
    if (events.some((item) => item.year === year && item.year !== editingEventYear)) {
      addToast('该开始年份已存在人生事件', 'error');
      return;
    }

    const existing = editingEventYear ? events.find((item) => item.year === editingEventYear) : null;
    const nextEvent: StoredTimelineEventData = {
      year,
      endYear: endYear || undefined,
      title,
      desc,
      icon: existing?.icon || 'Star',
      color: existing?.color || '#8b6f47',
      bg: existing?.bg || '#f3ead7',
      tags: existing?.tags || [],
    };
    const nextEvents = editingEventYear
      ? events.map((item) => item.year === editingEventYear ? nextEvent : item)
      : [...events, nextEvent];
    persistEvents(nextEvents);

    if (editingEventYear && editingEventYear !== year) {
      localStorage.removeItem(`event-${archiveId}-${editingEventYear}`);
      const oldStage = `${editingEventYear}·${existing?.title || ''}`;
      const newStage = `${year}·${title}`;
      persistMedia(mediaItems.map((item) => item.stage === oldStage ? { ...item, stage: newStage } : item));
    } else if (editingEventYear && existing && existing.title !== title) {
      const oldStage = `${editingEventYear}·${existing.title}`;
      const newStage = `${year}·${title}`;
      persistMedia(mediaItems.map((item) => item.stage === oldStage ? { ...item, stage: newStage } : item));
    }
    localStorage.setItem(`event-${archiveId}-${year}`, JSON.stringify({ title, subtitle: title, content: desc, tags: [] }));
    setSelectedYear(year);
    setEventOpen(false);
    addToast(editingEventYear ? '人生事件已更新' : '人生事件已添加', 'success');
  };

  const deleteEvent = (event: StoredTimelineEventData) => {
    if (!window.confirm(`确定删除「${event.title}」吗？关联素材会保留在素材库中。`)) return;
    const nextEvents = events.filter((item) => item.year !== event.year);
    persistEvents(nextEvents);
    localStorage.removeItem(`event-${archiveId}-${event.year}`);
    if (selectedYear === event.year) setSelectedYear(nextEvents[0]?.year || '');
    addToast('人生事件已删除', 'success');
  };

  const openUpload = (event?: StoredTimelineEventData) => {
    setPendingMedia([]);
    setUploadStage(event ? `${event.year}·${event.title}` : (selectedEvent ? `${selectedEvent.year}·${selectedEvent.title}` : ''));
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
    persistMedia([...mediaItems, ...pendingMedia.map((item) => ({ ...item, stage: uploadStage || undefined }))]);
    setUploadOpen(false);
    setPendingMedia([]);
    addToast(`已上传 ${pendingMedia.length} 个素材`, 'success');
  };

  const deleteMedia = (item: MediaItem) => {
    if (!window.confirm(`确定删除「${item.title}」吗？`)) return;
    persistMedia(mediaItems.filter((media) => media.id !== item.id));
    addToast('素材已删除', 'success');
  };

  if (!archive) {
    return (
      <Annotate id="mobile-archive.no-archive">
        <div className="mobile-archive mobile-archive-empty-page">
          <div className="mobile-archive-empty">
            <p>还没有人生档案</p>
            <button className="mobile-archive-primary-btn" onClick={() => navigate('/m/onboarding')}>创建人生档案</button>
          </div>
        </div>
      </Annotate>
    );
  }

  return (
    <div className="mobile-archive">
      <div className="mobile-archive-toolbar">
        <select value={currentArchiveId} onChange={(event) => switchArchive(event.target.value)} aria-label="选择人生档案">
          {allArchives.map((item) => <option key={item.id} value={item.id}>{item.name}的人生档案</option>)}
        </select>
        <button className="mobile-archive-add-btn" type="button" onClick={() => navigate('/m/onboarding')}>
          <PlusCircle size={15} /> 新建
        </button>
      </div>

      <Annotate id="mobile-archive.profile-card">
        <section className="mobile-archive-card profile-card">
          <div className="profile-avatar">{archive.name.charAt(0)}</div>
          <div className="profile-title-row">
            <h2 className="profile-name">{archive.name}</h2>
            <button className="mobile-archive-edit-btn" type="button" onClick={openProfileEdit}><Pencil size={14} /> 编辑</button>
          </div>
          <div className="profile-meta">
            <span><Calendar size={14} /> {archive.birthYear} 年</span>
            <span><MapPin size={14} /> {archive.origin || '未填写籍贯'}</span>
            <span><Briefcase size={14} /> {archive.occupation || '未填写职业'}</span>
            <span><Clock size={14} /> {archive.gender || '未知'}</span>
          </div>
        </section>
      </Annotate>

      <div className="mobile-archive-tabs">
        <button className={activeTab === 'timeline' ? 'active' : ''} type="button" onClick={() => setActiveTab('timeline')}>人生时间轴</button>
        <button className={activeTab === 'media' ? 'active' : ''} type="button" onClick={() => setActiveTab('media')}>素材库 {mediaItems.length > 0 && `(${mediaItems.length})`}</button>
      </div>

      {activeTab === 'timeline' ? (
        <section className="mobile-archive-section">
          <div className="mobile-section-heading">
            <h3 className="section-title">人生时间轴</h3>
            <button className="mobile-archive-outline-btn" type="button" onClick={openNewEvent}><Plus size={15} /> 添加事件</button>
          </div>
          {events.length === 0 ? (
            <Annotate id="mobile-archive.no-events" inline>
              <div className="mobile-archive-empty">
                <p>还没有人生事件</p>
                <button className="mobile-archive-primary-btn" type="button" onClick={openNewEvent}><Plus size={15} /> 添加第一个事件</button>
              </div>
            </Annotate>
          ) : (
            <Annotate id="mobile-archive.timeline">
              <div className="mobile-timeline">
                {events.map((event) => (
                  <article
                    key={`${event.year}-${event.title}`}
                    className={`mobile-timeline-item${selectedYear === event.year ? ' active' : ''}`}
                    onClick={() => setSelectedYear(event.year)}
                  >
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-item-head">
                        <div>
                          <div className="timeline-year">{formatYear(event)}</div>
                          <div className="timeline-title">{event.title}</div>
                        </div>
                        <div className="timeline-actions">
                          <button type="button" title="编辑事件" onClick={(clickEvent) => { clickEvent.stopPropagation(); openEventEdit(event); }}><Pencil size={14} /></button>
                          <button type="button" title="删除事件" onClick={(clickEvent) => { clickEvent.stopPropagation(); deleteEvent(event); }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      {event.desc && <div className="timeline-desc">{event.desc}</div>}
                    </div>
                  </article>
                ))}
              </div>
            </Annotate>
          )}

          {selectedEvent && (
            <section className="mobile-event-detail">
              <div className="mobile-event-detail-head">
                <div>
                  <span>{formatYear(selectedEvent)}</span>
                  <h4>{selectedEvent.title}</h4>
                </div>
                <button className="mobile-archive-outline-btn" type="button" onClick={() => openUpload(selectedEvent)}><Upload size={14} /> 上传资料</button>
              </div>
              <p>{selectedEvent.desc || '暂未填写事件描述'}</p>
              <div className="mobile-event-media-grid">
                {relatedMedia.filter((item) => item.type === 'image').slice(0, 4).map((item) => (
                  <div className="mobile-event-image" key={item.id}>
                    {item.dataUrl ? <img src={item.dataUrl} alt={item.title} /> : <Image size={22} />}
                  </div>
                ))}
                {relatedMedia.length === 0 && <span className="mobile-event-media-empty">暂未关联资料</span>}
              </div>
              {relatedMedia.length > 0 && <button className="mobile-event-view-media" type="button" onClick={() => setActiveTab('media')}>查看本档案全部素材</button>}
            </section>
          )}
        </section>
      ) : (
        <section className="mobile-archive-section">
          <div className="mobile-section-heading">
            <h3 className="section-title">素材库</h3>
            <button className="mobile-archive-outline-btn" type="button" onClick={() => openUpload()}><Upload size={15} /> 上传素材</button>
          </div>
          <div className="mobile-media-filters">
            {([['all', '全部'], ['image', '图片'], ['video', '视频'], ['audio', '音频'], ['doc', '文档']] as const).map(([value, label]) => (
              <button key={value} type="button" className={mediaFilter === value ? 'active' : ''} onClick={() => setMediaFilter(value)}>{label}</button>
            ))}
          </div>
          {filteredMedia.length === 0 ? (
            <div className="mobile-archive-empty">
              <p>{mediaFilter === 'all' ? '还没有上传素材' : '该类型下暂无素材'}</p>
              <button className="mobile-archive-primary-btn" type="button" onClick={() => openUpload()}><Upload size={15} /> 上传图片或资料</button>
            </div>
          ) : (
            <div className="mobile-media-list">
              {filteredMedia.map((item) => (
                <article className="mobile-media-item" key={item.id}>
                  <div className={`mobile-media-preview ${item.type}`}>
                    {item.type === 'image' && item.dataUrl ? <img src={item.dataUrl} alt={item.title} /> : mediaIcon(item.type, 22)}
                  </div>
                  <div className="mobile-media-info">
                    <strong>{item.title}</strong>
                    <span>{item.date}{item.stage ? ` · ${item.stage}` : ''}</span>
                  </div>
                  <button className="mobile-media-delete" type="button" title="删除素材" onClick={() => deleteMedia(item)}><Trash2 size={15} /></button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <Modal
        open={editOpen}
        title="编辑人生档案"
        onClose={() => setEditOpen(false)}
        footer={<div className="mobile-archive-modal-actions"><button className="mobile-archive-modal-btn" type="button" onClick={() => setEditOpen(false)}>取消</button><button className="mobile-archive-modal-btn primary" type="button" onClick={saveProfileEdit}>保存</button></div>}
      >
        <div className="mobile-archive-form">
          <label>姓名<input value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} placeholder="请输入姓名" /></label>
          <label>性别<select value={profileForm.gender} onChange={(event) => setProfileForm({ ...profileForm, gender: event.target.value as '男' | '女' })}><option value="男">男</option><option value="女">女</option></select></label>
          <label>出生年份<input value={profileForm.birthYear} onChange={(event) => setProfileForm({ ...profileForm, birthYear: event.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="如：1958" /></label>
          <label>籍贯<input value={profileForm.origin} onChange={(event) => setProfileForm({ ...profileForm, origin: event.target.value })} placeholder="如：江苏苏州" /></label>
          <label>职业<input value={profileForm.occupation} onChange={(event) => setProfileForm({ ...profileForm, occupation: event.target.value })} placeholder="如：教师、工程师" /></label>
        </div>
      </Modal>

      <Modal
        open={eventOpen}
        title={editingEventYear ? '编辑人生事件' : '添加人生事件'}
        onClose={() => setEventOpen(false)}
        footer={<div className="mobile-archive-modal-actions"><button className="mobile-archive-modal-btn" type="button" onClick={() => setEventOpen(false)}>取消</button><button className="mobile-archive-modal-btn primary" type="button" onClick={saveEvent}>保存事件</button></div>}
      >
        <div className="mobile-archive-form">
          <label>开始年份<input value={eventForm.year} onChange={(event) => setEventForm({ ...eventForm, year: event.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="如：1988" /></label>
          <label>结束年份（选填）<input value={eventForm.endYear} onChange={(event) => setEventForm({ ...eventForm, endYear: event.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="如：1992" /></label>
          <label>事件标题<input value={eventForm.title} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} placeholder="如：大学毕业、参加工作" /></label>
          <label>事件描述<textarea value={eventForm.desc} onChange={(event) => setEventForm({ ...eventForm, desc: event.target.value })} placeholder="记录这段人生经历中的重要故事" rows={4} /></label>
        </div>
      </Modal>

      <Modal
        open={uploadOpen}
        title="上传素材"
        onClose={() => setUploadOpen(false)}
        footer={<div className="mobile-archive-modal-actions"><button className="mobile-archive-modal-btn" type="button" onClick={() => setUploadOpen(false)}>取消</button><button className="mobile-archive-modal-btn primary" type="button" onClick={confirmUpload}>确认上传</button></div>}
      >
        <div className="mobile-upload-form">
          <label className="mobile-upload-picker" htmlFor="mobile-archive-upload">
            <Upload size={22} />
            <span>{pendingMedia.length ? `已选择 ${pendingMedia.length} 个文件` : '选择图片、视频、音频或文档'}</span>
            <small>图片将保存在本机原型中，单个文件不超过 5MB</small>
          </label>
          <input id="mobile-archive-upload" type="file" accept={MEDIA_ACCEPT} multiple hidden onChange={(event) => { void selectFiles(event.target.files); event.target.value = ''; }} />
          {pendingMedia.length > 0 && <div className="mobile-upload-pending">{pendingMedia.map((item) => <span key={item.id}>{mediaIcon(item.type, 14)} {item.title}</span>)}</div>}
          <label>关联人生阶段<select value={uploadStage} onChange={(event) => setUploadStage(event.target.value)}><option value="">不关联人生阶段</option>{events.map((event) => <option key={event.year} value={`${event.year}·${event.title}`}>{formatYear(event)} · {event.title}</option>)}</select></label>
        </div>
      </Modal>
    </div>
  );
}
