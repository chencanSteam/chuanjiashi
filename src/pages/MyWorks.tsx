import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mic, Trash2, User, Plus, ChevronRight, UploadCloud } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import { archiveApi } from '../api/archive';
import PublishBookModal from '../components/PublishBookModal';
import { getWorkStatus, type WorkStatus } from '../utils/works';
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

function getStatusClass(status: WorkStatus): string {
  return status === '已完成' ? 'success' : 'warning';
}

function loadLicenseSettings(items: WorkItem[]): Record<string, { isFree: boolean; price: number; trialWords: number }> {
  const map: Record<string, { isFree: boolean; price: number; trialWords: number }> = {};
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

/** mock 创作者收益（按作品 id 生成稳定伪随机数据） */
function mockEarnings(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  const sold = (hash % 180) + 6;
  const price = [9.9, 19.9, 29.9][hash % 3];
  return { sold, price, total: sold * price };
}

export default function MyWorks() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [publishingWork, setPublishingWork] = useState<WorkItem | null>(null);
  const [licenseSettings, setLicenseSettings] = useState<Record<string, { isFree: boolean; price: number; trialWords: number }>>({});

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
        const items = Array.from(mergedMap.values()).map((a) => ({ ...a, status: getWorkStatus(a.id) }));
        setWorks(items);
        setLicenseSettings(loadLicenseSettings(items));
      } catch {
        const legacyArchives = loadLegacyArchives();
        const items = legacyArchives.map((a) => ({ ...a, status: getWorkStatus(a.id) }));
        setWorks(items);
        setLicenseSettings(loadLicenseSettings(items));
      } finally {
        // ignore
      }
    };
    load();
  }, []);

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
    localStorage.removeItem(`cj_interview_transcript_mobile_${id}`);
    localStorage.removeItem(`cj_interview_session_${id}`);
    localStorage.removeItem(`cj_interview_answers_${id}`);
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
    if (work.status === '已完成') {
      navigate('/biography/print');
    } else if (localStorage.getItem(`cj_biography_${work.id}`) || localStorage.getItem(`cj_biography_chapters_${work.id}`)) {
      // 已有传记成品或章节草稿：回到传记编辑器，而不是重新采访
      navigate('/biography');
    } else {
      navigate('/interview');
    }
  };

  const canPublish = (work: WorkItem) => work.status === '已完成';

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
                  {work.status === '已完成' && setting && (
                    <div className="work-license-detail">
                      <span>{setting.isFree ? '免费公开' : `售价 ¥${setting.price.toFixed(2)}`} · 试看 {setting.trialWords} 字</span>
                    </div>
                  )}
                </div>
                <Annotate id="my-works.work-actions">
                <div className="work-actions">
                  {work.status === '进行中' ? (
                    <button className="btn btn-primary btn-sm" onClick={() => openWork(work)}>
                      <Mic size={14} /> 继续完成 <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button className="btn btn-outline btn-sm" onClick={() => openWork(work)}>
                      <BookOpen size={14} /> 查看传记
                    </button>
                  )}
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
