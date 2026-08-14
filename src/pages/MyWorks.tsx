import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mic, FolderOpen, Trash2, User, Plus, ChevronRight, UploadCloud, Globe } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import { archiveApi } from '../api/archive';
import { bookshelfApi } from '../api/bookshelf';
import PublishBookModal from '../components/PublishBookModal';
import PublishLicenseModal, { type LicenseSettings } from '../components/PublishLicenseModal';
import type { PublicBook } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './MyWorks.css';

interface Archive {
  id: string;
  name: string;
  gender: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
  tags?: string[];
}

type WorkStatus = '未开始' | '待采访' | '采集中' | '已生成传记' | '已同步档案';

interface WorkItem extends Archive {
  status: WorkStatus;
}

function loadLegacyArchives(): Archive[] {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function extractYear(date?: string): string {
  if (!date) return '';
  return date.split('-')[0] || '';
}

function hasKey(key: string): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length > 0 : !!parsed;
  } catch {
    return false;
  }
}

function getStatus(archiveId: string): WorkStatus {
  if (hasKey(`cj_events_${archiveId}`)) return '已同步档案';
  if (hasKey(`cj_biography_${archiveId}`)) return '已生成传记';
  if (hasKey(`cj_interview_transcript_${archiveId}`)) return '采集中';
  if (hasKey(`cj_interview_outline_${archiveId}`)) return '待采访';
  return '未开始';
}

function getStatusClass(status: WorkStatus): string {
  switch (status) {
    case '已同步档案':
      return 'success';
    case '已生成传记':
      return 'primary';
    case '采集中':
      return 'warning';
    case '待采访':
      return 'info';
    default:
      return 'muted';
  }
}

/** mock 创作者收益（按作品 id 生成稳定伪随机数据） */
function mockEarnings(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  const sold = (hash % 180) + 6;
  const price = [9.9, 19.9, 29.9][hash % 3];
  return { sold, price, total: sold * price };
}

function loadLicenses(items: WorkItem[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  items.forEach((w) => {
    map[w.id] = localStorage.getItem(`cj_work_license_${w.id}`) === 'public';
  });
  return map;
}

function loadLicenseSettings(items: WorkItem[]): Record<string, LicenseSettings> {
  const map: Record<string, LicenseSettings> = {};
  items.forEach((w) => {
    try {
      const raw = localStorage.getItem(`cj_work_license_settings_${w.id}`);
      if (raw) map[w.id] = JSON.parse(raw);
    } catch {
      // ignore
    }
  });
  return map;
}

export default function MyWorks() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [publishingWork, setPublishingWork] = useState<WorkItem | null>(null);
  const [licenses, setLicenses] = useState<Record<string, boolean>>({});
  const [licenseSettings, setLicenseSettings] = useState<Record<string, LicenseSettings>>({});
  const [licenseWork, setLicenseWork] = useState<WorkItem | null>(null);
  const [licenseSubmitting, setLicenseSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const mockArchives = await archiveApi.list();
        const legacyArchives = loadLegacyArchives();
        const mergedMap = new Map<string, Archive>();
        mockArchives.forEach((a) => {
          mergedMap.set(a.id, {
            id: a.id,
            name: a.name,
            gender: a.gender === 'female' ? '女' : '男',
            birthYear: extractYear(a.birthDate),
            origin: a.birthPlace || '',
            occupation: '',
          });
        });
        legacyArchives.forEach((a) => {
          if (!mergedMap.has(a.id)) mergedMap.set(a.id, a);
        });
        const items = Array.from(mergedMap.values()).map((a) => ({ ...a, status: getStatus(a.id) }));
        setWorks(items);
        setLicenses(loadLicenses(items));
        setLicenseSettings(loadLicenseSettings(items));
      } catch {
        const legacyArchives = loadLegacyArchives();
        const items = legacyArchives.map((a) => ({ ...a, status: getStatus(a.id) }));
        setWorks(items);
        setLicenses(loadLicenses(items));
        setLicenseSettings(loadLicenseSettings(items));
      } finally {
        // ignore
      }
    };
    load();
  }, []);

  const toggleLicense = (work: WorkItem) => {
    if (licenses[work.id]) {
      // 关闭授权：维持现有下架申请逻辑
      setLicenses((prev) => ({ ...prev, [work.id]: false }));
      localStorage.setItem(`cj_work_license_${work.id}`, 'off');
      addToast('下架申请已提交，审核通过后将从书架移除', 'success');
      return;
    }
    // 打开授权：先弹出「公开到书架」设置弹窗
    setLicenseWork(work);
  };

  const handleLicenseConfirm = async (settings: LicenseSettings) => {
    const work = licenseWork;
    if (!work) return;
    setLicenseSubmitting(true);
    try {
      let existing: PublicBook | undefined;
      try {
        const mine = await bookshelfApi.myList();
        existing = mine.find((b) => b.archiveId === work.id);
      } catch {
        existing = undefined;
      }
      await bookshelfApi.publish(existing?.id || `book_${work.id}`, {
        archiveId: work.id,
        title: existing?.title || `${work.name}的传记`,
        author: existing?.author || '本人/家属整理',
        intro: existing?.intro || `记录${work.name}的人生故事与家风传承。`,
        category: existing?.category || '其他',
        isFree: settings.isFree,
        price: settings.isFree ? 0 : settings.price,
        trialWords: settings.trialWords,
      });
      setLicenses((prev) => ({ ...prev, [work.id]: true }));
      localStorage.setItem(`cj_work_license_${work.id}`, 'public');
      setLicenseSettings((prev) => ({ ...prev, [work.id]: settings }));
      localStorage.setItem(`cj_work_license_settings_${work.id}`, JSON.stringify(settings));
      addToast(
        licenses[work.id]
          ? '授权设置已更新，重新提交审核'
          : `《${work.name}的传记》已提交公开申请，审核通过后将展示到传记书架`,
        'success'
      );
      setLicenseWork(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : '提交失败，请稍后再试', 'error');
    } finally {
      setLicenseSubmitting(false);
    }
  };

  const deleteWork = (id: string) => {
    if (!window.confirm('确定要删除该作品及关联数据吗？此操作不可恢复。')) return;
    const next = works.filter((w) => w.id !== id);
    setWorks(next);
    localStorage.setItem('cj_archives', JSON.stringify(next));
    localStorage.removeItem(`cj_events_${id}`);
    localStorage.removeItem(`cj_event_tags_${id}`);
    localStorage.removeItem(`cj_media_${id}`);
    localStorage.removeItem(`cj_members_${id}`);
    localStorage.removeItem(`cj_biography_${id}`);
    localStorage.removeItem(`cj_interview_outline_${id}`);
    localStorage.removeItem(`cj_interview_transcript_${id}`);
    localStorage.removeItem(`cj_interview_notes_${id}`);
    localStorage.removeItem(`cj_biography_comments_${id}`);
    localStorage.removeItem(`cj_biography_likes_${id}`);
    const current = localStorage.getItem('cj_current_archive_id');
    if (current === id) {
      localStorage.setItem('cj_current_archive_id', next[0]?.id || '');
    }
    addToast('作品已删除', 'info');
  };

  const openWork = (work: WorkItem) => {
    localStorage.setItem('cj_current_archive_id', work.id);
    if (work.status === '未开始' || work.status === '待采访') {
      navigate('/interview');
    } else if (work.status === '采集中' || work.status === '已生成传记') {
      navigate('/biography');
    } else {
      navigate('/archive');
    }
  };

  const canPublish = (work: WorkItem) => {
    return work.status === '已生成传记' || work.status === '已同步档案';
  };

  return (
    <div className="my-works-page">
      <header className="page-header">
        <h1 className="page-title">我的传记</h1>
        <Annotate id="my-works.new-biography" inline>
        <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>
          <Plus size={14} /> 新建传记
        </button>
        </Annotate>
      </header>

      {works.length === 0 ? (
        <div className="card works-empty">
          <User size={40} color="#9ca3af" />
          <p>暂无传记，开始记录第一份人生传记吧</p>
          <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>
            <Plus size={14} /> 新建传记
          </button>
        </div>
      ) : (
        <div className="works-grid">
          {works.map((work) => {
            const earnings = mockEarnings(work.id);
            const setting = licenseSettings[work.id];
            // 单价优先使用创作者实际设置的售价，取不到再退回 mock 伪随机
            const unitPrice = setting ? setting.price : earnings.price;
            const totalEarnings = earnings.sold * unitPrice;
            return (
            <div className="card work-card" key={work.id}>
              <div className="card-body work-body">
                <Annotate id="my-works.work-status">
                <div className="work-main">
                  <Avatar name={work.name} size={48} />
                  <div className="work-info">
                    <div className="work-name">{work.name}的传记</div>
                    <div className="work-meta">
                      {work.birthYear} 年生 · {work.origin} · {work.occupation}
                    </div>
                    <span className={`work-status ${getStatusClass(work.status)}`}>{work.status}</span>
                  </div>
                </div>
                </Annotate>
                <div className="work-extra">
                  <Annotate id="my-works.earnings">
                  <div className="work-earnings">
                    <div className="work-earnings-item">
                      <span className="work-earnings-value">{earnings.sold}</span>
                      <span className="work-earnings-label">售出份数</span>
                    </div>
                    <div className="work-earnings-item">
                      <span className="work-earnings-value">
                        {setting?.isFree ? '免费' : `¥${unitPrice.toFixed(2)}`}
                      </span>
                      <span className="work-earnings-label">单价</span>
                    </div>
                    <div className="work-earnings-item">
                      <span className="work-earnings-value work-earnings-total">
                        ¥{totalEarnings.toFixed(2)}
                      </span>
                      <span className="work-earnings-label">累计收益</span>
                    </div>
                  </div>
                  </Annotate>
                  <Annotate id="my-works.license">
                  <div className="work-license">
                    <span className="work-license-label"><Globe size={13} /> 公开授权</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!licenses[work.id]}
                      className={`work-switch ${licenses[work.id] ? 'on' : ''}`}
                      onClick={() => toggleLicense(work)}
                    >
                      <span className="work-switch-dot" />
                    </button>
                    <span className={`work-license-status ${licenses[work.id] ? 'on' : ''}`}>
                      {licenses[work.id] ? '已公开到书架' : '未公开'}
                    </span>
                  </div>
                  </Annotate>
                  {licenses[work.id] && (
                    <div className="work-license-detail">
                      <span>
                        {setting?.isFree ? '免费公开' : `售价 ¥${(setting?.price ?? 0).toFixed(2)}`}
                        {' · '}试看 {setting?.trialWords ?? 1000} 字
                      </span>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setLicenseWork(work)}
                      >
                        授权设置
                      </button>
                    </div>
                  )}
                </div>
                <Annotate id="my-works.work-actions">
                <div className="work-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => openWork(work)}>
                    {work.status === '未开始' || work.status === '待采访' ? (
                      <>
                        <Mic size={14} /> 继续采访
                      </>
                    ) : work.status === '已同步档案' ? (
                      <>
                        <FolderOpen size={14} /> 查看档案
                      </>
                    ) : (
                      <>
                        <BookOpen size={14} /> 编辑传记
                      </>
                    )}
                    <ChevronRight size={14} />
                  </button>
                  {canPublish(work) && (
                    <>
                      <button className="btn btn-outline btn-sm work-publish" onClick={() => setPublishingWork(work)}>
                        <UploadCloud size={14} /> 上架
                      </button>
                      <button
                        className="btn btn-outline btn-sm work-store"
                        onClick={() => navigate(`/store?category=book&archiveId=${work.id}`)}
                      >
                        <BookOpen size={14} /> 制作实体书
                      </button>
                    </>
                  )}
                  <button
                    className="icon-btn work-delete"
                    title="删除"
                    onClick={() => deleteWork(work.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                </Annotate>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {licenseWork && (
        <PublishLicenseModal
          key={licenseWork.id}
          open
          workName={licenseWork.name}
          initial={licenseSettings[licenseWork.id]}
          submitting={licenseSubmitting}
          onClose={() => setLicenseWork(null)}
          onConfirm={handleLicenseConfirm}
        />
      )}

      {publishingWork && (
        <PublishBookModal
          archive={{
            id: publishingWork.id,
            name: publishingWork.name,
            birthYear: publishingWork.birthYear,
            origin: publishingWork.origin,
            occupation: publishingWork.occupation,
          }}
          onClose={() => setPublishingWork(null)}
        />
      )}
    </div>
  );
}
