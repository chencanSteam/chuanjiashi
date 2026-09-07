import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { getWorkStatus, type WorkStatus } from '../../utils/works';
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

  const openWork = (work: WorkItem) => {
    localStorage.setItem('cj_current_archive_id', work.id);
    navigate(`/m/works/${work.id}`);
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
            <div key={work.id} className="mobile-works-item" onClick={() => openWork(work)}>
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

    </div>
  );
}
