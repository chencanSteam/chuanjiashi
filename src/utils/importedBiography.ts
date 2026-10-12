export interface ImportedBiography {
  fileName: string;
  text: string;
  updatedAt: string;
}

/** 读取「已有传记上传」流程保存的上传传记素材（Onboarding 上传时写入 cj_imported_biography_<档案id>） */
export function loadImportedBiography(archiveId: string): ImportedBiography | null {
  try {
    const raw = localStorage.getItem(`cj_imported_biography_${archiveId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.text !== 'string' || !parsed.text.trim()) return null;
    return parsed as ImportedBiography;
  } catch {
    return null;
  }
}
