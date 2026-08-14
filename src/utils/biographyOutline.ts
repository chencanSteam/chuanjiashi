import { loadJson, saveJson, chapterMockContents, biographyChapterTitles } from '../data/aiMock';
import { loadTimelineEvents, type StoredTimelineEvent } from './eventSync';

/**
 * 传记大纲：AI 规划草案 + 人工确认，纯前端存储（localStorage），不走后端接口。
 * 确认后的大纲是 AI 传记生成页章节结构的唯一来源。
 */

export interface OutlineChapter {
  id: string;
  title: string;
  /** 本章主旨说明（AI 建议，可人工修改） */
  summary: string;
  /** 关联的时间轴事件标题（显式关联，代替关键词硬匹配） */
  eventTitles: string[];
}

export interface BiographyOutline {
  version: number;
  status: 'draft' | 'confirmed';
  updatedAt: string;
  chapters: OutlineChapter[];
}

const OUTLINE_KEY = (archiveId: string) => `cj_biography_outline_${archiveId}`;

export function loadOutline(archiveId: string): BiographyOutline | null {
  return loadJson<BiographyOutline | null>(OUTLINE_KEY(archiveId), null);
}

export function saveOutline(archiveId: string, outline: BiographyOutline): void {
  saveJson(OUTLINE_KEY(archiveId), outline);
}

export function loadConfirmedOutline(archiveId: string): BiographyOutline | null {
  const outline = loadOutline(archiveId);
  return outline && outline.status === 'confirmed' ? outline : null;
}

/** 人生阶段分类：与 eventSync / biographyAssembler 的关键词口径保持一致 */
const STAGES: Array<{ title: string; summary: string; match: RegExp }> = [
  { title: '童年记忆', summary: '记录童年时期的成长环境、家庭氛围与难忘往事。', match: /出生|童年|小时候|成长|玩耍/ },
  { title: '求学岁月', summary: '回顾求学路上的关键节点、师友影响与青春选择。', match: /教育|大学|学校|考入|学习|老师|读书|毕业/ },
  { title: '工作经历', summary: '梳理职业生涯的起点、成长与重要成就。', match: /工作|职业|工厂|机床|车间|技术/ },
  { title: '创业之路', summary: '呈现创业抉择、艰难起步与事业发展的历程。', match: /创业|公司|合伙|业务|企业/ },
  { title: '家庭生活', summary: '记录婚姻、子女与家庭相处中的温暖片段。', match: /结婚|婚姻|家庭|妻子|丈夫|女儿|儿子|子女/ },
  { title: '人生感悟', summary: '沉淀一生的信念、家风与想留给后辈的话。', match: /家风|感悟|家训|教诲|传承|善良|正直/ },
];

function classifyEvent(event: StoredTimelineEvent): string | null {
  const text = `${event.title} ${event.desc}`;
  const stage = STAGES.find((s) => s.match.test(text));
  return stage ? stage.title : null;
}

let chapterSeq = 0;
function nextChapterId(): string {
  chapterSeq += 1;
  return `oc_${Date.now()}_${chapterSeq}`;
}

/**
 * 基于已确认的时间轴事件生成大纲草案。
 * 无素材时回退到通用人生阶段模板，保证流程可用。
 */
export function buildDraftOutline(archiveId: string, prev?: BiographyOutline | null): BiographyOutline {
  const events = loadTimelineEvents(archiveId);
  const byStage = new Map<string, string[]>();
  events.forEach((e) => {
    const stage = classifyEvent(e);
    if (!stage) return;
    byStage.set(stage, [...(byStage.get(stage) || []), e.title]);
  });

  const chapters: OutlineChapter[] = [];
  chapters.push({
    id: nextChapterId(),
    title: '前言',
    summary: '交代传记的缘起、传主概况与家族背景。',
    eventTitles: [],
  });

  if (events.length > 0) {
    STAGES.forEach((s) => {
      const titles = byStage.get(s.title);
      if (!titles || titles.length === 0) return;
      chapters.push({ id: nextChapterId(), title: s.title, summary: s.summary, eventTitles: titles });
    });
  } else {
    biographyChapterTitles
      .filter((t) => t !== '前言' && t !== '后记')
      .forEach((t) => {
        const stage = STAGES.find((s) => s.title === t);
        chapters.push({
          id: nextChapterId(),
          title: t,
          summary: stage?.summary || '',
          eventTitles: [],
        });
      });
  }

  chapters.push({
    id: nextChapterId(),
    title: '后记',
    summary: '总结传主的人生历程，寄语后辈。',
    eventTitles: [],
  });

  return {
    version: prev?.version ?? 0,
    status: 'draft',
    updatedAt: new Date().toLocaleString('zh-CN'),
    chapters,
  };
}

/** 生成单章正文：固定章节用模板打底，自定义章节用主旨说明起笔，再拼接已关联事件的段落 */
export function composeOutlineChapterContent(
  archiveName: string,
  chapter: OutlineChapter,
  allEvents: StoredTimelineEvent[]
): string {
  const base = chapterMockContents[chapter.title];
  const parts: string[] = [];

  if (base) {
    parts.push(base);
  } else if (chapter.summary) {
    parts.push(`【本章主旨】${chapter.summary}`);
  }

  const matched = chapter.eventTitles
    .map((t) => allEvents.find((e) => e.title === t))
    .filter((e): e is StoredTimelineEvent => !!e);

  if (matched.length > 0) {
    parts.push('\n\n【根据本次采访整理】\n');
    matched.forEach((e) => {
      const timeText = e.year ? `${e.year}年` : '';
      parts.push(`回顾${timeText}，${archiveName}经历过这样一件事：${e.title}。${e.desc}`);
      parts.push('');
    });
  } else if (!base && chapter.title !== '前言' && chapter.title !== '后记') {
    parts.push(`\n本章素材仍在收集中，可在采访中补充「${chapter.title}」相关经历后重新生成。`);
  }

  return parts.join('\n').trim();
}
