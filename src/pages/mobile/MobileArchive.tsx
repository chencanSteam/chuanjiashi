import { useEffect, useState } from 'react';
import { Calendar, MapPin, Briefcase, Clock } from 'lucide-react';
import { loadStoredEventsForArchive, type StoredTimelineEventData } from '../../utils/timelineSample';
import Annotate from '../../components/annotation/Annotate';
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

function formatYear(event: StoredTimelineEventData): string {
  return event.endYear && event.endYear !== event.year
    ? `${event.year} - ${event.endYear}`
    : event.year;
}

export default function MobileArchive() {
  const archive = loadCurrentArchive();
  const archiveId = archive?.id || 'default';
  const [events, setEvents] = useState<StoredTimelineEventData[]>([]);

  useEffect(() => {
    // 与 Web 端人生档案同源：cj_events_* 存储，默认档案回退到张明远样例数据
    const list = loadStoredEventsForArchive(archiveId);
    setEvents(list.slice().sort((a, b) => Number(a.year) - Number(b.year)));
  }, [archiveId]);

  if (!archive) {
    return (
      <Annotate id="mobile-archive.no-archive">
      <div className="mobile-archive-empty">
        <p>暂无档案</p>
      </div>
      </Annotate>
    );
  }

  return (
    <div className="mobile-archive">
      <Annotate id="mobile-archive.profile-card">
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
      </Annotate>

      <section className="mobile-archive-section">
        <h3 className="section-title">人生时间轴</h3>
        {events.length === 0 ? (
          <Annotate id="mobile-archive.no-events" inline>
          <div className="mobile-archive-empty">
            <p>还没有记录</p>
          </div>
          </Annotate>
        ) : (
          <Annotate id="mobile-archive.timeline">
          <div className="mobile-timeline">
            {events.map((event, i) => (
              <div key={`${event.year}-${event.title}-${i}`} className="mobile-timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-year">{formatYear(event)}</div>
                  <div className="timeline-title">{event.title}</div>
                  {event.desc && (
                    <div className="timeline-desc">{event.desc}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          </Annotate>
        )}
      </section>
    </div>
  );
}
