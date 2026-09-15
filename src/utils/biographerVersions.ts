export interface BiographerSavedVersion {
  id: string;
  label: string;
  createdAt: string;
  chapterCount: number;
  wordCount: number;
  chapters: unknown[];
}

export function biographerVersionStorageKey(orderId: string) {
  return `cj_biographer_versions_${orderId}`;
}

export function loadBiographerVersions(orderId: string): BiographerSavedVersion[] {
  try {
    const raw = window.localStorage.getItem(biographerVersionStorageKey(orderId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBiographerVersions(orderId: string, versions: BiographerSavedVersion[]) {
  window.localStorage.setItem(biographerVersionStorageKey(orderId), JSON.stringify(versions));
}
