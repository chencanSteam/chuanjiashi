export interface MobileArchive {
  id: string;
  name: string;
  gender?: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
  tags?: string[];
  createdAt?: string;
}

export function loadLegacyArchives(): MobileArchive[] {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLegacyArchives(archives: MobileArchive[]): void {
  localStorage.setItem('cj_archives', JSON.stringify(archives));
}

export function resolveCurrentArchiveId(archives: MobileArchive[]): string {
  const storedId = localStorage.getItem('cj_current_archive_id') || '';
  return archives.some((archive) => archive.id === storedId) ? storedId : (archives[0]?.id || '');
}

export function setCurrentArchiveId(id: string): void {
  if (id) localStorage.setItem('cj_current_archive_id', id);
}

export function updateLegacyArchive(id: string, patch: Partial<MobileArchive>): MobileArchive | null {
  const archives = loadLegacyArchives();
  const index = archives.findIndex((archive) => archive.id === id);
  if (index < 0) return null;
  const updated = { ...archives[index], ...patch };
  archives[index] = updated;
  saveLegacyArchives(archives);
  return updated;
}
