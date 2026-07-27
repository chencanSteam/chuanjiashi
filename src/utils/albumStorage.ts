export interface AlbumPhoto {
  id: string;
  name: string;
  dataUrl: string;
  date: string;
  size: number;
}

const STORAGE_KEY = 'cj_album_photos';
export const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB

function loadAll(): Record<string, AlbumPhoto[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export function loadAlbumPhotos(album: string): AlbumPhoto[] {
  return loadAll()[album] ?? [];
}

export function saveAlbumPhotos(album: string, photos: AlbumPhoto[]): boolean {
  try {
    const all = loadAll();
    all[album] = photos;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

export function readFilesAsDataUrls(
  files: FileList,
  onPhoto: (photo: AlbumPhoto) => void,
  onSkip: (file: File, reason: string) => void,
  onDone: () => void,
) {
  const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
  if (list.length === 0) {
    onDone();
    return;
  }
  let pending = list.length;
  const done = () => {
    pending -= 1;
    if (pending === 0) onDone();
  };
  list.forEach((file) => {
    if (file.size > MAX_PHOTO_SIZE) {
      onSkip(file, 'exceeds-2mb');
      done();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onPhoto({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        dataUrl: String(reader.result),
        date: new Date().toISOString().slice(0, 10),
        size: file.size,
      });
      done();
    };
    reader.onerror = () => {
      onSkip(file, 'read-error');
      done();
    };
    reader.readAsDataURL(file);
  });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadTextFile(content: string, filename: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  URL.revokeObjectURL(url);
}
