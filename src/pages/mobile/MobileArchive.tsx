import { useEffect, useState } from 'react';
import { Calendar, MapPin, Briefcase, Clock } from 'lucide-react';
import type { TimelineEvent } from '../../mocks/types';
import './MobileArchive.css';

interface Archive {
  id: string;
  name: string;
  gender?: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
}

function loadCurrentArchive(): Archive | null {
  try {
    const currentId = localStorage.getItem('cj_current_archive_id');
    if (!currentId) return null;
    const raw = localStorage.getItem('cj_archives');
    if (!raw) return null;
    return JSON.parse(raw).find((a: Archive) => a.id === currentId) || null;
  } catch {
    return null;
  }
}

function loadTimelineEvents(archiveId: string): TimelineEvent[] {
  try {
    const raw = localStorage.getItem('cj_mock_timeline');
    if (!raw) return [];
    const events: TimelineEvent[] = JSON.parse(raw);
    return events.filter((e) => e.archiveId === archiveId).sort((a, b) => a.year - b.year);
  } catch {
    return [];
  }
}

export default function MobileArchive() {
  const archive = loadCurrentArchive();
  const archiveId = archive?.id || 'default';
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    setEvents(loadTimelineEvents(archiveId));
  }, [archiveId]);

  if (!archive) {
    return (
      <div className="mobile-archive-empty">
        <p>暂无档案</p>
      </div>
    );
  }

  return (
    <div className="mobile-archive">
      <section className="mobile-archive-card profile-card">
        <div className="profile-avatar">
          {archive.name.charAt(0)}
        </div>
        <h2 className="profile-name">{archive.name}</h2>
        <div className="profile-meta">
          <span><Calendar size={14} /> {archive.birthYear} 年</span>
          <span><MapPin size={14} /> {archive.origin}</span>
          <span><Briefcase size={14} /> {archive.occupation}</span>
          <span><Clock size={14} /> {archive.gender || '未知'}</span>
        </div>
      </section>

      <section className="mobile-archive-section">
        <h3 className="section-title">人生时间轴</h3>
        {events.length === 0 ? (
          <div className="mobile-archive-empty">
            <p>还没有记录</p>
          </div>
        ) : (
          <div className="mobile-timeline">
            {events.map((event) => (
              <div key={event.id} className="mobile-timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-year">{event.year}</div>
                  <div className="timeline-title">{event.title}</div>
                  {event.description && (
                    <div className="timeline-desc">{event.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
