// 入驻原型专用存储，与现有订单、传记师名录和接口 mock 隔离。
export const ENROLLMENT_KEY = 'cj_biographer_enrollment_v1';
export const ENROLLMENT_EVENT = 'cj-enrollment-updated';
export const ENROLLMENT_DEPOSIT = 1000;
export interface ServiceCity { province: string; city: string }
export function cityLabel(city: ServiceCity) { return city.province === city.city || !city.province ? city.city : `${city.province} / ${city.city}`; }
export type EnrollmentStatus = 'draft' | 'pending' | 'supplement' | 'rejected' | 'approved' | 'active';
export const statusLabels: Record<EnrollmentStatus, string> = { draft: '草稿', pending: '审核中', supplement: '审核未通过', rejected: '审核未通过', approved: '待确认合作', active: '已开通' };
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

const demoEnrollments: Enrollment[] = [
  {
    ...emptyEnrollment('13900138221'), name: '林若宁', idCard: '330102********1234', identityVerifiedAt: '2026-10-14T09:10:00+08:00',
    cities: [{ province: '浙江省', city: '杭州市' }, { province: '浙江省', city: '宁波市' }],
    intro: '曾任地方报社人物专栏记者，近年专注长者口述史和家庭纪念册写作，擅长从生活细节中整理人物经历。',
    experience: '8', specialties: ['口述史采访', '家族传记', '人物写作'], workTitle: '外婆的裁缝铺',
    workDescription: '根据三次访谈和老照片整理的两万字家族回忆录，记录一位裁缝四十年的手艺与家庭故事。',
    consent: true, status: 'pending', submittedAt: '2026-10-14T09:18:00+08:00', updatedAt: '2026-10-14T09:18:00+08:00',
    history: [{ at: '2026-10-14T09:18:00+08:00', text: '申请人提交入驻资料，等待平台审核。' }],
  },
  {
    ...emptyEnrollment('13900138222'), name: '周砚秋', idCard: '320106********4268', identityVerifiedAt: '2026-10-13T15:40:00+08:00',
    cities: [{ province: '江苏省', city: '南京市' }, { province: '江苏省', city: '苏州市' }],
    intro: '中文系毕业，长期从事非虚构写作与人物访谈，熟悉企业创始人传记和家庭史资料梳理。',
    experience: '6', specialties: ['非虚构写作', '企业家传记', '资料整理'], workTitle: '从修车铺到零件厂',
    workDescription: '访谈创业者及四位家人，按求学、创业、转型三个阶段整理人生故事，样稿约一万五千字。',
    consent: true, status: 'pending', submittedAt: '2026-10-13T15:52:00+08:00', updatedAt: '2026-10-13T15:52:00+08:00',
    history: [{ at: '2026-10-13T15:52:00+08:00', text: '申请人提交入驻资料，等待平台审核。' }],
  },
  {
    ...emptyEnrollment('13900138223'), name: '许清禾', idCard: '510107********6382', identityVerifiedAt: '2026-10-10T11:06:00+08:00',
    cities: [{ province: '四川省', city: '成都市' }],
    intro: '从事家庭影像采访和口述文字整理，关注普通人的迁居、工作与家风故事。',
    experience: '4', specialties: ['家庭影像采访', '口述整理'], workTitle: '一封寄往成都的家书',
    workDescription: '以家书和录音访谈为线索整理三代人的迁居经历；代表作说明尚待补充授权情况。',
    consent: true, status: 'rejected', reason: '请补充代表作品的授权说明，并上传一份可核验的完整样稿。',
    submittedAt: '2026-10-09T10:20:00+08:00', updatedAt: '2026-10-11T14:30:00+08:00',
    history: [
      { at: '2026-10-09T10:20:00+08:00', text: '申请人提交入驻资料，等待平台审核。' },
      { at: '2026-10-11T14:30:00+08:00', text: '平台要求补充代表作品的授权说明和完整样稿。' },
    ],
  },
  {
    ...emptyEnrollment('13900138224'), name: '沈明诚', idCard: '320102********2875', identityVerifiedAt: '2026-10-06T10:12:00+08:00',
    cities: [{ province: '江苏省', city: '南京市' }],
    intro: '资深出版编辑，擅长家族人物采访、史料核对与长篇传记结构规划。',
    experience: '11', specialties: ['家族传记', '史料核对', '长篇编辑'], workTitle: '秦淮老街三代人',
    workDescription: '以三代人的口述与地方档案为基础，记录一条街区的家庭生活变迁。',
    consent: true, status: 'approved', submittedAt: '2026-10-06T10:25:00+08:00', updatedAt: '2026-10-08T16:00:00+08:00',
    history: [
      { at: '2026-10-06T10:25:00+08:00', text: '申请人提交入驻资料，等待平台审核。' },
      { at: '2026-10-08T16:00:00+08:00', text: '平台审核通过（演示），等待申请人确认合作。' },
    ],
  },
];

export function readEnrollments(): Enrollment[] {
  try {
    const value = JSON.parse(localStorage.getItem(ENROLLMENT_KEY) || '[]');
    const stored: Enrollment[] = Array.isArray(value) ? value.filter((x: Enrollment) => x && typeof x.owner === 'string' && Array.isArray(x.history) && Array.isArray(x.files) && x.status in statusLabels).map((x: Enrollment & { city?: string }) => ({
      ...emptyEnrollment(x.owner), ...x,
      status: x.status === 'supplement' ? 'rejected' : x.status,
      // 兼容上一版单城市草稿，不清除用户已填写的资料。
      cities: Array.isArray(x.cities) ? x.cities : x.city ? [{ province: '', city: x.city }] : [],
    })) : [];
    const existingOwners = new Set(stored.map(item => item.owner));
    return [...stored, ...demoEnrollments.filter(item => !existingOwners.has(item.owner))];
  } catch { return demoEnrollments; }
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
