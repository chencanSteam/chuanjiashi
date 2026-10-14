export interface ManuscriptChapter { id: string; title: string; content: string }

export const workStorageKey = (orderId: string) => `cj_biographer_work_${orderId}`;

export function parseManuscriptChapters(content: string): ManuscriptChapter[] {
  const headings = [...content.matchAll(/^第[一二三四五六七八九十百\d]+章[^\n]*$/gm)];
  if (!headings.length) return content.trim() ? [{ id: 'whole', title: '全文', content: content.trim() }] : [];
  return headings.map((match, index) => ({
    id: `chapter-${index + 1}`,
    title: match[0].trim(),
    content: content.slice(match.index + match[0].length, headings[index + 1]?.index ?? content.length).trim(),
  }));
}

export function readWorkChapters(orderId: string): ManuscriptChapter[] {
  try {
    const value = JSON.parse(localStorage.getItem(workStorageKey(orderId)) || '[]');
    return Array.isArray(value) ? value.filter((item): item is ManuscriptChapter =>
      typeof item?.id === 'string' && typeof item?.title === 'string' && typeof item?.content === 'string') : [];
  } catch { return []; }
}
