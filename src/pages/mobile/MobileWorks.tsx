import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import type { Biography } from '../../mocks/types';
import './MobileWorks.css';

function loadBiographies(): Biography[] {
  try {
    const raw = localStorage.getItem('cj_mock_biographies');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadArchiveName(archiveId: string): string {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (!raw) return '—';
    const archives: { id: string; name: string }[] = JSON.parse(raw);
    return archives.find((a) => a.id === archiveId)?.name || '—';
  } catch {
    return '—';
  }
}

function workProgress(work: Biography): number {
  if (work.status === 'final') return 100;
  const chapters = work.chapters?.length || 0;
  return Math.min(90, Math.max(10, chapters * 20));
}

export default function MobileWorks() {
  const navigate = useNavigate();
  const [works] = useState<Biography[]>(() => loadBiographies());
  const [selected, setSelected] = useState<Biography | null>(null);

  return (
    <div className="mobile-works">
      {works.length === 0 ? (
        <div className="mobile-works-empty">
          <BookOpen size={48} color="#ccc" />
          <p>暂无传记作品</p>
          <span>完成 AI 采访后可生成传记</span>
        </div>
      ) : (
        <div className="mobile-works-list">
          {works.map((work) => (
            <div key={work.id} className="mobile-works-item" onClick={() => setSelected(work)}>
              <div className="works-item-icon">
                <BookOpen size={20} />
              </div>
              <div className="works-item-info">
                <div className="works-item-title">{work.title}</div>
                <div className="works-item-desc">
                  {work.status === 'final' ? '已完成' : '草稿'} · {work.chapters?.length || 0} 章
                </div>
              </div>
              <ChevronRight size={18} color="#ccc" />
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!selected}
        title="作品详情"
        onClose={() => setSelected(null)}
        footer={
          <button
            className="mobile-modal-btn primary"
            onClick={() => {
              setSelected(null);
              navigate('/biography');
            }}
          >
            查看传记
          </button>
        }
      >
        {selected && (
          <div className="works-detail">
            <div className="works-detail-row">
              <span>作品名</span>
              <strong>{selected.title}</strong>
            </div>
            <div className="works-detail-row">
              <span>传主</span>
              <strong>{loadArchiveName(selected.archiveId)}</strong>
            </div>
            <div className="works-detail-row">
              <span>进度</span>
              <strong>{workProgress(selected)}%（{selected.status === 'final' ? '已完成' : '草稿'}）</strong>
            </div>
            <div className="works-detail-row">
              <span>创建时间</span>
              <strong>{new Date(selected.createdAt).toLocaleString()}</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
