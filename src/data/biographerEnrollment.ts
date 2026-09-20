// 入驻原型专用存储，与现有订单、传记师名录和接口 mock 隔离。
export const ENROLLMENT_KEY = 'cj_biographer_enrollment_v1';
export const ENROLLMENT_EVENT = 'cj-enrollment-updated';
export const ENROLLMENT_DEPOSIT = 1000;
export interface ServiceCity { province: string; city: string }
export function cityLabel(city: ServiceCity) { return city.province === city.city || !city.province ? city.city : `${city.province} / ${city.city}`; }
export type EnrollmentStatus = 'draft' | 'pending' | 'supplement' | 'rejected' | 'approved' | 'active';
export const statusLabels: Record<EnrollmentStatus, string> = { draft: '草稿', pending: '审核中', supplement: '待补充资料', rejected: '审核未通过', approved: '待确认合作', active: '已开通' };
export interface EnrollmentFile { name: string; data: string; type: string }
export interface Enrollment {
  owner: string; name: string; idCard: string; identityVerifiedAt: string; phone: string; cities: ServiceCity[];
  intro: string; experience: string; specialties: string[]; workTitle: string;
  workDescription: string; workUrl: string; files: EnrollmentFile[]; avatar: string;
  consent: boolean; status: EnrollmentStatus; reason: string; submittedAt: string;
  updatedAt: string; activatedAt: string; history: { at: string; text: string }[];
  depositAmount: number; depositPaidAt: string;
}
export function emptyEnrollment(owner: string): Enrollment {
  return { owner, name: '', idCard: '', identityVerifiedAt: '', phone: owner, cities: [], intro: '', experience: '', specialties: [], workTitle: '', workDescription: '', workUrl: '', files: [], avatar: '', consent: false, status: 'draft', reason: '', submittedAt: '', updatedAt: '', activatedAt: '', history: [], depositAmount: ENROLLMENT_DEPOSIT, depositPaidAt: '' };
}
export function readEnrollments(): Enrollment[] {
  try {
    const value = JSON.parse(localStorage.getItem(ENROLLMENT_KEY) || '[]');
    return Array.isArray(value) ? value.filter((x: Enrollment) => x && typeof x.owner === 'string' && Array.isArray(x.history) && Array.isArray(x.files) && x.status in statusLabels).map((x: Enrollment & { city?: string }) => ({
      ...emptyEnrollment(x.owner), ...x,
      // 兼容上一版单城市草稿，不清除用户已填写的资料。
      cities: Array.isArray(x.cities) ? x.cities : x.city ? [{ province: '', city: x.city }] : [],
    })) : [];
  } catch { return []; }
}
export function saveEnrollment(record: Enrollment): Enrollment {
  const saved = { ...record, updatedAt: new Date().toISOString() };
  const all = readEnrollments().filter(x => x.owner !== record.owner);
  localStorage.setItem(ENROLLMENT_KEY, JSON.stringify([...all, saved]));
  window.dispatchEvent(new Event(ENROLLMENT_EVENT));
  return saved;
}
export function transitionEnrollment(record: Enrollment, status: EnrollmentStatus, text: string): Enrollment {
  const at = new Date().toISOString();
  return saveEnrollment({ ...record, status, reason: status === 'supplement' || status === 'rejected' ? text : '', submittedAt: status === 'pending' ? at : record.submittedAt, activatedAt: status === 'active' ? at : record.activatedAt, history: [...record.history, { at, text }] });
}
export function validWorkUrl(value: string): boolean {
  if (!value.trim()) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}
