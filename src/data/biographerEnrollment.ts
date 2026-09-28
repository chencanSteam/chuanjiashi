import type { BiographerFormData } from '../types/biographer';

// 入驻原型专用存储，与现有订单、传记师名录和接口 mock 隔离。
export const ENROLLMENT_KEY = 'cj_biographer_enrollment_v1';
export const ENROLLMENT_EVENT = 'cj-enrollment-updated';
export const ENROLLMENT_DEPOSIT = 1000;
export interface ServiceCity { province: string; city: string }
export function cityLabel(city: ServiceCity) { return city.province === city.city || !city.province ? city.city : `${city.province} / ${city.city}`; }
export type EnrollmentStatus = 'draft' | 'pending' | 'rejected' | 'approved' | 'active';
export const statusLabels: Record<EnrollmentStatus, string> = { draft: '草稿', pending: '审核中', rejected: '审核未通过', approved: '待付押金', active: '已开通' };
export interface EnrollmentFile { name: string; data: string; type: string }
export interface Enrollment {
  owner: string; name: string; idCard: string; identityVerifiedAt: string; phone: string; cities: ServiceCity[];
  intro: string; experience: string; specialties: string[]; workTitle: string;
  workDescription: string; workUrl: string; files: EnrollmentFile[]; avatar: string;
  consent: boolean; status: EnrollmentStatus; reason: string; submittedAt: string;
  updatedAt: string; activatedAt: string; history: { at: string; text: string }[];
  depositAmount: number; depositPaidAt: string;
  accountGeneratedAt?: string; demoAccountVersion?: number;
  accountProfile?: BiographerFormData;
}
export function enrollmentStatusLabel(record: Enrollment): string {
  return record.status === 'approved' && record.depositPaidAt ? '已付押金待生成账号' : statusLabels[record.status];
}
export function emptyEnrollment(owner: string): Enrollment {
  return { owner, name: '', idCard: '', identityVerifiedAt: '', phone: owner, cities: [], intro: '', experience: '', specialties: [], workTitle: '', workDescription: '', workUrl: '', files: [], avatar: '', consent: false, status: 'draft', reason: '', submittedAt: '', updatedAt: '', activatedAt: '', history: [], depositAmount: ENROLLMENT_DEPOSIT, depositPaidAt: '' };
}
export function demoEnrollments(): Enrollment[] {
  const samples: { name: string; city: string; province: string; status: EnrollmentStatus; specialty: string; experience: string; title: string; reason: string }[] = [
    { name: '林知秋', city: '杭州市', province: '浙江省', status: 'pending', specialty: '人物传记', experience: '从事人物采访与纪实写作8年，参与社区口述史整理，擅长梳理成长经历与职业转折。', title: '父亲的修表铺', reason: '' },
    { name: '陈书宁', city: '苏州市', province: '江苏省', status: 'pending', specialty: '家族故事', experience: '从事编辑工作6年，参与家族文献整理与长者访谈，熟悉老照片、书信等资料的归纳。', title: '老巷里的三代人', reason: '' },
    { name: '周予安', city: '成都市', province: '四川省', status: 'rejected', specialty: '口述历史', experience: '有4年社区文化项目经验，持续记录社区长者的生活故事。', title: '街坊记忆', reason: '请补充一篇完整的代表作品，并说明本人承担的采访与写作工作。' },
    { name: '许静禾', city: '南京市', province: '江苏省', status: 'approved', specialty: '人物传记', experience: '从事出版编辑与人物写作10年，参与多部个人回忆录的采访、整理和校对。', title: '讲台上的四十年', reason: '' },
    { name: '陆景川', city: '武汉市', province: '湖北省', status: 'rejected', specialty: '生活纪实', experience: '从事内容创作3年，希望参与个人传记与家庭故事记录。', title: '故乡往事', reason: '目前提供的作品以短篇随笔为主，尚不足以评估长篇传记整理能力，建议补充完整作品后再次申请。' },
  ];
  const existing = samples.map((sample, index) => {
    const submittedAt = `2026-09-${String(21 - index).padStart(2, '0')}T09:30:00+08:00`;
    const updatedAt = `2026-09-${String(21 - index).padStart(2, '0')}T14:20:00+08:00`;
    const history = [{ at: submittedAt, text: '提交传记师入驻申请（演示资料）' }];
    if (sample.status !== 'pending') history.push({ at: updatedAt, text: sample.reason || '平台审核通过（演示），等待申请人缴纳押金' });
    return {
      ...emptyEnrollment(`demo-enrollment-${index + 1}`),
      name: sample.name, phone: `1380000100${index + 1}`, idCard: '',
      cities: [{ province: sample.province, city: sample.city }],
      intro: `${sample.name}，专注${sample.specialty}，希望帮助更多家庭记录真实而有温度的人生故事。（演示资料）`,
      experience: sample.experience, specialties: [sample.specialty],
      workTitle: sample.title, workDescription: `《${sample.title}》以人物访谈和生活细节为主线，梳理成长、工作与家庭经历，呈现个人与时代的联系。本条为原型演示作品简介。`,
      consent: true, status: sample.status, reason: sample.reason,
      submittedAt, updatedAt, history,
    };
  });
  const submittedAt = '2026-09-21T15:00:00+08:00';
  const workExcerpt = '《外婆的裁缝桌》\n虚构演示作品节选，人物与经历均为虚构。\n\n外婆总把软尺放在缝纫机右侧。那张用了三十多年的木桌，留下的不只是剪刀的划痕，还有一家人生活的刻度。她记得第一次给女儿做校服时，布料只够裁一件上衣，便把自己的旧裙子改成了书包。\n\n采访整理采用三次口述访谈的结构：先回顾学习裁缝的经历，再按家庭迁居的时间串起生活变化，最后结合照片核对重要年份。对无法核实的细节保留讲述者的原话，不把推测写成事实。';
  return [{
    ...emptyEnrollment('demo-enrollment-account-generation'),
    name: '沈言初（开户演示）', phone: '13800001006',
    idCard: 'DEMO-ID-NOT-REAL', identityVerifiedAt: '2026-09-21T14:50:00+08:00',
    cities: [{ province: '浙江省', city: '杭州市' }, { province: '浙江省', city: '嘉兴市' }],
    intro: '虚构演示申请人，非真实个人。专注长者口述史与家庭记忆整理，提供访谈提纲、录音整理、章节写作及家属校对服务。证件为无效演示占位，手机号仅用于账号展示。',
    experience: '7', specialties: ['人物传记', '家族故事', '口述历史'],
    workTitle: '外婆的裁缝桌（虚构演示作品）',
    workDescription: '以一位裁缝的家庭生活为线索，记录求学、工作与三代人的相处。申请人独立完成访谈提纲、三轮口述整理与章节写作，家属参与时间线核对。附虚构作品节选，所有人物和经历均为演示资料。',
    files: [{ name: '外婆的裁缝桌-虚构演示节选.txt', type: 'text/plain', data: `data:text/plain;charset=utf-8,${encodeURIComponent(workExcerpt)}` }],
    consent: true, status: 'approved', submittedAt, updatedAt: '2026-09-21T16:00:00+08:00',
    depositPaidAt: '2026-09-21T16:00:00+08:00', demoAccountVersion: 1,
    history: [
      { at: '2026-09-21T14:50:00+08:00', text: '完成模拟实名认证（虚构资料，无真实身份证）' },
      { at: submittedAt, text: '提交入驻申请（开户演示）' },
      { at: '2026-09-21T15:30:00+08:00', text: '平台审核通过，等待缴纳押金' },
      { at: '2026-09-21T16:00:00+08:00', text: '已模拟缴纳入驻押金 ¥1,000，等待生成账号' },
    ],
  }, ...existing];
}

let sessionEnrollments: Enrollment[] | undefined;

export function readEnrollments(): Enrollment[] {
  if (sessionEnrollments) return sessionEnrollments;
  try {
    const stored = JSON.parse(localStorage.getItem(ENROLLMENT_KEY) || '[]');
    const value = Array.isArray(stored) ? stored.map((item) => item?.status === 'supplement' ? { ...item, status: 'rejected' } : item) : [];
    const saved: Enrollment[] = Array.isArray(value) ? value.filter((x: Enrollment) => x && typeof x.owner === 'string' && Array.isArray(x.history) && Array.isArray(x.files) && x.status in statusLabels).map((x: Enrollment & { city?: string }) => ({
      ...emptyEnrollment(x.owner), ...x,
      // 兼容上一版单城市草稿，不清除用户已填写的资料。
      cities: Array.isArray(x.cities) ? x.cities : x.city ? [{ province: '', city: x.city }] : [],
    })) : [];
    const demos = demoEnrollments();
    return [...saved, ...demos.filter((demo) => !saved.some((item) => item.owner === demo.owner))];
  } catch { return demoEnrollments(); }
}
export function saveEnrollment(record: Enrollment): Enrollment {
  const saved = { ...record, updatedAt: new Date().toISOString() };
  const all = readEnrollments().filter(x => x.owner !== record.owner);
  const next = [...all, saved];
  try {
    localStorage.setItem(ENROLLMENT_KEY, JSON.stringify(next));
    sessionEnrollments = undefined;
  } catch {
    // 存储不可用时保留当前会话的演示操作，不阻断审核。
    sessionEnrollments = next;
  }
  window.dispatchEvent(new Event(ENROLLMENT_EVENT));
  return saved;
}
export function transitionEnrollment(record: Enrollment, status: EnrollmentStatus, text: string): Enrollment {
  const at = new Date().toISOString();
  return saveEnrollment({ ...record, status, reason: status === 'rejected' ? text : '', submittedAt: status === 'pending' ? at : record.submittedAt, activatedAt: status === 'active' ? at : record.activatedAt, history: [...record.history, { at, text }] });
}
export function enrollmentAccountForm(record: Enrollment): BiographerFormData {
  const years = record.experience.trim().match(/^(\d+(?:\.\d+)?)$/)?.[1]
    ?? record.experience.match(/(\d+(?:\.\d+)?)\s*年/)?.[1];
  return record.accountProfile ?? {
    name: record.name, phone: record.phone, email: '', avatar: record.avatar || undefined,
    intro: record.intro, specialties: [...record.specialties], experience: Number(years ?? 0),
    status: 'active', certificationLevel: 'standard',
  };
}
export function generateEnrollmentAccount(owner: string, profile: BiographerFormData): Enrollment | undefined {
  const record = readEnrollments().find(item => item.owner === owner);
  if (!record || record.status !== 'approved' || !record.depositPaidAt) return;
  return transitionEnrollment({ ...record, accountProfile: profile, accountGeneratedAt: new Date().toISOString() }, 'active', `演示账号生成成功：${profile.phone}（仅本地演示）`);
}
export function validWorkUrl(value: string): boolean {
  if (!value.trim()) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}
