import { biographyChapterTitles, loadJson, saveJson, type ChapterData } from '../data/aiMock';
import { loadConfirmedOutline } from './biographyOutline';

export interface ChapterReviewState {
  status: 'notReviewed' | 'reviewing' | 'reviewed';
  updatedAt: string | null;
}

export function getWorkflowArchiveId(): string {
  return localStorage.getItem('cj_current_archive_id') || 'default';
}

export function getWorkflowArchiveName(): string {
  const archiveId = getWorkflowArchiveId();
  const archives = loadJson<Array<{ id: string; name: string }>>('cj_archives', []);
  return archives.find((archive) => archive.id === archiveId)?.name || '张明远';
}

export function loadWorkflowChapters(archiveId = getWorkflowArchiveId()): ChapterData[] {
  const outline = loadConfirmedOutline(archiveId);
  const fallbackTitles = outline?.chapters.map((chapter) => chapter.title) || biographyChapterTitles;
  const saved = loadJson<ChapterData[]>(`cj_biography_chapters_${archiveId}`, []);
  if (saved.length > 0) return saved;
  return fallbackTitles.map((title) => ({
    title,
    materials: 0,
    status: 'notGenerated' as const,
    updatedAt: null,
    content: '',
  }));
}

export function saveWorkflowChapters(archiveId: string, chapters: ChapterData[]): void {
  saveJson(`cj_biography_chapters_${archiveId}`, chapters);
}

export function loadReviewStates(archiveId = getWorkflowArchiveId()): Record<string, ChapterReviewState> {
  return loadJson<Record<string, ChapterReviewState>>(`cj_biography_review_${archiveId}`, {});
}

export function saveReviewStates(archiveId: string, states: Record<string, ChapterReviewState>): void {
  saveJson(`cj_biography_review_${archiveId}`, states);
}

export function stripHtml(content: string): string {
  return content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}
