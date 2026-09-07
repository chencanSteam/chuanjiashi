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
// 统一传记八大写作框架（与客户约定一致）：无论行业，成稿固定按这 8 个篇章
const STAGES: Array<{ title: string; summary: string; match: RegExp }> = [
  { title: '故里童年 · 初心萌芽', summary: '籍贯、童年、家庭、家风与少年性格。', match: /出生|童年|小时候|成长|玩耍/ },
  { title: '求学成长 · 岁月积淀', summary: '读书、成长、启蒙与人生转折点。', match: /教育|大学|学校|考入|学习|老师|读书|毕业/ },
  { title: '择业入行 · 缘起初心', summary: '为什么进入这个行业，职业起点与初心。', match: /工作|职业|工厂|机床|车间|技术|入行|分配/ },
  { title: '深耕岁月 · 历练成长', summary: '工作经历、创业经历与深耕故事。', match: /创业|公司|合伙|业务|企业|项目|深耕/ },
  { title: '风雨磨砺 · 破局成长', summary: '人生挫折、困难、逆袭与蜕变。', match: /挫折|困难|失败|危机|逆袭|磨砺/ },
  { title: '行业感悟 · 职业修为', summary: '多年行业沉淀与职业价值观。', match: /感悟|行业|职业|理念|匠心|诚信/ },
  { title: '家风人生 · 温情生活', summary: '家庭、陪伴与做人准则。', match: /结婚|婚姻|家庭|妻子|丈夫|女儿|儿子|子女|家风|家训|传承/ },
  { title: '人生回望 · 未来愿景', summary: '人生总结、人生格言与未来期许。', match: /退休|总结|回望|愿景|格言|公益/ },
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

  if (events.length > 0) {
    STAGES.forEach((s) => {
      const titles = byStage.get(s.title);
      if (!titles || titles.length === 0) return;
      chapters.push({ id: nextChapterId(), title: s.title, summary: s.summary, eventTitles: titles });
    });
  } else {
    biographyChapterTitles
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
  } else if (!base) {
    parts.push(`\n本章素材仍在收集中，可在采访中补充「${chapter.title}」相关经历后重新生成。`);
  }

  return parts.join('\n').trim();
}
