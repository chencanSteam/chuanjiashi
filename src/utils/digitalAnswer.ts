import { loadInterviewAnswers } from './biographyAssembler';
import { loadTimelineEvents } from './eventSync';
import type { ReviewEvent } from '../data/aiMock';

interface Archive {
  id: string;
  name: string;
  birthYear?: string;
  origin?: string;
  occupation?: string;
  tags?: string[];
}

function loadCurrentArchive(): Archive | null {
  try {
    const currentId = localStorage.getItem('cj_current_archive_id');
    if (!currentId) return null;
    const raw = localStorage.getItem('cj_archives');
    if (!raw) return null;
    const archives: Archive[] = JSON.parse(raw);
    return archives.find((a) => a.id === currentId) || null;
  } catch {
    return null;
  }
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function extractYear(text: string): string {
  const match = text.match(/(\d{4})/);
  return match ? match[1] : '';
}

function matchScore(question: string, text: string): number {
  const qWords = question.toLowerCase().split(/\s+|[，。？！、；：""''（）]/).filter(Boolean);
  const tWords = text.toLowerCase().split(/\s+|[，。？！、；：""''（）]/).filter(Boolean);
  const tSet = new Set(tWords);
  return qWords.reduce((sum, w) => sum + (tSet.has(w) ? 1 : 0), 0);
}

function findBestEvent(question: string, events: ReviewEvent[]): ReviewEvent | null {
  let best: ReviewEvent | null = null;
  let bestScore = 0;
  for (const event of events) {
    const text = `${event.title} ${event.summary} ${event.type} ${event.location} ${event.time}`;
    const score = matchScore(question, text);
    if (score > bestScore) {
      bestScore = score;
      best = event;
    }
  }
  return bestScore > 0 ? best : null;
}

function findBestTimelineEvent(question: string, events: ReturnType<typeof loadTimelineEvents>) {
  let best = null as typeof events[0] | null;
  let bestScore = 0;
  for (const event of events) {
    const text = `${event.title} ${event.desc} ${event.year}`;
    const score = matchScore(question, text);
    if (score > bestScore) {
      bestScore = score;
      best = event;
    }
  }
  return bestScore > 0 ? best : null;
}

function findBestAnswer(question: string, answers: Record<string, string>): { q: string; a: string } | null {
  let bestKey = '';
  let bestScore = 0;
  for (const [key, answer] of Object.entries(answers)) {
    const score = matchScore(question, `${key} ${answer}`);
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }
  return bestScore > 0 ? { q: bestKey, a: answers[bestKey] } : null;
}

export interface DigitalAnswerResult {
  answer: string;
  source?: string;
  hasMemory?: boolean;
}

export function getArchiveBasedDigitalAnswer(question: string, name: string): DigitalAnswerResult {
  const archive = loadCurrentArchive();
  const archiveId = archive?.id || 'default';
  const archiveName = archive?.name || name;
  const lowerQ = question.toLowerCase();

  // Identity / basic facts
  if (/你是谁|你叫什么|名字/.test(lowerQ)) {
    return {
      answer: `我是${archiveName}的数字分身。我的记忆来自人生档案和采访素材，很高兴能和你聊聊过去的故事。`,
      source: '人生档案',
      hasMemory: true,
    };
  }
  if (/出生|生日|哪里人|老家|籍贯/.test(lowerQ)) {
    const origin = archive?.origin || '故乡';
    const birthYear = archive?.birthYear || '';
    return {
      answer: `我${birthYear ? birthYear + '年' : ''}出生在${origin}，那片土地承载了我很多童年记忆。`,
      source: '人生档案',
      hasMemory: true,
    };
  }
  if (/工作|职业|做什么/.test(lowerQ)) {
    const occupation = archive?.occupation || '普通劳动者';
    return {
      answer: `我这一辈子主要从事${occupation}相关的工作。做过的具体事情，都记录在人生档案里。`,
      source: '人生档案',
      hasMemory: true,
    };
  }

  const reviewEvents = loadJson<ReviewEvent[]>(`cj_review_events_${archiveId}`, []);
  const timelineEvents = loadTimelineEvents(archiveId);
  const answers = loadInterviewAnswers(archiveId);

  const confirmedEvents = reviewEvents.filter((e) => e.status === 'confirmed');
  const bestEvent = findBestEvent(question, confirmedEvents) || findBestEvent(question, reviewEvents);
  if (bestEvent) {
    const year = extractYear(bestEvent.time);
    return {
      answer: `我记得${year ? year + '年' : bestEvent.time}，${bestEvent.location ? '在' + bestEvent.location + '，' : ''}${bestEvent.title}。${bestEvent.summary}`,
      source: `采访整理 · ${bestEvent.title}`,
      hasMemory: true,
    };
  }

  const bestTimeline = findBestTimelineEvent(question, timelineEvents);
  if (bestTimeline) {
    return {
      answer: `我的人生档案里记录着${bestTimeline.year ? bestTimeline.year + '年' : ''}${bestTimeline.title}。${bestTimeline.desc.slice(0, 120)}${bestTimeline.desc.length > 120 ? '……' : ''}`,
      source: `人生档案 · ${bestTimeline.title}`,
      hasMemory: true,
    };
  }

  const bestAnswer = findBestAnswer(question, answers);
  if (bestAnswer) {
    return {
      answer: bestAnswer.a.slice(0, 180) + (bestAnswer.a.length > 180 ? '……' : ''),
      source: '采访原话',
      hasMemory: true,
    };
  }

  // Fallback for common themes
  if (/童年|小时候|父亲|母亲|家人/.test(lowerQ)) {
    return {
      answer: `小时候的事，我记得最清楚的是家和亲人。如果你想听具体的，可以问问"童年最难忘的事"或者"父亲的故事"，我会从档案里找更准确的回忆。`,
      source: '数字分身',
      hasMemory: false,
    };
  }
  if (/创业|工作|工厂|技术/.test(lowerQ)) {
    return {
      answer: `我这辈子和工作打了很久交道。具体的工作经历都整理在人生档案里，你可以问得更具体一些，比如"第一次创业是什么时候"。`,
      source: '数字分身',
      hasMemory: false,
    };
  }
  if (/家庭|妻子|丈夫|孩子|孙子|孙女/.test(lowerQ)) {
    return {
      answer: `家庭一直是我心里最柔软的地方。关于家人的具体故事，你可以问"结婚那年的事"或者"对孩子的期望"，我会尽量回忆。`,
      source: '数字分身',
      hasMemory: false,
    };
  }
  if (/家风|家训|期望|后人|晚辈/.test(lowerQ)) {
    return {
      answer: `如果要留给后辈几句话，我会说：做人做事要正直、踏实，心里要有家人，肩上要有责任。这些也是我们家一直传下来的家风。`,
      source: '家风传承',
      hasMemory: true,
    };
  }

  return {
    answer: `这个问题我一时没有对应的记忆。你可以试着用更具体的年月、地点或人物来问我，我会从人生档案里帮你找找。`,
    source: '数字分身',
    hasMemory: false,
  };
}
