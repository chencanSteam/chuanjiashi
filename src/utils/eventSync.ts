import type { ReviewEvent } from '../data/aiMock';

export interface StoredTimelineEvent {
  year: string;
  endYear?: string;
  title: string;
  desc: string;
  icon?: string;
  color?: string;
  bg?: string;
  tags?: Array<{ label: string; color: string; bg: string }>;
}

const EVENT_KEY = (archiveId: string) => `cj_events_${archiveId}`;

function extractYear(time: string): string {
  const match = time.match(/(\d{4})/);
  return match ? match[1] : '';
}

function inferIcon(type: string, title: string): string {
  const text = `${type}${title}`.toLowerCase();
  if (/出生|童年|小时候|婴儿/.test(text)) return 'Baby';
  if (/教育|大学|学校|学习|老师|毕业/.test(text)) return 'GraduationCap';
  if (/结婚|婚姻|家庭|妻子|丈夫|子女/.test(text)) return 'Heart';
  if (/创业|公司|企业|工厂|工作|职业|技术/.test(text)) return 'Rocket';
  if (/公益|慈善|助学|捐赠/.test(text)) return 'Award';
  if (/家风|家训|感悟|传承/.test(text)) return 'BookOpen';
  if (/旅行|出国|迁居|搬家/.test(text)) return 'Plane';
  if (/退休|晚年|养老/.test(text)) return 'Umbrella';
  return 'Star';
}

function inferColor(type: string, title: string): { color: string; bg: string } {
  const text = `${type}${title}`.toLowerCase();
  if (/出生|童年/.test(text)) return { color: '#D97706', bg: '#FEF3C7' };
  if (/教育|学习/.test(text)) return { color: '#DB2777', bg: '#FCE7F3' };
  if (/结婚|家庭|子女/.test(text)) return { color: '#DC2626', bg: '#FEE2E2' };
  if (/创业|工作|职业/.test(text)) return { color: '#1B5E4B', bg: 'rgba(27,94,75,0.12)' };
  if (/公益|慈善/.test(text)) return { color: '#DC2626', bg: '#FEE2E2' };
  if (/家风|感悟/.test(text)) return { color: '#7C3AED', bg: '#EDE9FE' };
  if (/退休|晚年/.test(text)) return { color: '#059669', bg: '#D1FAE5' };
  return { color: '#2563EB', bg: '#DBEAFE' };
}

export function loadTimelineEvents(archiveId: string): StoredTimelineEvent[] {
  try {
    const raw = localStorage.getItem(EVENT_KEY(archiveId));
    if (raw) return JSON.parse(raw) as StoredTimelineEvent[];
  } catch {
    // ignore
  }
  return [];
}

export function saveTimelineEvents(archiveId: string, events: StoredTimelineEvent[]): void {
  localStorage.setItem(EVENT_KEY(archiveId), JSON.stringify(events));
}

export function syncReviewEventToTimeline(archiveId: string, event: ReviewEvent): void {
  const year = extractYear(event.time);
  if (!year) return;

  const existing = loadTimelineEvents(archiveId);
  const normalizedTitle = event.title.trim();
  const isDuplicate = existing.some(
    (e) => e.year === year && e.title.trim() === normalizedTitle
  );
  if (isDuplicate) return;

  const { color, bg } = inferColor(event.type, event.title);
  const tags: Array<{ label: string; color: string; bg: string }> = [];
  if (event.location) {
    tags.push({ label: event.location, color: '#6b7280', bg: '#f3f4f6' });
  }
  tags.push({ label: event.type || '采访', color, bg });

  const newEvent: StoredTimelineEvent = {
    year,
    title: event.title,
    desc: `${event.time}，${event.location ? event.location + '，' : ''}${event.summary}`,
    icon: inferIcon(event.type, event.title),
    color,
    bg,
    tags,
  };

  saveTimelineEvents(archiveId, [...existing, newEvent]);
}
