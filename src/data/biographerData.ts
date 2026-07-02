import type { Biographer, BiographerFormData, BiographerStatus } from '../types/biographer';

const STORAGE_KEY = 'chuanjiashi_biographers';

const defaultBiographers: Biographer[] = [
  {
    id: 'bio_001',
    name: '李文轩',
    phone: '13800138000',
    email: 'liwenxuan@example.com',
    intro: '资深传记撰稿人，专注家族史与个人回忆录写作十余年，曾协助百余位长者整理人生故事。',
    specialties: ['家族史', '回忆录', '口述史'],
    experience: 12,
    status: 'active',
    createdAt: '2024-01-15T09:30:00',
  },
  {
    id: 'bio_002',
    name: '王雅琴',
    phone: '13900139000',
    email: 'wangyaqin@example.com',
    intro: '前媒体编辑，擅长温情叙事风格，善于引导长辈回忆细节，作品多见于家庭纪念册与数字档案。',
    specialties: ['温情叙事', '采访引导', '纪念册'],
    experience: 8,
    status: 'active',
    createdAt: '2024-02-20T14:00:00',
  },
  {
    id: 'bio_003',
    name: '陈墨涵',
    phone: '13700137000',
    email: 'chenmohan@example.com',
    intro: '青年传记师，熟悉新媒体表达，擅长将传统家族史转化为适合年轻人阅读的数字化内容。',
    specialties: ['数字内容', '家族百科', '年轻叙事'],
    experience: 3,
    status: 'pending',
    createdAt: '2024-05-10T11:20:00',
  },
];

function loadFromStorage(): Biographer[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(data: Biographer[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadBiographers(): Biographer[] {
  const stored = loadFromStorage();
  if (stored) return stored;
  saveToStorage(defaultBiographers);
  return defaultBiographers;
}

export function addBiographer(data: BiographerFormData): Biographer {
  const list = loadBiographers();
  const newItem: Biographer = {
    ...data,
    id: `bio_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const next = [newItem, ...list];
  saveToStorage(next);
  return newItem;
}

export function updateBiographer(id: string, data: BiographerFormData): Biographer | null {
  const list = loadBiographers();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const updated = { ...list[index], ...data, id: list[index].id };
  const next = [...list];
  next[index] = updated;
  saveToStorage(next);
  return updated;
}

export function deleteBiographer(id: string): boolean {
  const list = loadBiographers();
  const next = list.filter((item) => item.id !== id);
  if (next.length === list.length) return false;
  saveToStorage(next);
  return true;
}

export function getStatusLabel(status: BiographerStatus): string {
  const map: Record<BiographerStatus, string> = {
    pending: '待审核',
    active: '已启用',
    inactive: '已停用',
  };
  return map[status];
}
