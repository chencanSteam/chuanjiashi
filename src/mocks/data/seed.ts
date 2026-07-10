import type { Question, User, ProductPackage, GroupBuyActivity, Biographer } from '../types'

export const demoUser: User = {
  id: 'u_demo_001',
  phone: '13800138000',
  nickname: '体验用户',
  inviteCode: 'DEMO2024',
  agreementAccepted: true,
  privacyAccepted: true,
  createdAt: new Date().toISOString(),
}

export const defaultQuestions: Question[] = [
  { id: 'q_001', category: '童年成长', title: '出生与童年', question: '请简单描述您的出生地、家庭环境和童年里最难忘的一件事。', order: 1 },
  { id: 'q_002', category: '童年成长', title: '求学经历', question: '您小时候在哪里读书？有没有特别难忘的老师或同学？', order: 2 },
  { id: 'q_003', category: '家庭生活', title: '婚姻与伴侣', question: '您和伴侣是怎么相识的？结婚那天有什么印象深刻的事？', order: 3 },
  { id: 'q_004', category: '家庭生活', title: '子女教育', question: '在子女成长过程中，您最坚持的教育理念是什么？', order: 4 },
  { id: 'q_005', category: '事业经历', title: '职业生涯', question: '您从事过什么工作？哪一段经历对您影响最大？', order: 5 },
  { id: 'q_006', category: '事业经历', title: '重要成就', question: '工作或生活中，您最引以为傲的成就是什么？', order: 6 },
  { id: 'q_007', category: '人生回忆', title: '艰难时刻', question: '人生中遇到过什么困难？您是怎么走出来的？', order: 7 },
  { id: 'q_008', category: '人生回忆', title: '幸福瞬间', question: '回忆一下您人生中最幸福的时刻，当时发生了什么？', order: 8 },
  { id: 'q_009', category: '家风传承', title: '家训家规', question: '您的家庭有什么一直延续的家训或规矩吗？', order: 9 },
  { id: 'q_010', category: '家风传承', title: '给后代的话', question: '如果只能对子孙后代说一句话，您最想说什么？', order: 10 },
]

export const biographyStyles = [
  { value: 'plain', label: '朴实纪实' },
  { value: 'warm', label: '温情怀念' },
  { value: 'family', label: '家族传承' },
]

export const wordCountOptions = [
  { value: 'short', label: '简版', words: 3000 },
  { value: 'standard', label: '标准版', words: 8000 },
  { value: 'long', label: '长篇版', words: 15000 },
]

export const archiveTypeOptions = [
  { value: 'self', label: '本人' },
  { value: 'parent', label: '父母' },
  { value: 'grandparent', label: '祖辈' },
  { value: 'relative', label: '亲友' },
  { value: 'other', label: '其他' },
]

export const materialCategories = [
  '童年',
  '家庭',
  '事业',
  '荣誉',
  '其他',
]

export const defaultProducts: ProductPackage[] = [
  {
    id: 'prod_biography_99',
    type: 'biography',
    name: 'AI 传记标准版',
    price: 99,
    originalPrice: 199,
    description: 'AI 智能采访 + 8 章传记生成 + PDF 导出',
    rights: ['AI 智能采访', '8 章传记生成', '在线编辑', 'PDF 导出', '30 天有效期'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_digital_person',
    type: 'digital_person',
    name: '数字人陪伴版',
    price: 299,
    originalPrice: 599,
    description: '基于传记数据构建专属数字人，支持文字对话',
    rights: ['知识库构建', '文字对话', '历史记录', '家庭共享'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_video',
    type: 'video',
    name: '60 秒纪念短视频',
    price: 199,
    originalPrice: 399,
    description: '基于传记内容生成 60 秒纪念短视频',
    rights: ['脚本提取', 'AI 配音', '字幕生成', '背景音乐'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_qrcode',
    type: 'qrcode',
    name: '码记二维码',
    price: 49,
    originalPrice: 99,
    description: '为数字馆生成专属二维码，支持高清下载',
    rights: ['二维码生成', '高清下载', '访问统计', '长期有效'],
    createdAt: new Date().toISOString(),
  },
]

export const defaultGroupBuyActivity: GroupBuyActivity = {
  id: 'gb_activity_001',
  name: '99 元 AI 传记拼团',
  price: 99,
  firstRoundSize: 6,
  firstRoundFreeCount: 3,
  laterRoundSize: 5,
  laterRoundFreeCount: 2,
  durationHours: 24,
  startAt: new Date().toISOString(),
  endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
}

export const defaultBiographers: Biographer[] = [
  {
    id: 'bio_001',
    userId: 'u_bio_001',
    phone: '13900139001',
    name: '李传记',
    city: '杭州',
    title: '高级传记顾问',
    intro: '资深传记撰写人，专注家族记忆整理与家风传承。10 年间为超过 200 个家庭记录珍贵记忆，擅长引导长辈回忆细节，将零散故事整理成有温度的家族传记。',
    specialties: ['家族传记', '企业家传记', '口述历史'],
    experience: 10,
    serviceAreas: ['杭州', '上海', '南京', '苏州'],
    education: '浙江大学中文系硕士',
    certificates: [],
    tags: ['金牌传记师', '家族史专家', '上门采访', '实体书制作'],
    services: [
      { id: 'svc_001', name: '基础采访套餐', price: 1999, description: '2 次深度采访 + 5000 字传记' },
      { id: 'svc_002', name: '深度定制套餐', price: 5999, description: '5 次采访 + 3 万字传记 + 实体书排版' },
    ],
    cases: [
      { id: 'case_001', title: '张氏家族百年记忆', summary: '记录三代人创业与家风传承', cover: '' },
      { id: 'case_002', title: '王老先生抗战回忆录', summary: '整理 92 岁老人亲历的历史记忆', cover: '' },
    ],
    status: 'approved',
    deposit: 1000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bio_002',
    userId: 'u_bio_002',
    phone: '13900139002',
    name: '王雅琴',
    city: '上海',
    title: '家族记忆整理师',
    intro: '原出版社编辑，退休后投身家族传记事业。擅长从老照片、家书、日记中挖掘故事线索，用温情的笔触还原一个家庭的记忆拼图。',
    specialties: ['个人回忆录', '家风传承', '家书整理'],
    experience: 8,
    serviceAreas: ['上海', '杭州', '苏州'],
    education: '复旦大学新闻系本科',
    certificates: [],
    tags: ['资深编辑', '女性视角', '温情细腻', '老照片修复'],
    services: [
      { id: 'svc_003', name: '回忆录短篇版', price: 1299, description: '1 次采访 + 3000 字精编传记' },
      { id: 'svc_004', name: '家族记忆全书', price: 3999, description: '3 次采访 + 2 万字传记 + 家族相册整理' },
    ],
    cases: [
      { id: 'case_003', title: '林家四代女性故事', summary: '以女性视角记录家族四代人的生活变迁', cover: '' },
      { id: 'case_004', title: '抗战家书背后的故事', summary: '从一封家书中还原一段尘封历史', cover: '' },
    ],
    status: 'approved',
    deposit: 800,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bio_003',
    userId: 'u_bio_003',
    phone: '13900139003',
    name: '陈墨涵',
    city: '北京',
    title: '企业家传记专家',
    intro: ' former 财经记者，专注企业家与创业者传记。善于通过深度访谈捕捉创业关键时刻，将商业故事与人文精神相结合。',
    specialties: ['企业家传记', '创业故事', '口述历史'],
    experience: 12,
    serviceAreas: ['北京', '深圳', '广州'],
    education: '北京大学光华管理学院 MBA',
    certificates: [],
    tags: ['财经背景', '创业访谈', '商业传记', '高端定制'],
    services: [
      { id: 'svc_005', name: '企业家专访套餐', price: 8999, description: '3 次深度专访 + 5 万字传记 + 商业案例提炼' },
      { id: 'svc_006', name: '创业历程精简版', price: 4999, description: '2 次专访 + 2 万字创业故事' },
    ],
    cases: [
      { id: 'case_005', title: '某科技公司创始人传记', summary: '记录从 0 到 1 的创业历程与管理智慧', cover: '' },
      { id: 'case_006', title: '传统制造业转型故事', summary: '见证一家老厂三代人的坚守与创新', cover: '' },
    ],
    status: 'approved',
    deposit: 2000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bio_004',
    userId: 'u_bio_004',
    phone: '13900139004',
    name: '林清风',
    city: '成都',
    title: '口述历史记录者',
    intro: '纪录片导演出身，擅长用影像+文字的方式记录长辈故事。作品风格真实自然，尤其擅长捕捉老人生活中最动人的细节。',
    specialties: ['口述历史', '个人回忆录', '家风传承'],
    experience: 6,
    serviceAreas: ['成都', '重庆', '西安'],
    education: '四川师范大学影视传媒学院',
    certificates: [],
    tags: ['影像记录', '纪录片风格', '方言采访', '乡村记忆'],
    services: [
      { id: 'svc_007', name: '影像传记套餐', price: 2999, description: '2 次视频采访 + 5000 字文字传记 + 3 分钟短片' },
      { id: 'svc_008', name: '纯文字回忆录', price: 1599, description: '2 次采访 + 8000 字传记' },
    ],
    cases: [
      { id: 'case_007', title: '川西老手艺人的故事', summary: '记录一位竹编艺人 60 年的手艺人生', cover: '' },
      { id: 'case_008', title: '成都老茶馆记忆', summary: '以茶馆为线索记录城市变迁', cover: '' },
    ],
    status: 'approved',
    deposit: 600,
    createdAt: new Date().toISOString(),
  },
]
