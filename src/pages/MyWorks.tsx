import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mic, FolderOpen, Trash2, User, Plus, ChevronRight } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
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

function loadArchives(): Archive[] {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
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

export default function MyWorks() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [works, setWorks] = useState<WorkItem[]>(() =>
    loadArchives().map((a) => ({ ...a, status: getStatus(a.id) }))
  );

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

  return (
    <div className="my-works-page">
      <header className="page-header">
        <h1 className="page-title">我的传记</h1>
        <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>
          <Plus size={14} /> 新建传记
        </button>
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
          {works.map((work) => (
            <div className="card work-card" key={work.id}>
              <div className="card-body work-body">
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
                  <button
                    className="icon-btn work-delete"
                    title="删除"
                    onClick={() => deleteWork(work.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
