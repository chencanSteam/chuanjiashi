import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Trash2, UploadCloud } from 'lucide-react';
import { getWorkStatus, type WorkStatus } from '../../utils/works';
import PublishBookModal from '../../components/PublishBookModal';
import Modal from '../../components/ui/Modal';
import { archiveApi } from '../../api/archive';
import Annotate from '../../components/annotation/Annotate';
import './MobileWorks.css';

// 与 Web 端「我的传记」一致：只展示用户可理解的生命周期状态

interface Archive {
  id: string;
  name: string;
  gender?: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
  createdAt?: string;
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


export default function MobileWorks() {
  const navigate = useNavigate();
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [selected, setSelected] = useState<WorkItem | null>(null);
  const [publishing, setPublishing] = useState<WorkItem | null>(null);

  useEffect(() => {
    // 与 Web 端一致：mock 档案与本地档案按 id 合并
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
        setWorks(Array.from(mergedMap.values()).map((a) => ({ ...a, status: getWorkStatus(a.id) })));
      } catch {
        setWorks(loadLegacyArchives().map((a) => ({ ...a, status: getWorkStatus(a.id) })));
      }
    };
    load();
  }, []);

  const deleteWork = (work: WorkItem) => {
    if (!window.confirm('确定要删除该作品及关联数据吗？此操作不可恢复。')) return;
    const id = work.id;
    const next = works.filter((item) => item.id !== id);
    setWorks(next);
    setSelected(null);
    ['cj_events_', 'cj_event_tags_', 'cj_media_', 'cj_members_', 'cj_biography_', 'cj_biography_meta_', 'cj_interview_outline_', 'cj_interview_transcript_', 'cj_interview_transcript_mobile_', 'cj_interview_session_', 'cj_interview_answers_', 'cj_interview_notes_', 'cj_biography_comments_', 'cj_biography_likes_', 'cj_work_license_', 'cj_work_license_settings_'].forEach((prefix) => localStorage.removeItem(`${prefix}${id}`));
    localStorage.setItem('cj_archives', JSON.stringify(next));
    if (localStorage.getItem('cj_current_archive_id') === id) localStorage.setItem('cj_current_archive_id', next[0]?.id || '');
  };

  const openWork = (work: WorkItem) => {
    localStorage.setItem('cj_current_archive_id', work.id);
    setSelected(null);
    if (work.status === '已完成') navigate('/biography/print');
    else if (localStorage.getItem(`cj_biography_${work.id}`) || localStorage.getItem(`cj_biography_chapters_${work.id}`)) navigate('/biography');
    else navigate('/interview');
  };

  return (
    <div className="mobile-works">
      {works.length === 0 ? (
        <div className="mobile-works-empty">
          <BookOpen size={48} color="#ccc" />
          <p>暂无传记作品</p>
          <span>完成 AI 采访后可生成传记</span>
        </div>
      ) : (
        <Annotate id="mobile-works.work-list">
        <div className="mobile-works-list">
          {works.map((work) => (
            <div key={work.id} className="mobile-works-item" onClick={() => setSelected(work)}>
              <div className="works-item-icon">
                <BookOpen size={20} />
              </div>
              <div className="works-item-info">
                <div className="works-item-title">{work.name}的传记</div>
                <div className="works-item-desc">
                  {work.birthYear} 年生 · {work.origin} · {work.status}
                </div>
              </div>
              <ChevronRight size={18} color="#ccc" />
            </div>
          ))}
        </div>
        </Annotate>
      )}

      <Modal
        open={!!selected}
        title="作品详情"
        onClose={() => setSelected(null)}
        footer={
          <Annotate id="mobile-works.view-biography" inline>
          <div className="mobile-works-actions">
            <button className="mobile-modal-btn primary" onClick={() => selected && openWork(selected)}>
              {selected?.status === '已完成' ? '查看传记' : '继续完成'}
            </button>
            {selected?.status === '已完成' && <button className="mobile-modal-btn" onClick={() => { setPublishing(selected); setSelected(null); }}><UploadCloud size={14} /> 上架</button>}
            {selected && <button className="mobile-modal-btn danger" onClick={() => deleteWork(selected)}><Trash2 size={14} /> 删除</button>}
          </div>
          </Annotate>
        }
      >
        {selected && (
          <Annotate id="mobile-works.detail-modal">
          <div className="works-detail">
            <div className="works-detail-row">
              <span>作品名</span>
              <strong>{selected.name}的传记</strong>
            </div>
            <div className="works-detail-row">
              <span>传主</span>
              <strong>{selected.name}</strong>
            </div>
            <div className="works-detail-row">
              <span>状态</span>
              <strong>{selected.status}</strong>
            </div>
            <div className="works-detail-row">
              <span>创建时间</span>
              <strong>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</strong>
            </div>
          </div>
          </Annotate>
        )}
      </Modal>
      {publishing && (
        <PublishBookModal
          archive={{ id: publishing.id, name: publishing.name, birthYear: publishing.birthYear, origin: publishing.origin, occupation: publishing.occupation }}
          onClose={() => setPublishing(null)}
        />
      )}
    </div>
  );
}
