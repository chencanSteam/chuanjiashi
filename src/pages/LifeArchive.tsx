import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Image,
  Edit3,
  FileText,
  Music,
  Play,
  Baby,
  GraduationCap,
  BookOpen,
  Heart,
  Briefcase,
  Rocket,
  Umbrella,
  Sprout,
  Info,
  Plus,
  Trash2,
  Star,
  X,
  UserPlus,
  User,
  Shield,
  Eye,
  Upload,
  Home,
  Plane,
  Award,
  Settings2,
  Wand2,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import { useToast } from '../hooks/useToast';
import { useVersion } from '../hooks/useVersion';
import { useAuth } from '../hooks/useAuth';
import { archiveApi } from '../api/archive';
import { generateImageDataUrl, generateVideoPoster, generateAudioUrl } from '../utils/mediaPlaceholder';
import LocationFootprints from './LocationFootprints';
import Achievements from './Achievements';
import { buildRelationNodes, relationTypeOptions, type RelationNode } from '../utils/familyRelations';
import { presetLifeTags } from '../data/lifeTags';
import { familyApi } from '../api/family';
import {
  findAccountByPhoneOrIdCard,
  createCollabInvite,
  invitesForArchive,
  revokeCollabInvite,
} from '../data/interviewCollaboration';
import type { FamilyRelation } from '../mocks/types';
import { loadStoredEventsForArchive } from '../utils/timelineSample';
import Annotate from '../components/annotation/Annotate';
import './LifeArchive.css';

const tabs = [
  { key: 'timeline', label: '人生时间轴' },
  { key: 'media', label: '多媒体档案库' },
  { key: 'relations', label: '人物关系图谱' },
  { key: 'places', label: '地点足迹' },
  { key: 'achievements', label: '成就与作品' },
  { key: 'privacy', label: '隐私与权限' },
];

const eventDetails: Record<string, { title: string; subtitle: string; content: string; tags: string[] }> = {
  '1958': { title: '出生', subtitle: '出生于江苏苏州', content: '1958年3月12日，张明远出生于江苏苏州一个普通的教师家庭。童年的苏州小巷、评弹声与父亲的教诲，构成了他最早的记忆底色。', tags: ['出生', '苏州', '童年'] },
  '1970': { title: '求学', subtitle: '苏州市立实验小学', content: '在苏州市立实验小学，张明远养成了良好的学习习惯。班主任王老师的影响深远，让他明白了知识改变命运的道理。', tags: ['小学', '求学', '启蒙'] },
  '1976': { title: '求学', subtitle: '苏州市中学', content: '中学时期，张明远对机械产生了浓厚兴趣，常常拆卸家中闹钟和收音机。这段经历为他后来的职业选择埋下了种子。', tags: ['中学', '机械', '兴趣'] },
  '1980': { title: '婚姻', subtitle: '组建家庭', content: '1980年，张明远与相恋多年的李晓如结婚。两人在简朴的婚礼中许下承诺，携手走过了四十余年的风风雨雨。', tags: ['婚姻', '家庭', '责任'] },
  '1988': { title: '工作', subtitle: '进入机械行业', content: '从苏州大学机械工程专业毕业后，张明远进入一家国营机械厂工作。他踏实肯干，很快成为技术骨干，积累了丰富的行业经验。', tags: ['职业', '机械', '成长'] },
  '1992': { title: '创业', subtitle: '创立明远机械有限公司', content: '在国家改革开放的浪潮中，辞去稳定的工作，与两位合作伙伴共同创立明远机械有限公司，专注于精密零部件加工与设备研发。创业初期条件艰苦，但团队齐心协力，逐步打开市场，产品远销海外，为公司奠定了坚实基础。', tags: ['创业初心', '精密制造', '团队协作', '创新突破'] },
  '2020': { title: '退休', subtitle: '享受生活', content: '2020年，张明远正式退休，将公司交给年轻一代打理。他开始有更多时间陪伴家人、整理人生档案，并思考家风传承。', tags: ['退休', '传承', '家庭'] },
  '2024': { title: '当下', subtitle: '持续学习，传承家风', content: '如今，张明远坚持每日读书、练字，并通过「传家世」平台记录人生故事。他希望把正直、担当、勤俭、善良的家风传递给子孙后代。', tags: ['当下', '家风', '传承'] },
};

interface Archive {
  id: string;
  name: string;
  gender: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
  tags?: string[];
}

interface TagItem {
  label: string;
  color: string;
  bg: string;
}

interface StoredTimelineEvent {
  year: string;
  endYear?: string;
  title: string;
  desc: string;
  icon?: string;
  color?: string;
  bg?: string;
  tags?: TagItem[];
}

interface TimelineEvent {
  year: string;
  endYear?: string;
  title: string;
  desc: string;
  Icon: ComponentType<{ size?: number }>;
  iconName: string;
  color: string;
  bg: string;
  tags: TagItem[];
}

type Role = '档案所有者' | '观察者';

const ROLES: Role[] = ['档案所有者', '观察者'];
const DEFAULT_ARCHIVE_ID = 'default';
const DEFAULT_ARCHIVE: Archive = {
  id: DEFAULT_ARCHIVE_ID,
  name: '张明远',
  gender: '男',
  birthYear: '1958',
  origin: '江苏省苏州市',
  occupation: '企业家 / 高级工程师',
};

const iconMap: Record<string, ComponentType<{ size?: number }>> = {
  Baby,
  GraduationCap,
  BookOpen,
  Heart,
  Briefcase,
  Rocket,
  Umbrella,
  Sprout,
  Star,
  Home,
  Plane,
  Award,
};

interface MediaItem {
  id: string;
  title: string;
  date: string;
  type: 'image' | 'video' | 'audio' | 'doc';
  stage?: string;
}

const STORAGE_KEY_MEDIA_PREFIX = 'cj_media_';

const defaultMediaItems: MediaItem[] = [
  { id: '1', title: '童年老照片.jpg', date: '1960-06-01', type: 'image', stage: '1958·出生' },
  { id: '2', title: '小学毕业合影.jpg', date: '1970-07-10', type: 'image', stage: '1970·求学' },
  { id: '3', title: '中学手工课作品.jpg', date: '1978-05-20', type: 'image', stage: '1976·求学' },
  { id: '4', title: '结婚纪念照.jpg', date: '1980-10-01', type: 'image', stage: '1980·婚姻' },
  { id: '5', title: '长子满月照.jpg', date: '1982-08-15', type: 'image', stage: '1982·长子出生' },
  { id: '6', title: '女儿百日照.jpg', date: '1985-11-08', type: 'image', stage: '1985·女儿出生' },
  { id: '7', title: '工作证照片.jpg', date: '1988-09-01', type: 'image', stage: '1988·工作' },
  { id: '8', title: '创业初期厂房.jpg', date: '1992-03-12', type: 'image', stage: '1992·创业' },
  { id: '9', title: '数控设备引进仪式.mp4', date: '1998-09-18', type: 'video', stage: '1998·企业转型' },
  { id: '10', title: '乔迁新居合影.jpg', date: '2003-12-25', type: 'image', stage: '2003·搬迁新居' },
  { id: '11', title: '助学基金成立发言稿.docx', date: '2008-04-10', type: 'doc', stage: '2008·公益助学' },
  { id: '12', title: '金婚纪念视频.mp4', date: '2018-10-01', type: 'video', stage: '2018·金婚纪念' },
  { id: '13', title: '家训手稿.pdf', date: '2022-08-18', type: 'doc', stage: '2022·整理家风' },
  { id: '14', title: '春节团圆全家福.jpg', date: '2024-02-10', type: 'image', stage: '2024·当下' },
  { id: '15', title: '个人访谈录音.mp3', date: '2024-06-20', type: 'audio', stage: '2024·当下' },
];

function loadMediaItems(archiveId: string): MediaItem[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_MEDIA_PREFIX}${archiveId}`);
    if (raw) return JSON.parse(raw) as MediaItem[];
  } catch { /* ignore */ }
  return archiveId === DEFAULT_ARCHIVE_ID ? defaultMediaItems : [];
}

function formatYearRange(year: string, endYear?: string): string {
  if (endYear && endYear !== year) return `${year} - ${endYear}`;
  return year;
}

function deriveMediaType(name: string): MediaItem['type'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'mkv'];
  const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'];
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  return 'doc';
}



interface ActivityItem {
  id: string;
  type: 'event' | 'media';
  title: string;
  desc: string;
  time: string;
  icon: ComponentType<{ size?: number }>;
  color: string;
}

function getRecentActivities(events: TimelineEvent[], mediaItems: MediaItem[]): ActivityItem[] {
  const latestMedia = mediaItems
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .map((m) => {
      const icon =
        m.type === 'video' ? Play :
        m.type === 'audio' ? Music :
        m.type === 'image' ? Image :
        FileText;
      const color =
        m.type === 'video' ? '#DC2626' :
        m.type === 'audio' ? '#7C3AED' :
        m.type === 'image' ? '#2563EB' :
        '#1B5E4B';
      return {
        id: `med-${m.id}`,
        type: 'media' as const,
        title: `上传素材：${m.title}`,
        desc: m.stage ? `关联阶段：${m.stage}` : '未关联阶段',
        time: m.date,
        icon,
        color,
      };
    });

  const latestEvents = events
    .slice()
    .sort((a, b) => Number(b.year) - Number(a.year))
    .slice(0, 2)
    .map((e) => ({
      id: `evt-${e.year}`,
      type: 'event' as const,
      title: `更新人生事件：${e.year}年 ${e.title}`,
      desc: e.desc.length > 36 ? `${e.desc.slice(0, 36)}…` : e.desc,
      time: `${formatYearRange(e.year, e.endYear)}年`,
      icon: e.Icon,
      color: e.color,
    }));

  return [...latestMedia, ...latestEvents].slice(0, 5);
}

// 权限项与上方标签一一对应（除「隐私与权限」外的 5 个模块）
const privacyItems = [
  { label: '人生时间轴', value: '家人可见' },
  { label: '多媒体档案库', value: '家人可见' },
  { label: '人物关系图谱', value: '家人可见' },
  { label: '地点足迹', value: '家人可见' },
  { label: '成就与作品', value: '家人可见' },
];

const privacyOptions = ['家人可见', '公开展示', '仅自己'];

const mediaFilters = ['全部', '照片', '视频', '音频', '文档'];

function enrichEvents(list: StoredTimelineEvent[]): TimelineEvent[] {
  return list.map((e) => {
    const iconName = e.icon && iconMap[e.icon] ? e.icon : 'Star';
    return {
      year: e.year,
      endYear: e.endYear,
      title: e.title,
      desc: e.desc,
      Icon: iconMap[iconName],
      iconName,
      color: e.color ?? '#6b7280',
      bg: e.bg ?? '#f3f4f6',
      tags: e.tags ?? [],
    };
  });
}

function loadArchives(): Archive[] {
  try {
    const raw = localStorage.getItem('cj_archives');
    const parsed: Archive[] = raw ? JSON.parse(raw) : [DEFAULT_ARCHIVE];
    return parsed.find((a) => a.id === DEFAULT_ARCHIVE_ID) ? parsed : [DEFAULT_ARCHIVE, ...parsed];
  } catch {
    return [DEFAULT_ARCHIVE];
  }
}

function resolveCurrentArchiveId(archives: Archive[]): string {
  try {
    const saved = localStorage.getItem('cj_current_archive_id');
    if (saved && archives.some((a) => a.id === saved)) return saved;
  } catch {
    // ignore
  }
  return archives[0].id;
}

function loadEventsForArchive(archiveId: string): TimelineEvent[] {
  return enrichEvents(loadStoredEventsForArchive(archiveId));
}

function loadTagsForArchive(archiveId: string): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(`cj_event_tags_${archiveId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return archiveId === DEFAULT_ARCHIVE_ID
    ? Object.fromEntries(Object.entries(eventDetails).map(([year, d]) => [year, d.tags]))
    : {};
}

function loadRole(): Role {
  try {
    const saved = localStorage.getItem('cj_current_role') as Role | null;
    if (saved && ROLES.includes(saved)) return saved;
  } catch {
    // ignore
  }
  return '档案所有者';
}

function loadPrivacyValues(): Record<string, string> {
  try {
    const raw = localStorage.getItem('cj_privacy_values');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return Object.fromEntries(privacyItems.map((p) => [p.label, p.value]));
}

interface Member {
  id: string;
  name: string;
  role: Role;
  status: 'active' | 'pending';
}

const defaultMembers: Member[] = [
  { id: 'm1', name: '张明远', role: '档案所有者', status: 'active' },
  { id: 'm2', name: '李晓如', role: '观察者', status: 'active' },
  { id: 'm3', name: '张子涵', role: '观察者', status: 'active' },
  { id: 'm4', name: '张雨桐', role: '观察者', status: 'pending' },
];

function loadMembers(archiveId: string): Member[] {
  try {
    const raw = localStorage.getItem(`cj_members_${archiveId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return archiveId === DEFAULT_ARCHIVE_ID ? defaultMembers : [];
}

function getSavedDetail(year: string, archiveId: string) {
  const raw = localStorage.getItem(`event-${archiveId}-${year}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { title: string; subtitle: string; content: string; tags: string[] };
  } catch {
    return null;
  }
}

export default function LifeArchive() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isV1 } = useVersion();

  const initialArchives = loadArchives();
  const initialArchiveId = resolveCurrentArchiveId(initialArchives);
  const initialEvents = loadEventsForArchive(initialArchiveId);
  const initialTags = loadTagsForArchive(initialArchiveId);
  const initialSelectedYear = initialEvents.some((e) => e.year === '1992')
    ? '1992'
    : initialEvents[0]?.year ?? '';

  const [archives, setArchives] = useState<Archive[]>(initialArchives);
  const [currentArchiveId, setCurrentArchiveId] = useState<string>(initialArchiveId);
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);

  useEffect(() => {
    archiveApi
      .list()
      .then((mockArchives) => {
        const mapped: Archive[] = mockArchives.map((a) => ({
          id: a.id,
          name: a.name,
          gender: a.gender === 'female' ? '女' : '男',
          birthYear: a.birthDate ? a.birthDate.split('-')[0] : '',
          origin: a.birthPlace || '',
          occupation: '',
        }));
        setArchives((prev) => {
          const map = new Map<string, Archive>();
          prev.forEach((a) => map.set(a.id, a));
          mapped.forEach((a) => {
            if (!map.has(a.id)) map.set(a.id, a);
          });
          return Array.from(map.values());
        });
        if (mapped.length > 0 && !initialArchives.some((a) => a.id === currentArchiveId)) {
          const first = mapped[0];
          setCurrentArchiveId(first.id);
          localStorage.setItem('cj_current_archive_id', first.id);
          setEvents(loadEventsForArchive(first.id));
          setEventTags(loadTagsForArchive(first.id));
          setMembers(loadMembers(first.id));
          setMediaItems(loadMediaItems(first.id));
        }
      })
      .catch(() => {
        // 保持本地档案
      })
      .finally(() => {});
  }, []);
  const [eventTags, setEventTags] = useState<Record<string, string[]>>(initialTags);
  const [role, setRole] = useState<Role>(loadRole);
  const [privacyValues, setPrivacyValues] = useState<Record<string, string>>(loadPrivacyValues);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => loadMediaItems(currentArchiveId));

  useEffect(() => {
    localStorage.setItem('cj_privacy_values', JSON.stringify(privacyValues));
  }, [privacyValues]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_MEDIA_PREFIX}${currentArchiveId}`, JSON.stringify(mediaItems));
  }, [mediaItems, currentArchiveId]);

  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedYear, setSelectedYear] = useState<string>(initialSelectedYear);
  const [mediaFilter, setMediaFilter] = useState('全部');
  const [preview, setPreview] = useState<{ type: string; title: string } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState('');

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventYear, setNewEventYear] = useState('');
  const [newEventEndYear, setNewEventEndYear] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  const [showNewArchive, setShowNewArchive] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'男' | '女'>('男');
  const [newBirthYear, setNewBirthYear] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newCustomTag, setNewCustomTag] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [newOccupation, setNewOccupation] = useState('');

  const initialMembers = loadMembers(initialArchiveId);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('观察者');

  const [relations, setRelations] = useState<FamilyRelation[]>([]);
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [relationQuery, setRelationQuery] = useState('');
  const [relationFound, setRelationFound] = useState<{ phone: string; name?: string } | null>(null);
  const [relationType, setRelationType] = useState('配偶');
  const [relationInvitesRefresh, setRelationInvitesRefresh] = useState(0);
  const { user } = useAuth();

  // 本档案已发出、待对方同意的人物关系邀请
  const pendingRelationInvites = useMemo(
    () => invitesForArchive(currentArchiveId).filter((i) => i.kind === 'relation' && i.status === 'pending'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentArchiveId, relationInvitesRefresh]
  );

  useEffect(() => {
    familyApi
      .relations(currentArchiveId)
      .then(setRelations)
      .catch(() => setRelations([]));
  }, [currentArchiveId]);

  const currentArchive = archives.find((a) => a.id === currentArchiveId) ?? DEFAULT_ARCHIVE;
  const relationNodes: RelationNode[] = useMemo(
    () => buildRelationNodes(currentArchive.name, relations),
    [currentArchive.name, relations]
  );
  const canEdit = role !== '观察者';
  const canManageArchives = role === '档案所有者';
  const isOwner = role === '档案所有者';

  const sortedEvents = events.slice().sort((a, b) => Number(a.year) - Number(b.year));

  const filteredMedia =
    mediaFilter === '全部'
      ? mediaItems
      : mediaItems.filter((m) => {
          const map: Record<string, string> = { 照片: 'image', 视频: 'video', 音频: 'audio', 文档: 'doc' };
          return m.type === map[mediaFilter];
        });

  const saveEvents = (archiveId: string, next: TimelineEvent[]) => {
    const stored: StoredTimelineEvent[] = next.map((e) => ({
      year: e.year,
      endYear: e.endYear,
      title: e.title,
      desc: e.desc,
      icon: e.iconName,
      color: e.color,
      bg: e.bg,
      tags: e.tags,
    }));
    localStorage.setItem(`cj_events_${archiveId}`, JSON.stringify(stored));
  };

  const handleSwitchArchive = (id: string) => {
    setCurrentArchiveId(id);
    localStorage.setItem('cj_current_archive_id', id);
    const nextEvents = loadEventsForArchive(id);
    setEvents(nextEvents);
    setEventTags(loadTagsForArchive(id));
    setMembers(loadMembers(id));
    setMediaItems(loadMediaItems(id));
    setShowInvite(false);
    setSelectedYear(
      nextEvents.some((e) => e.year === '1992') ? '1992' : nextEvents[0]?.year ?? ''
    );
  };

  const handleCreateArchive = () => {
    const name = newName.trim();
    if (!name) {
      addToast('请输入姓名', 'error');
      return;
    }
    const archive: Archive = {
      id: Date.now().toString(),
      name,
      gender: newGender,
      birthYear: newBirthYear.trim(),
      origin: newOrigin.trim(),
      occupation: newOccupation.trim(),
      tags: newTags,
    };
    const nextArchives = [...archives, archive];
    setArchives(nextArchives);
    localStorage.setItem('cj_archives', JSON.stringify(nextArchives));

    setCurrentArchiveId(archive.id);
    localStorage.setItem('cj_current_archive_id', archive.id);
    setEvents([]);
    localStorage.setItem(`cj_events_${archive.id}`, JSON.stringify([]));
    setEventTags({});
    localStorage.setItem(`cj_event_tags_${archive.id}`, JSON.stringify({}));
    setMembers([]);
    localStorage.setItem(`cj_members_${archive.id}`, JSON.stringify([]));
    setMediaItems([]);
    setSelectedYear('');

    setNewName('');
    setNewGender('男');
    setNewBirthYear('');
    setNewOrigin('');
    setNewOccupation('');
    setNewTags([]);
    setNewCustomTag('');
    setShowNewArchive(false);
    addToast('档案已创建', 'success');
  };

  const openUploadModal = () => {
    setUploadFile(null);
    setUploadStage(sortedEvents[0]?.year || '');
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadStage('');
  };

  const handleUploadFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
    if (e.target) e.target.value = '';
  };

  const confirmUpload = () => {
    if (!uploadFile) {
      addToast('请选择要上传的素材文件', 'error');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const newItem: MediaItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: uploadFile.name,
      date: today,
      type: deriveMediaType(uploadFile.name),
      stage: uploadStage || undefined,
    };
    setMediaItems((prev) => [...prev, newItem]);
    addToast('素材已上传', 'success');
    closeUploadModal();
  };

  const handleEventDetailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedYear) return;
    const eventItem = events.find((ev) => ev.year === selectedYear);
    const stage = eventItem ? `${eventItem.year}·${eventItem.title}` : selectedYear;
    const today = new Date().toISOString().split('T')[0];
    const newItem: MediaItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: file.name,
      date: today,
      type: deriveMediaType(file.name),
      stage,
    };
    setMediaItems((prev) => [...prev, newItem]);
    addToast('资料已上传并关联到本阶段', 'success');
    if (e.target) e.target.value = '';
  };

  const handleDeleteMedia = (id: string) => {
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
    addToast('素材已删除', 'success');
  };

  const handleAddEvent = () => {
    const year = newEventYear.trim();
    const endYear = newEventEndYear.trim();
    const title = newEventTitle.trim();
    const desc = newEventDesc.trim();
    if (!year || !title) {
      addToast('年份和标题不能为空', 'error');
      return;
    }
    if (events.some((e) => e.year === year)) {
      addToast('该年份已存在事件', 'error');
      return;
    }
    const newEvent: TimelineEvent = {
      year,
      endYear: endYear || undefined,
      title,
      desc,
      Icon: Star,
      iconName: 'Star',
      color: '#6b7280',
      bg: '#f3f4f6',
      tags: [],
    };
    const next = [...events, newEvent];
    setEvents(next);
    saveEvents(currentArchiveId, next);
    localStorage.setItem(
      `event-${currentArchiveId}-${year}`,
      JSON.stringify({ title, subtitle: title, content: desc, tags: [] })
    );
    setSelectedYear(year);
    setNewEventYear('');
    setNewEventEndYear('');
    setNewEventTitle('');
    setNewEventDesc('');
    setShowAddEvent(false);
    addToast('事件已添加', 'success');
  };

  const handleDeleteEvent = (year: string) => {
    const next = events.filter((e) => e.year !== year);
    setEvents(next);
    saveEvents(currentArchiveId, next);
    if (selectedYear === year) {
      setSelectedYear(
        next.some((e) => e.year === '1992') ? '1992' : next[0]?.year ?? ''
      );
    }
    addToast('事件已删除', 'success');
  };

  const handleRoleChange = (r: Role) => {
    setRole(r);
    localStorage.setItem('cj_current_role', r);
  };

  const saveMembers = (archiveId: string, next: Member[]) => {
    localStorage.setItem(`cj_members_${archiveId}`, JSON.stringify(next));
  };

  const handleInvite = () => {
    const name = inviteName.trim();
    if (!name) {
      addToast('请输入成员姓名', 'error');
      return;
    }
    if (members.some((m) => m.name === name)) {
      addToast('该成员已存在', 'error');
      return;
    }
    const next: Member[] = [...members, { id: Date.now().toString(), name, role: inviteRole, status: 'pending' }];
    setMembers(next);
    saveMembers(currentArchiveId, next);
    setInviteName('');
    setInviteRole('观察者');
    setShowInvite(false);
    addToast(`已邀请 ${name} 为 ${inviteRole}`, 'success');
  };

  const handleRemoveMember = (id: string) => {
    const next = members.filter((m) => m.id !== id);
    setMembers(next);
    saveMembers(currentArchiveId, next);
    addToast('成员已移除', 'info');
  };

  // 查找对方账号（手机号/身份证号）并发出人物关系邀请，对方同意后才会写入关系图谱
  const handleFindRelationAccount = () => {
    if (!relationQuery.trim()) {
      addToast('请输入手机号或身份证号', 'error');
      return;
    }
    const found = findAccountByPhoneOrIdCard(relationQuery);
    if (!found) {
      setRelationFound(null);
      addToast('未找到该账号，请确认手机号或身份证号是否正确', 'error');
      return;
    }
    if (found.phone === user?.phone) {
      addToast('不能与自己建立关系', 'error');
      return;
    }
    if (pendingRelationInvites.some((i) => i.targetPhone === found.phone)) {
      addToast('已向 TA 发送过关系邀请，等待对方同意', 'info');
      return;
    }
    setRelationFound(found);
  };

  const handleSendRelationInvite = () => {
    if (!relationFound) return;
    createCollabInvite({
      kind: 'relation',
      archiveId: currentArchiveId,
      archiveName: currentArchive.name,
      subjectName: currentArchive.name,
      inviterName: user?.name || currentArchive.name,
      targetPhone: relationFound.phone,
      relation: relationType,
    });
    setRelationFound(null);
    setRelationQuery('');
    setRelationInvitesRefresh((v) => v + 1);
    addToast('关系邀请已发送，待对方同意后写入关系图谱', 'success');
  };

  const handleRemoveRelation = async (id: string) => {
    try {
      await familyApi.removeRelation(currentArchiveId, id);
      setRelations((prev) => prev.filter((r) => r.id !== id));
      addToast('关系已删除', 'info');
    } catch (err: any) {
      addToast(err.message || '删除失败', 'error');
    }
  };

  const selectedEvent = events.find((e) => e.year === selectedYear) ?? null;
  const recentActivities = useMemo(
    () => getRecentActivities(events, mediaItems),
    [events, mediaItems]
  );
  const savedDetail = selectedYear ? getSavedDetail(selectedYear, currentArchiveId) : null;
  const baseDetail = selectedYear ? eventDetails[selectedYear] : undefined;
  const selectedDetail = {
    title: savedDetail?.title ?? baseDetail?.title ?? selectedEvent?.title ?? '-',
    subtitle: savedDetail?.subtitle ?? baseDetail?.subtitle ?? selectedEvent?.desc ?? '',
    content: savedDetail?.content ?? baseDetail?.content ?? selectedEvent?.desc ?? '暂无事件描述',
    tags: selectedYear ? eventTags[selectedYear] ?? savedDetail?.tags ?? baseDetail?.tags ?? [] : [],
  };

  return (
    <div className="archive-page">
      <header className="page-header archive-page-header">
        <h1 className="page-title">人生档案</h1>
        <Annotate id="life-archive.archive-switch" inline>
        <div className="archive-header-actions">
          <div className="archive-current">
            <span className="archive-name">{currentArchive.name}的档案</span>
            <select value={currentArchiveId} onChange={(e) => handleSwitchArchive(e.target.value)}>
              {archives.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}的档案
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowNewArchive(true)}
            disabled={!canManageArchives}
          >
            <Plus size={14} /> 新建档案
          </button>
        </div>
        </Annotate>
      </header>

      {showNewArchive && (
        <Annotate id="life-archive.new-archive">
        <div className="card new-archive-card">
          <div className="card-header">
            <h3 className="card-title">新建档案</h3>
            <button className="icon-btn" onClick={() => setShowNewArchive(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="card-body new-archive-body">
            <div className="form-row">
              <label>姓名</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="请输入姓名"
              />
            </div>
            <div className="form-row">
              <label>性别</label>
              <select value={newGender} onChange={(e) => setNewGender(e.target.value as '男' | '女')}>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div className="form-row">
              <label>出生年份</label>
              <input
                type="text"
                value={newBirthYear}
                onChange={(e) => setNewBirthYear(e.target.value)}
                placeholder="如 1958"
              />
            </div>
            <div className="form-row">
              <label>籍贯</label>
              <input
                type="text"
                value={newOrigin}
                onChange={(e) => setNewOrigin(e.target.value)}
                placeholder="如 江苏省苏州市"
              />
            </div>
            <div className="form-row">
              <label>职业</label>
              <input
                type="text"
                value={newOccupation}
                onChange={(e) => setNewOccupation(e.target.value)}
                placeholder="如 企业家 / 高级工程师"
              />
            </div>
            <div className="form-row">
              <label>人生标签</label>
              <div className="life-tags">
                {presetLifeTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`life-tag ${newTags.includes(tag) ? 'active' : ''}`}
                    onClick={() =>
                      setNewTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
                    }
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="custom-tag-row">
                <input
                  type="text"
                  value={newCustomTag}
                  onChange={(e) => setNewCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const t = newCustomTag.trim();
                      if (t && !newTags.includes(t)) setNewTags((prev) => [...prev, t]);
                      setNewCustomTag('');
                    }
                  }}
                  placeholder="输入自定义标签，按回车添加"
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    const t = newCustomTag.trim();
                    if (t && !newTags.includes(t)) setNewTags((prev) => [...prev, t]);
                    setNewCustomTag('');
                  }}
                >
                  添加
                </button>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setShowNewArchive(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreateArchive}>
                创建
              </button>
            </div>
          </div>
        </div>
        </Annotate>
      )}

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="archive-page-layout">
        <div className="archive-main">
      {activeTab === 'timeline' && (
        <div className="archive-grid">
          <Annotate id="life-archive.timeline">
          <div className="card timeline-card">
            <div className="card-header">
              <h3 className="card-title">人生时间轴</h3>
              <div className="timeline-header-actions">
                {canEdit && !showAddEvent && (
                  <button className="btn btn-outline btn-sm" onClick={() => setShowAddEvent(true)}>
                    <Plus size={14} /> 添加人生事件
                  </button>
                )}
                <div className="timeline-toggle">
                  <span>关键节点</span>
                  <Info size={14} className="timeline-info" />
                  <div className="toggle-switch on" />
                </div>
              </div>
            </div>
            <div className={`card-body timeline-body ${sortedEvents.length > 0 ? 'has-events' : ''}`}>
              {showAddEvent && canEdit && (
                <div className="add-event-form">
                  <input
                    type="text"
                    placeholder="开始年份"
                    value={newEventYear}
                    onChange={(e) => setNewEventYear(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="结束年份（可选）"
                    value={newEventEndYear}
                    onChange={(e) => setNewEventEndYear(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="事件标题"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                  />
                  <textarea
                    placeholder="事件描述"
                    rows={2}
                    value={newEventDesc}
                    onChange={(e) => setNewEventDesc(e.target.value)}
                  />
                  <div className="add-event-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => setShowAddEvent(false)}>
                      取消
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleAddEvent}>
                      保存
                    </button>
                  </div>
                </div>
              )}

              {sortedEvents.length === 0 && (
                <div className="timeline-empty">
                  <p>暂无人生事件，开始记录第一个重要时刻吧</p>
                  {canEdit && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddEvent(true)}>
                      <Plus size={14} /> 添加人生事件
                    </button>
                  )}
                </div>
              )}

              {sortedEvents.map((e) => {
                const active = e.year === selectedYear;
                return (
                  <div
                    className={`timeline-event ${active ? 'active' : ''}`}
                    key={e.year}
                    onClick={() => setSelectedYear(e.year)}
                  >
                    <div className="event-icon" style={{ background: e.color, color: '#fff' }}>
                      <e.Icon size={16} />
                    </div>
                    <div className="event-main">
                      <div className="event-head">
                        <div className="event-title-line">
                          <span className="event-year">{formatYearRange(e.year, e.endYear)}</span>
                          <span className="event-title">{e.title}</span>
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="event-actions">
                        <button
                          className="event-action-btn"
                          title="编辑"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            navigate(`/archive/event/${e.year}/edit`);
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="event-action-btn"
                          title="删除"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleDeleteEvent(e.year);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
          </Annotate>

          <Annotate id="life-archive.event-detail">
          <div className="card event-detail-card">
            <div className="card-header">
              <h3 className="card-title">
                人生事件详情 <span className="verified-tag">已验证</span>
              </h3>
              {canEdit && selectedYear && (
                <button
                  className="btn btn-outline"
                  onClick={() => navigate(`/archive/event/${selectedYear}/edit`)}
                >
                  <Edit3 size={14} /> 编辑事件
                </button>
              )}
            </div>
            <div className="card-body event-detail-body">
              {selectedYear ? (
                <>
                  <div className="event-detail-head">
                    <div>
                      <div className="event-detail-year">{formatYearRange(selectedYear, selectedEvent?.endYear)}年</div>
                      <div className="event-detail-title">{selectedDetail.title}</div>
                    </div>
                    <div className="event-detail-subtitle">{selectedDetail.subtitle}</div>
                  </div>
                  <p className="event-detail-content">{selectedDetail.content}</p>
                  {(() => {
                    const relatedMedia = mediaItems.filter((m) => m.stage?.startsWith(selectedYear));
                    const relatedImages = relatedMedia.filter((m) => m.type === 'image');
                    return (
                      <>
                        <div className="event-photos">
                          {relatedImages.length > 0 ? (
                            relatedImages.slice(0, 4).map((m) => (
                              <div
                                className="event-photo"
                                key={m.id}
                                onClick={() => setPreview({ type: m.type, title: m.title })}
                                title={m.title}
                              >
                                <Image size={20} />
                              </div>
                            ))
                          ) : (
                            [1, 2, 3, 4].map((n) => (
                              <div
                                className="event-photo event-photo-placeholder"
                                key={n}
                                onClick={() => setPreview({ type: 'image', title: `${formatYearRange(selectedYear, selectedEvent?.endYear)}年照片 ${n}` })}
                              >
                                <Image size={20} />
                              </div>
                            ))
                          )}
                        </div>
                        {canEdit && (
                          <div className="event-detail-upload">
                            <label className="btn btn-outline btn-sm" htmlFor="event-detail-upload-input">
                              <Upload size={14} /> 上传本阶段资料
                            </label>
                            <input
                              id="event-detail-upload-input"
                              type="file"
                              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                              style={{ display: 'none' }}
                              onChange={handleEventDetailUpload}
                            />
                          </div>
                        )}
                        <div className="event-attachments">
                          {relatedMedia.length > 0 ? (
                            relatedMedia.map((m) => {
                              const icon =
                                m.type === 'video' ? <Play size={16} /> :
                                m.type === 'audio' ? <Music size={16} /> :
                                m.type === 'image' ? <Image size={16} /> :
                                <FileText size={16} />;
                              return (
                                <div
                                  className="attach-item"
                                  key={m.id}
                                  onClick={() => setPreview({ type: m.type, title: m.title })}
                                  title={m.title}
                                >
                                  {icon} {m.title}
                                </div>
                              );
                            })
                          ) : (
                            <div className="attachment-empty">该阶段暂无附件，点击上方按钮上传</div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="timeline-empty">请选择或添加一个人生事件以查看详情</div>
              )}
            </div>
          </div>
          </Annotate>
        </div>
      )}

      {activeTab === 'media' && (
        <Annotate id="life-archive.media-library">
        <div className="card media-page-card">
          <div className="card-header">
            <h3 className="card-title">多媒体档案库</h3>
            <div className="media-header-actions">
              <div className="media-filter">
                {mediaFilters.map((f) => (
                  <button className={mediaFilter === f ? 'active' : ''} key={f} onClick={() => setMediaFilter(f)}>
                    {f}
                  </button>
                ))}
              </div>
              {!isV1 && (
                <button className="media-restore-btn" onClick={() => navigate('/photo-restore')}>
                  <Wand2 size={14} />
                  <span>老照片修复</span>
                </button>
              )}
              <button className="media-upload-btn" onClick={openUploadModal}>
                <Upload size={14} />
                <span>上传素材</span>
              </button>
            </div>
          </div>
          <div className="card-body media-page-body">
            {filteredMedia.map((m) => {
              const mediaIcon =
                m.type === 'video' ? <Play size={24} /> :
                m.type === 'audio' ? <Music size={24} /> :
                m.type === 'doc' ? <FileText size={24} /> :
                <Image size={24} />;
              return (
                <div className="media-item" key={m.id} onClick={() => setPreview({ type: m.type, title: m.title })}>
                  {canEdit && (
                    <button
                      className="media-delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteMedia(m.id); }}
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="media-thumb">{mediaIcon}</div>
                  <div className="media-title">{m.title}</div>
                  <div className="media-date">{m.date}</div>
                  {m.stage && <div className="media-stage">{m.stage}</div>}
                </div>
              );
            })}
            {filteredMedia.length === 0 && (
              <div className="media-empty">
                <div>该分类下暂无素材</div>
                {canEdit && (
                  <>
                    {!isV1 && (
                      <button className="media-restore-btn media-restore-btn-empty" onClick={() => navigate('/photo-restore')}>
                        <Wand2 size={14} />
                        <span>老照片修复</span>
                      </button>
                    )}
                    <button className="media-upload-btn media-upload-btn-empty" onClick={openUploadModal}>
                      <Upload size={14} />
                      <span>上传素材</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'relations' && (
        <Annotate id="life-archive.relations">
        <div className="card relation-page-card">
          <div className="card-header relation-header">
            <h3 className="card-title">人物关系图谱</h3>
            <div className="relation-header-actions">
              <span className="relation-subtitle">{isV1 ? '点击成员可维护关系' : '点击成员可查看详情'}</span>
              <button className="btn btn-outline" onClick={() => setShowRelationModal(true)}>
                <Settings2 size={14} /> 维护关系
              </button>
            </div>
          </div>
          <div className="card-body relation-page-body">
            <div className="relation-graph">
              <svg className="relation-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="line-gradient-direct" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1B5E4B" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#2D8A6E" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="line-gradient-spouse" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#D97706" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="line-gradient-child" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.4" />
                  </linearGradient>
                  <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {relationNodes.map((r, i) => {
                  const mx = (50 + r.x) / 2;
                  const my = (50 + r.y) / 2;
                  const perpX = -(r.y - 50) * 0.12;
                  const perpY = (r.x - 50) * 0.12;
                  return (
                    <path
                      key={i}
                      d={`M 50 50 Q ${mx + perpX} ${my + perpY} ${r.x} ${r.y}`}
                      className={`relation-line ${r.group}`}
                      fill="none"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              {relationNodes.map((r, i) => {
                const mx = (50 + r.x) / 2;
                const my = (50 + r.y) / 2;
                return (
                  <div
                    key={`label-${i}`}
                    className={`relation-label ${r.group}`}
                    style={{ left: `${mx}%`, top: `${my}%` }}
                  >
                    {r.role}
                  </div>
                );
              })}
              <div className="relation-center-node">
                <div className="relation-center-ring">
                  <Avatar name={currentArchive.name} size={88} />
                </div>
                <span className="relation-center-name">{currentArchive.name}</span>
                <span className="relation-center-tag">本人</span>
              </div>
              {relationNodes.map((r, i) => (
                <div
                  className={`relation-node ${r.side} ${r.group}`}
                  style={{ left: `${r.x}%`, top: `${r.y}%` }}
                  key={i}
                  onClick={() => {
                    if (isV1) {
                      setShowRelationModal(true);
                      return;
                    }
                    navigate(`/family/members/${encodeURIComponent(r.name)}`);
                  }}
                >
                  <Avatar name={r.name} size={56} />
                  <span className="relation-node-name">{r.name}</span>
                  <span className="relation-node-role">{r.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {showRelationModal && (
        <Annotate id="life-archive.relation-invite">
        <div className="modal-overlay" onClick={() => setShowRelationModal(false)}>
          <div className="modal-content relation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>维护人物关系</h4>
              <button className="modal-close" onClick={() => setShowRelationModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="relation-invite-desc">
                与 <strong>{currentArchive.name}</strong> 建立关系：通过手机号或身份证号查找对方账号，对方同意后才会写入关系图谱。
              </div>
              <div className="relation-add-inline">
                <input
                  type="text"
                  placeholder="对方手机号 / 身份证号"
                  value={relationQuery}
                  onChange={(e) => { setRelationQuery(e.target.value); setRelationFound(null); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFindRelationAccount();
                    }
                  }}
                />
                <button className="btn btn-outline" onClick={handleFindRelationAccount}>查找</button>
              </div>
              {relationFound && (
                <div className="invite-found">
                  <Avatar name={relationFound.name || relationFound.phone} size={40} />
                  <div className="invite-found-info">
                    <strong>{relationFound.name || '未设置姓名的用户'}</strong>
                    <span>{relationFound.phone}</span>
                  </div>
                  <select value={relationType} onChange={(e) => setRelationType(e.target.value)}>
                    {relationTypeOptions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={handleSendRelationInvite}>
                    <Plus size={13} /> 发送邀请
                  </button>
                </div>
              )}
              {pendingRelationInvites.length > 0 && (
                <div className="relation-list-inline">
                  {pendingRelationInvites.map((i) => (
                    <div className="relation-row-inline" key={i.id}>
                      <span>{i.targetPhone}</span>
                      <span className="relation-tag">{i.relation} · 待同意</span>
                      <button
                        className="relation-row-delete"
                        onClick={() => {
                          revokeCollabInvite(i.id);
                          setRelationInvitesRefresh((v) => v + 1);
                          addToast('邀请已撤销', 'info');
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="relation-list-inline">
                {relations.length === 0 && pendingRelationInvites.length === 0 && (
                  <div className="relation-empty">暂无关系，请在上方查找并邀请</div>
                )}
                {relations.map((r) => (
                  <div className="relation-row-inline" key={r.id}>
                    <span>{r.from}</span>
                    <span className="relation-tag">{r.relation}</span>
                    <span>{r.to}</span>
                    <button className="relation-row-delete" onClick={() => handleRemoveRelation(r.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'privacy' && (
        <Annotate id="life-archive.privacy">
        <div className="card privacy-card">
          <div className="card-header">
            <h3 className="card-title">隐私与权限</h3>
          </div>
          <div className="card-body privacy-body">
            <div className="privacy-role">
              <span>当前角色：</span>
              <select value={role} onChange={(e) => handleRoleChange(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <span className="role-hint">
                {role === '观察者' ? '仅可查看，无法编辑' : '可管理档案与权限'}
              </span>
            </div>

            <div className="privacy-template">
              <span>权限模板：</span>
              <select disabled={!isOwner}>
                <option>默认模板（家人可见）</option>
              </select>
            </div>
            {privacyItems.map((p, i) => {
              const current = privacyValues[p.label] ?? p.value;
              return (
                <div className="privacy-row" key={i}>
                  <span>{p.label}</span>
                  <div className="privacy-options">
                    {privacyOptions.map((opt) => (
                      <button
                        key={opt}
                        className={current === opt ? 'active' : ''}
                        disabled={!canEdit}
                        onClick={() => {
                          if (!canEdit) return;
                          setPrivacyValues((prev) => ({ ...prev, [p.label]: opt }));
                          addToast(`${p.label} 设为 ${opt}`, 'success');
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="auth-section">
              <div className="auth-section-header">
                <h4>授权成员</h4>
                {canManageArchives && (
                  <button className="btn btn-outline btn-sm" onClick={() => setShowInvite(true)}>
                    <UserPlus size={14} /> 邀请成员
                  </button>
                )}
              </div>

              {showInvite && canManageArchives && (
                <div className="invite-form">
                  <input
                    type="text"
                    placeholder="成员姓名"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  />
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={handleInvite}>
                    邀请
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setShowInvite(false); setInviteName(''); }}>
                    取消
                  </button>
                </div>
              )}

              {members.length === 0 && (
                <div className="auth-empty">
                  <User size={28} color="#9ca3af" />
                  <p>暂无授权成员</p>
                </div>
              )}

              <div className="auth-list">
                {members.map((m) => (
                  <div className="auth-row" key={m.id}>
                    <div className="auth-info">
                      <div className="auth-avatar">
                        {m.role === '档案所有者' ? <Shield size={16} /> : <Eye size={16} />}
                      </div>
                      <div>
                        <div className="auth-name">{m.name}</div>
                        <div className="auth-meta">{m.role}</div>
                      </div>
                    </div>
                    <div className="auth-actions">
                      <span className={`auth-status ${m.status}`}>{m.status === 'active' ? '已加入' : '待确认'}</span>
                      {canManageArchives && m.role !== '档案所有者' && (
                        <button className="icon-btn" onClick={() => handleRemoveMember(m.id)} title="移除">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'places' && <LocationFootprints />}
      {activeTab === 'achievements' && <Achievements />}
        </div>

        {/* 档案概览：固定在右侧，切换标签时不变 */}
        <div className="archive-side">
          <div className="card profile-card">
            <div className="card-header">
              <h3 className="card-title">档案概览</h3>
            </div>
            <div className="card-body profile-body">
              <div className="profile-top">
                <Avatar name={currentArchive.name} size={64} />
                <div>
                  <div className="profile-name">
                    {currentArchive.name} <span className="gender">{currentArchive.gender}</span>
                  </div>
                  <div className="profile-meta">出生地：{currentArchive.origin || '-'}</div>
                  <div className="profile-meta">职业：{currentArchive.occupation || '-'}</div>
                  <div className="profile-meta">当前阶段：享受生活，传承家风</div>
                  {currentArchive.tags && currentArchive.tags.length > 0 && (
                    <div className="profile-tags">
                      {currentArchive.tags.map((tag) => (
                        <span className="profile-tag" key={tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="activity-section">
                <div className="section-title">档案动态</div>
                <div className="activity-list">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((a) => (
                      <div className="activity-row" key={a.id}>
                        <div
                          className="activity-icon"
                          style={{ background: `${a.color}20`, color: a.color }}
                        >
                          <a.icon size={14} />
                        </div>
                        <div className="activity-main">
                          <div className="activity-title">{a.title}</div>
                          {a.desc && <div className="activity-desc">{a.desc}</div>}
                          <div className="activity-time">{a.time}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="activity-empty">暂无动态，开始记录第一个人生事件或上传素材吧</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{preview.title}</h4>
              <button className="modal-close" onClick={() => setPreview(null)}>
                关闭
              </button>
            </div>
            <div className="modal-body preview-body">
              {preview.type === 'image' && (
                <img className="preview-image" src={generateImageDataUrl(preview.title)} alt={preview.title} />
              )}
              {preview.type === 'video' && <video className="preview-video" controls poster={generateVideoPoster(preview.title)} />}
              {preview.type === 'audio' && <audio className="preview-audio" controls src={generateAudioUrl()} />}
              {preview.type === 'doc' && (
                <div className="preview-doc">
                  <FileText size={48} />
                </div>
              )}
              <p>正在预览：{preview.title}</p>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={showUploadModal}
        title="上传素材"
        onClose={closeUploadModal}
        footer={
          <div className="upload-modal-footer">
            <button className="btn btn-outline" onClick={closeUploadModal}>取消</button>
            <button className="btn btn-primary" onClick={confirmUpload} disabled={!uploadFile}>
              <Upload size={14} /> 确认上传
            </button>
          </div>
        }
      >
        <div className="upload-modal-body">
          <div className="upload-modal-field">
            <label>选择文件</label>
            <div className="upload-modal-file">
              <label className="btn btn-outline" htmlFor="life-archive-upload-file">
                {uploadFile ? '重新选择' : '选择文件'}
              </label>
              <input
                id="life-archive-upload-file"
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
                onChange={handleUploadFileSelect}
              />
              <span className="upload-modal-filename">{uploadFile ? uploadFile.name : '未选择文件'}</span>
            </div>
          </div>
          <div className="upload-modal-field">
            <label>关联人生阶段</label>
            {sortedEvents.length > 0 ? (
              <select
                className="upload-modal-select"
                value={uploadStage}
                onChange={(e) => setUploadStage(e.target.value)}
              >
                <option value="">不关联</option>
                {sortedEvents.map((e) => (
                  <option key={e.year} value={`${e.year}·${e.title}`}>
                    {formatYearRange(e.year, e.endYear)} · {e.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="upload-modal-empty-stage">暂无人生阶段，请先在「人生时间轴」添加事件</div>
            )}
            <p className="upload-modal-hint">关联后，AI 传记生成时可将素材用于对应阶段章节</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
