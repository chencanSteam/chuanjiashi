import { chapterMockContents } from '../data/aiMock';
import type { ReviewEvent } from '../data/aiMock';
import { generateInterviewTopics } from './interviewTopics';
import type { SupplementAnswer } from '../data/interviewCollaboration';

export interface AssemblerInput {
  archiveName: string;
  events: ReviewEvent[];
  highlights: string[];
  answers: Record<string, string>;
  supplementAnswers?: Record<string, SupplementAnswer[]>;
}

function extractYear(time: string): string {
  const match = time.match(/(\d{4})/);
  return match ? match[1] : '';
}

function eventMatchesChapter(chapter: string, event: ReviewEvent): boolean {
  const c = chapter.trim();
  const t = (event.type || '').trim();
  const title = (event.title || '').trim();
  const summary = (event.summary || '').trim();
  const text = `${title} ${summary}`.toLowerCase();

  if (c === '童年记忆') {
    return t.includes('成长') || /童年|小时候|父亲背|大水|苏州|玩耍/.test(text);
  }
  if (c === '求学岁月') {
    return t.includes('教育') || /大学|学校|考入|学习|老师|读书/.test(text);
  }
  if (c === '工作经历') {
    return t.includes('职业') || /工作|机床|工厂|技术员|车间/.test(text);
  }
  if (c === '创业之路') {
    return t.includes('创业') || /创业|公司|明远|合伙|业务/.test(text);
  }
  if (c === '家庭生活') {
    return t.includes('婚姻') || /结婚|妻子|家庭|女儿|儿子|婚姻/.test(text);
  }
  if (c === '人生感悟') {
    return t.includes('家风') || /家风|感悟|家训|教诲|善良|正直/.test(text);
  }
  return false;
}

function renderEventParagraph(archiveName: string, chapter: string, event: ReviewEvent): string {
  const year = extractYear(event.time);
  const timeText = year ? `${year}年` : event.time;
  const locationText = event.location ? `在${event.location}，` : '';

  const intros: Record<string, string> = {
    '童年记忆': `回忆童年，${archiveName}常常提起${timeText}${locationText}发生的一件事：`,
    '求学岁月': `在求学路上，${timeText}${locationText}有这样一段经历：`,
    '工作经历': `谈到职业生涯，${timeText}${locationText}这件事让他印象深刻：`,
    '创业之路': `创业历程中，${timeText}${locationText}是一个重要的节点：`,
    '家庭生活': `关于家庭生活，${timeText}${locationText}有这样一段温馨的记忆：`,
    '人生感悟': `在回顾人生时，${archiveName}对${timeText}${locationText}的这段经历深有感触：`,
  };

  const intro = intros[chapter] || `根据采访整理，${timeText}：`;
  return `${intro}${event.title}。${event.summary}`;
}

function renderHighlights(highlights: string[]): string {
  if (highlights.length === 0) return '';
  const items = highlights.map((h) => `「${h.replace(/^“|”$/g, '').trim()}」`).join('；');
  return `在采访中，他还留下了几句让人难忘的话：${items}。这些话语朴素而有力，道出了他一生的信念与追求。`;
}

function renderAnswers(answers: Record<string, string>): string {
  const values = Object.values(answers).filter((v) => v.trim().length > 20);
  if (values.length === 0) return '';
  return values.slice(0, 2).map((v) => v.trim()).join('\n\n');
}

function renderSupplementHighlights(supplementAnswers: Record<string, SupplementAnswer[]>): string {
  const all = Object.values(supplementAnswers).flat();
  if (all.length === 0) return '';
  const byPerson: Record<string, string[]> = {};
  all.forEach((a) => {
    if (!byPerson[a.respondentName]) byPerson[a.respondentName] = [];
    byPerson[a.respondentName].push(a.text.trim());
  });
  return Object.entries(byPerson)
    .slice(0, 2)
    .map(([name, texts]) => `${name}也回忆道：「${texts[0].slice(0, 80)}${texts[0].length > 80 ? '……' : ''}」`)
    .join('\n\n');
}

export function assembleBiography(input: AssemblerInput): Record<string, string> {
  const { archiveName, events, highlights, answers, supplementAnswers = {} } = input;
  const confirmed = events.filter((e) => e.status === 'confirmed');
  const result: Record<string, string> = {};

  Object.entries(chapterMockContents).forEach(([chapter, baseContent]) => {
    if (chapter === '前言' || chapter === '后记') {
      result[chapter] = baseContent;
      return;
    }

    const matched = confirmed.filter((e) => eventMatchesChapter(chapter, e));
    const parts: string[] = [baseContent];

    if (matched.length > 0) {
      parts.push('\n\n【根据本次采访整理】\n');
      matched.forEach((event) => {
        parts.push(renderEventParagraph(archiveName, chapter, event));
        parts.push('');
      });
    }

    if (chapter === '人生感悟' && highlights.length > 0) {
      parts.push(renderHighlights(highlights));
    }

    if ((chapter === '童年记忆' || chapter === '求学岁月') && Object.keys(answers).length > 0) {
      const answerText = renderAnswers(answers);
      if (answerText) {
        parts.push(`\n${archiveName}在采访中也这样回忆道：「${answerText.slice(0, 160)}${answerText.length > 160 ? '……' : ''}」`);
      }
    }

    if (chapter === '家庭生活' && Object.keys(supplementAnswers).length > 0) {
      const supplementText = renderSupplementHighlights(supplementAnswers);
      if (supplementText) {
        parts.push(`\n\n【家人补充】\n${supplementText}`);
      }
    }

    result[chapter] = parts.join('\n').trim();
  });

  return result;
}

function loadArchiveById(archiveId: string) {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (!raw) return null;
    const archives = JSON.parse(raw);
    return archives.find((a: { id: string; name: string; gender?: '男' | '女'; birthYear: string; origin: string; occupation: string; tags?: string[] }) => a.id === archiveId) || null;
  } catch {
    return null;
  }
}

export function loadInterviewAnswers(archiveId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`cj_interview_answers_${archiveId}`);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    // ignore
  }
  const archive = loadArchiveById(archiveId);
  const topics = generateInterviewTopics(archive, archiveId);
  const fallback: Record<string, string> = {};
  topics.forEach((topic) => {
    topic.questions.forEach((q) => {
      fallback[q.id] = q.mockAnswer;
    });
  });
  return fallback;
}
