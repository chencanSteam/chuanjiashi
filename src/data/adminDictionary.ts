import { industryOccupations } from './occupations';

export const ADMIN_DICTIONARY_KEY = 'cj_admin_dictionary_v2';
export const ADMIN_DICTIONARY_EVENT = 'cj-admin-dictionary-updated';
export const PLATFORM_FEE_CODE = 'BIO_PLATFORM_FEE_RATE';

export interface DictionaryCategory {
  id: string;
  name: string;
  code: string;
  group: string;
}

export interface DictionaryEntry {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  value: string;
  note: string;
  enabled: boolean;
  updatedAt: string;
}

export interface AdminDictionaryData {
  categories: DictionaryCategory[];
  entries: DictionaryEntry[];
}

const defaultCategories: DictionaryCategory[] = [
  { id: 'industry', name: '行业', code: 'INDUSTRY', group: '基础资料' },
  { id: 'occupation', name: '职业', code: 'OCCUPATION', group: '基础资料' },
  { id: 'biographer_service', name: '传记师服务配置', code: 'BIOGRAPHER_SERVICE', group: '业务配置' },
];

function nowText() {
  return new Date().toLocaleString('zh-CN', { hour12: false });
}

function defaultEntries(): DictionaryEntry[] {
  const entries: DictionaryEntry[] = [];
  Object.entries(industryOccupations).forEach(([industry, occupations], industryIndex) => {
    entries.push({
      id: `industry-${industryIndex + 1}`, categoryId: 'industry', name: industry,
      code: `INDUSTRY_${String(industryIndex + 1).padStart(2, '0')}`,
      value: industry, note: '', enabled: true, updatedAt: '2026-09-08 10:30',
    });
    occupations.forEach((occupation, occupationIndex) => entries.push({
      id: `occupation-${industryIndex + 1}-${occupationIndex + 1}`,
      categoryId: 'occupation', name: occupation,
      code: `JOB_${String(industryIndex + 1).padStart(2, '0')}_${String(occupationIndex + 1).padStart(2, '0')}`,
      value: occupation, note: `所属行业：${industry}`, enabled: true, updatedAt: '2026-09-08 10:30',
    }));
  });
  entries.push({
    id: 'biographer-platform-fee', categoryId: 'biographer_service', name: '平台服务费率',
    code: PLATFORM_FEE_CODE, value: '15%', note: '仅影响新创建的服务订单，历史订单保持原费率。',
    enabled: true, updatedAt: '2026-10-13 10:30',
  });
  return entries;
}

type LegacyDictionaryItem = {
  id: string; name: string; code: string; parent: string; level: '行业' | '职业'; enabled: boolean; updatedAt: string;
};

function initialData(): AdminDictionaryData {
  const entries = defaultEntries();
  try {
    const raw = localStorage.getItem('cj_admin_dictionary_rows');
    if (!raw) return { categories: [...defaultCategories], entries };
    const legacy = JSON.parse(raw) as LegacyDictionaryItem[];
    if (!Array.isArray(legacy)) return { categories: [...defaultCategories], entries };
    const migrated = legacy
      .filter(item => item && (item.level === '行业' || item.level === '职业'))
      .map(item => ({
        id: item.id, categoryId: item.level === '行业' ? 'industry' : 'occupation',
        name: item.name, code: item.code, value: item.name,
        note: item.level === '职业' && item.parent !== '—' ? `所属行业：${item.parent}` : '',
        enabled: item.enabled, updatedAt: item.updatedAt,
      }));
    return { categories: [...defaultCategories], entries: [...migrated, entries.at(-1)!] };
  } catch {
    return { categories: [...defaultCategories], entries };
  }
}

export function readAdminDictionary(): AdminDictionaryData {
  try {
    const raw = localStorage.getItem(ADMIN_DICTIONARY_KEY);
    if (raw) {
      const data = JSON.parse(raw) as AdminDictionaryData;
      if (Array.isArray(data.categories) && Array.isArray(data.entries)) return data;
    }
  } catch {
    // 损坏的本地数据回退到演示默认值。
  }
  return initialData();
}

export function saveAdminDictionary(data: AdminDictionaryData) {
  localStorage.setItem(ADMIN_DICTIONARY_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(ADMIN_DICTIONARY_EVENT));
}

export function getPlatformFeeRate(): number {
  const entry = readAdminDictionary().entries.find(item => item.code === PLATFORM_FEE_CODE && item.enabled);
  const percent = Number(typeof entry?.value === 'string' ? entry.value.replace('%', '').trim() : NaN);
  return entry && Number.isFinite(percent) && percent >= 0 && percent <= 100 ? percent / 100 : 0.15;
}

export function dictionaryNowText() { return nowText(); }
