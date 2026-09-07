import type {
  Question,
  User,
  ProductPackage,
  GroupBuyActivity,
  GroupBuyRules,
  CommissionRules,
  Biographer,
  BiographerReview,
  AdminUser,
  AdminArchive,
  AITask,
  PromptTemplate,
  ComplianceRecord,
  AgreementConfig,
  ComplianceAlert,
  BookComment,
  MuseumMessage,
  MediaReviewItem,
  ContentReport,
  Biography,
  TimelineEvent,
  Material,
  Museum,
  PartnerChannel,
  PartnerAssessment,
  PartnerLocalOrder,
  GmvLineStat,
  BiographerSettlement,
  QrCodeRecord,
  BiographerDepositRecord,
  BiographerPenaltyRecord,
  PartnerFeeRecord,
  PartnerShareConfig,
  PartnerRewardConfig,
  PartnerAssessmentRecord,
  RefundReasonOption,
  DictionaryItem,
  SensitiveWord,
  SensitiveHit,
} from '../types'

export const demoUser: User = {
  id: 'u_demo_001',
  phone: '13800138000',
  nickname: '体验用户',
  inviteCode: 'DEMO2024',
  community: '余杭区',
  neighborhood: '未来科技城社区',
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

export const defaultRefundReasonOptions: RefundReasonOption[] = [
  { id: 'refund_reason_mismatch', label: '商品或服务与描述不符', enabled: true, order: 1, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'refund_reason_delivery', label: '交付周期不符合预期', enabled: true, order: 2, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'refund_reason_duplicate', label: '重复购买', enabled: true, order: 3, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'refund_reason_price', label: '价格或权益问题', enabled: true, order: 4, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'refund_reason_unneeded', label: '暂时不需要了', enabled: true, order: 5, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'refund_reason_other', label: '其他', enabled: true, order: 6, isOther: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
]

const DICT_SEED_TIME = '2026-01-01T00:00:00.000Z'

function dictSeed(type: DictionaryItem['type'], labels: string[]): DictionaryItem[] {
  return labels.map((label, index) => ({
    id: `dict_${type}_${index + 1}`,
    type,
    label,
    enabled: true,
    order: index + 1,
    createdAt: DICT_SEED_TIME,
    updatedAt: DICT_SEED_TIME,
  }))
}

/** 数据字典默认值：上架传记的职业标签 / 人生阶段标签 / 敏感词库（一级=直接拦截，二级=仅自己可见） */
export const defaultDictionaryItems: DictionaryItem[] = [
  ...dictSeed('book_occupation', [
    '企业家', '教师', '医生', '军人', '农民', '工人', '工程师', '艺术家',
    '科学家', '公务员', '律师', '会计', '厨师', '手艺人', '自由职业', '其他',
  ]),
  ...dictSeed('book_life_stage', [
    '童年成长', '求学岁月', '军旅生涯', '事业奋斗', '创业之路',
    '婚姻家庭', '为人父母', '退休生活', '人生感悟', '家风传承',
  ]),
  ...([
    ['赌博', 1], ['色情', 1], ['毒品', 1], ['枪支', 1],
    ['诈骗', 2], ['暴力', 2], ['传销', 2], ['洗钱', 2],
  ] as Array<[string, 1 | 2]>).map(([label, level], index) => ({
    id: `dict_sensitive_words_${index + 1}`,
    type: 'sensitive_words' as const,
    label,
    level,
    enabled: true,
    order: index + 1,
    createdAt: DICT_SEED_TIME,
    updatedAt: DICT_SEED_TIME,
  })),
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
    sales: 1280,
    hot: true,
    headline: '把人生故事，写成家人愿意反复阅读的传记',
    subheadline: '像聊天一样讲述，AI 帮您整理成一本文字作品',
    detailBlocks: [
      { id: 'bio99-1', title: '会聊天的 AI 采访师', content: '不用会写，只要会说。AI 按人生阶段引导提问，支持语音回答，让每段记忆都有机会被记录。' },
      { id: 'bio99-2', title: '清晰完整的传记结构', content: '从童年、求学到工作与人生感悟，自动梳理章节脉络，生成适合家人阅读的传记初稿。' },
      { id: 'bio99-3', title: '可继续编辑与保存', content: '生成后可以逐章修改、插入照片、调整表达，完成后保存为自己的传记作品。' },
    ],
    promises: ['AI 采访引导', '生成后可继续编辑', '支持 PDF 导出'],
    faqs: [
      { id: 'bio99-faq1', question: '不会写文章也能使用吗？', answer: '可以，只需要像聊天一样回答问题，系统会帮助您整理成文字。' },
      { id: 'bio99-faq2', question: '可以为家人创建传记吗？', answer: '可以，您可以为父母、长辈或其他家人建立独立的人生档案。' },
    ],
    tags: ['AI采访', '人生记录', '传记生成'],
    sortOrder: 1,
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
  {
    id: 'prod_book_paperback',
    type: 'book',
    name: '实体书·简装版',
    price: 88,
    originalPrice: 158,
    description: 'A5 胶装，道林纸印刷，含封面设计，适合家庭传阅',
    rights: ['PDF 智能排版', '专属封面设计', 'A5 胶装印刷', '全国快递包邮'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_book_hardcover',
    type: 'book',
    name: '实体书·精装版',
    price: 288,
    originalPrice: 468,
    description: '硬壳精装，锁线装订，适合收藏馈赠长辈',
    rights: ['PDF 智能排版', '精装封面设计', '锁线装订工艺', '烫金书脊', '礼盒包装'],
    sales: 356,
    hot: true,
    headline: '把一段人生，装订成值得珍藏的家族记忆',
    subheadline: '精装封面与锁线装订，让故事留得久、翻得多',
    detailBlocks: [
      { id: 'hardcover-1', title: '专属封面设计', content: '根据传主姓名和家庭故事设计专属封面，内页图文混排，呈现正式出版物般的阅读质感。' },
      { id: 'hardcover-2', title: '精装锁线装订', content: '采用耐翻阅的精装与锁线工艺，书页平整不易散页，适合收藏与赠送长辈。' },
      { id: 'hardcover-3', title: '印刷前确认', content: '排版完成后先提供电子预览，确认内容和版式后再安排印刷，成品快递到家。' },
    ],
    promises: ['专属封面设计', '印刷前电子预览', '全国快递包邮'],
    faqs: [
      { id: 'hardcover-faq1', question: '需要准备什么材料？', answer: '完成传记后即可下单，也可以提供照片用于内页排版。' },
      { id: 'hardcover-faq2', question: '多久可以收到？', answer: '确认排版后通常 7–10 天完成制作并寄出。' },
    ],
    tags: ['精装收藏', '家族礼赠', '实体交付'],
    sortOrder: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_book_collectible',
    type: 'book',
    name: '实体书·收藏礼盒版',
    price: 398,
    originalPrice: 688,
    description: '布面精装 + 家风礼盒 + 收藏证书，高端家族礼赠',
    rights: ['布面精装实体书', '家风传承礼盒', '专属收藏证书', '老照片修复 5 张', '顺丰包邮'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_memorial_album',
    type: 'derivative',
    name: '家族纪念相册',
    price: 128,
    originalPrice: 228,
    description: '精选老照片与人生故事，定制 24P 精装纪念相册',
    rights: ['24P 精装相册', '老照片自动排版', '故事配文', '覆膜防水'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_family_box',
    type: 'derivative',
    name: '家风传承礼盒',
    price: 398,
    originalPrice: 698,
    description: '实体书 + 家谱折页 + 家训卷轴 + 纪念 U 盘，一盒传承',
    rights: ['精装实体书', '家谱世系折页', '家训书法卷轴', '纪念视频 U 盘', '礼盒手提袋'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_qrcode_permanent',
    type: 'qrcode',
    name: '永久纪念二维码',
    price: 99,
    originalPrice: 199,
    description: '为数字馆/家风馆生成专属永久二维码，支持高清下载与访问统计',
    rights: ['专属永久二维码', '4K 高清下载', '访问统计分析', '长期云端保存', '铭牌授权'],
    sales: 89,
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
    certificates: ['浙江省作家协会会员证', '高级传记师职业资格证书', '省家族文化研究会理事聘书'],
    tags: ['金牌传记师', '家族史专家', '上门采访', '实体书制作'],
    services: [
      { id: 'svc_001', name: '基础采访套餐', price: 1999, description: '2 次深度采访 + 5000 字传记', interviewCount: '2 次', wordCount: '5000 字', deliveryPeriod: '30 天', physicalBook: '不含', mediaMaterial: '不含', revisionCount: '2 次' },
      { id: 'svc_002', name: '深度定制套餐', price: 5999, description: '5 次采访 + 3 万字传记 + 实体书排版', interviewCount: '5 次', wordCount: '3 万字', deliveryPeriod: '60 天', physicalBook: '含', mediaMaterial: '含', revisionCount: '不限次' },
    ],
    cases: [
      { id: 'case_001', title: '张氏家族百年记忆', summary: '记录三代人创业与家风传承', cover: '' },
      { id: 'case_002', title: '王老先生抗战回忆录', summary: '整理 92 岁老人亲历的历史记忆', cover: '' },
    ],
    status: 'approved',
    certificationLevel: 'gold',
    rating: 4.9,
    reviewCount: 128,
    completedOrders: 236,
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
    certificates: ['出版专业技术人员职业资格证（中级编辑）', '上海市作家协会会员证'],
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
    certificationLevel: 'gold',
    rating: 4.8,
    reviewCount: 96,
    completedOrders: 158,
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
    certificates: ['新闻采编人员从业资格证', '中国传记文学学会会员证'],
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
    certificationLevel: 'silver',
    rating: 4.7,
    reviewCount: 64,
    completedOrders: 87,
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
    certificates: ['四川省电影电视艺术家协会会员证', '口述历史采集专项培训结业证书'],
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
    certificationLevel: 'silver',
    rating: 4.6,
    reviewCount: 52,
    completedOrders: 63,
    deposit: 600,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bio_review_pending_01', userId: 'u_mock_bio_review_01', phone: '13900139101', name: '周静宜', email: 'zhoujingyi.review@example.com', city: '杭州', title: '口述史整理师',
    intro: '', specialties: ['口述史', '家族记忆', '老照片整理'], experience: 5, serviceAreas: ['杭州', '绍兴', '湖州'], education: '浙江传媒学院新闻学本科', certificates: ['口述历史采集培训证书'], tags: ['首次提交'],
    services: [{ id: 'svc_review_01', name: '口述史整理入门版', price: 1599, description: '1 次深度采访 + 5000 字口述史整理' }], cases: [{ id: 'case_review_01', title: '外婆的西湖边记忆', summary: '整理三代女性关于杭州生活的家庭记忆', cover: '' }],
    status: 'approved', certificationLevel: 'standard', rating: 5, reviewCount: 0, completedOrders: 0, deposit: 500, profileReviewStatus: 'pending', profileSubmittedAt: '2026-08-30T10:20:00.000Z', profileRevision: 1,
    profileDraft: { name: '周静宜', phone: '13900139101', email: 'zhoujingyi.review@example.com', city: '杭州', title: '口述史整理师', intro: '曾长期参与社区口述史项目，擅长用轻松访谈帮助长辈打开记忆，把照片、家书和生活片段整理成清晰的人生故事。', specialties: ['口述史', '家族记忆', '老照片整理'], experience: 5, serviceAreas: ['杭州', '绍兴', '湖州'], education: '浙江传媒学院新闻学本科', certificates: ['口述历史采集培训证书'], tags: ['社区口述史', '长辈友好'], services: [{ id: 'svc_review_01', name: '口述史整理入门版', price: 1599, description: '1 次深度采访 + 5000 字口述史整理' }], cases: [{ id: 'case_review_01', title: '外婆的西湖边记忆', summary: '整理三代女性关于杭州生活的家庭记忆', cover: '' }] }, createdAt: '2026-08-20T09:00:00.000Z'
  },
  {
    id: 'bio_review_pending_02', userId: 'u_mock_bio_review_02', phone: '13900139102', name: '沈明诚', email: 'shenmingcheng.review@example.com', city: '南京', title: '家族传记撰稿人', intro: '专注家族传记采访与基础成稿服务。', specialties: ['家族传记', '人物采访'], experience: 7, serviceAreas: ['南京', '苏州'], education: '南京大学中文系本科', certificates: ['高级传记写作研修证书'], tags: ['新版待审'], services: [{ id: 'svc_review_02', name: '家族传记标准版', price: 2999, description: '2 次采访 + 10000 字家族传记' }], cases: [{ id: 'case_review_02', title: '秦淮老街三代人', summary: '记录一家三代人的城市记忆', cover: '' }], status: 'approved', certificationLevel: 'silver', rating: 4.7, reviewCount: 18, completedOrders: 32, deposit: 800, profileReviewStatus: 'pending', profileSubmittedAt: '2026-08-31T14:35:00.000Z', profileRevision: 3,
    publishedProfile: { name: '沈明诚', phone: '13900139102', email: 'shenmingcheng.review@example.com', city: '南京', title: '家族传记撰稿人', intro: '专注家族传记采访与基础成稿服务。', specialties: ['家族传记', '人物采访'], experience: 7, serviceAreas: ['南京', '苏州'], education: '南京大学中文系本科', certificates: ['高级传记写作研修证书'], tags: ['家族传记'], services: [{ id: 'svc_review_02', name: '家族传记标准版', price: 2999, description: '2 次采访 + 10000 字家族传记' }], cases: [{ id: 'case_review_02', title: '秦淮老街三代人', summary: '记录一家三代人的城市记忆', cover: '' }] },
    profileDraft: { name: '沈明诚', phone: '13900139102', email: 'shenmingcheng.review@example.com', city: '南京', title: '资深家族史传记师', intro: '深耕江南家族史与城市迁徙记忆，擅长把族谱、老照片、口述采访整合为适合家庭收藏的长篇传记。', specialties: ['家族传记', '族谱整理', '城市迁徙史'], experience: 8, serviceAreas: ['南京', '苏州', '无锡'], education: '南京大学中文系本科', certificates: ['高级传记写作研修证书'], tags: ['江南家族史'], services: [{ id: 'svc_review_02_new', name: '家族史深度定制版', price: 4999, description: '3 次采访 + 20000 字传记' }], cases: [{ id: 'case_review_02_new', title: '从老宅到新城的家族迁徙', summary: '串联四代人的城市生活变迁', cover: '' }] }, createdAt: '2026-06-10T09:00:00.000Z'
  },
  {
    id: 'bio_review_rejected_01', userId: 'u_mock_bio_review_03', phone: '13900139103', name: '顾南枝', email: 'gunanzhi.review@example.com', city: '成都', title: '纪实写作传记师', intro: '提供个人回忆录与家庭纪念册写作服务。', specialties: ['个人回忆录', '纪实写作'], experience: 4, serviceAreas: ['成都', '重庆'], education: '四川大学文学与新闻学院本科', certificates: ['纪实写作工作坊结业证书'], tags: ['驳回样例'], services: [{ id: 'svc_review_03', name: '个人回忆录基础版', price: 1999, description: '2 次采访 + 8000 字个人回忆录' }], cases: [{ id: 'case_review_03', title: '茶馆里的父亲', summary: '记录一位老茶客的城市生活记忆', cover: '' }], status: 'approved', certificationLevel: 'standard', rating: 4.6, reviewCount: 9, completedOrders: 14, deposit: 500, profileReviewStatus: 'rejected', profileRejectReason: '案例描述存在夸大宣传，请补充真实交付说明；资质图片不清晰，请重新上传。', profileSubmittedAt: '2026-08-25T16:00:00.000Z', profileReviewedAt: '2026-08-26T09:30:00.000Z', profileReviewedBy: 'u_13800138000', profileRevision: 2,
    profileDraft: { name: '顾南枝', phone: '13900139103', email: 'gunanzhi.review@example.com', city: '成都', title: '首席爆款传记导师', intro: '纪实传记作者，承诺快速打造家族故事。', specialties: ['个人回忆录', '纪实写作'], experience: 4, serviceAreas: ['成都', '重庆'], education: '四川大学文学与新闻学院本科', certificates: [''], tags: ['快速交付'], services: [{ id: 'svc_review_03_new', name: '家族故事套餐', price: 3999, description: '2 次采访 + 10000 字故事' }], cases: [{ id: 'case_review_03_new', title: '茶馆里的家族故事', summary: '记录城市生活记忆', cover: '' }] }, createdAt: '2026-07-01T09:00:00.000Z'
  },
]

export const defaultReviews: BiographerReview[] = [
  {
    id: 'rev_001',
    biographerId: 'bio_001',
    userId: 'u_demo_001',
    userName: '张先生',
    orderId: 'ord_001',
    rating: 5,
    content: '李老师非常专业，帮父亲整理了七十多年的人生经历，家人都非常感动。',
    tags: ['专业耐心', '沟通顺畅'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev_002',
    biographerId: 'bio_001',
    userId: 'u_demo_002',
    userName: '王女士',
    orderId: 'ord_002',
    rating: 5,
    content: '从采访到成书整个过程很顺畅，传记质量超出预期，已经推荐给朋友。',
    tags: ['质量高', '推荐'],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev_003',
    biographerId: 'bio_001',
    userId: 'u_demo_003',
    userName: '陈先生',
    orderId: 'ord_003',
    rating: 4,
    content: '为我们家族三代人做了系统梳理，把零散的故事串成了完整的家族记忆。',
    tags: ['家族记忆'],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev_004',
    biographerId: 'bio_002',
    userId: 'u_demo_004',
    userName: '刘女士',
    orderId: 'ord_004',
    rating: 5,
    content: '王老师特别温柔，妈妈一开始很紧张，后来聊得特别开心。',
    tags: ['温情细腻', '老人友好'],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev_005',
    biographerId: 'bio_002',
    userId: 'u_demo_005',
    userName: '赵先生',
    orderId: 'ord_005',
    rating: 5,
    content: '老照片修复和传记结合在一起，效果出乎意料地好。',
    tags: ['老照片修复', '超预期'],
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev_006',
    biographerId: 'bio_002',
    userId: 'u_demo_006',
    userName: '孙女士',
    orderId: 'ord_006',
    rating: 4,
    content: '整体不错，就是交付时间比预期晚了两天，希望以后能更准时。',
    tags: ['交付稍慢'],
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev_007',
    biographerId: 'bio_003',
    userId: 'u_demo_007',
    userName: '周先生',
    orderId: 'ord_007',
    rating: 5,
    content: '陈老师的商业洞察力很强，把创业故事写得很有深度，投资人看了都很认可。',
    tags: ['商业传记', '专业'],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev_008',
    biographerId: 'bio_003',
    userId: 'u_demo_008',
    userName: '吴女士',
    orderId: 'ord_008',
    rating: 4,
    content: '内容很好，但价格偏高，适合对质量要求高的家庭。',
    tags: ['质量好', '价格高'],
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev_009',
    biographerId: 'bio_004',
    userId: 'u_demo_009',
    userName: '郑先生',
    orderId: 'ord_009',
    rating: 5,
    content: '林老师用视频记录的方式特别好，爷爷奶奶都能看到动态的回忆。',
    tags: ['影像记录', '创新'],
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rev_010',
    biographerId: 'bio_004',
    userId: 'u_demo_010',
    userName: '何女士',
    orderId: 'ord_010',
    rating: 4,
    content: '方言采访很贴心，老人讲起来很自然，就是后期剪辑可以再多一点。',
    tags: ['方言采访', '自然'],
    createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// ========== 后台管理种子数据 ==========

const DAY = 24 * 60 * 60 * 1000
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString()

export const defaultAdminUsers: AdminUser[] = [
  { id: 'u_demo_001', nickname: '用户8000', phone: '13800138000', registeredAt: daysAgo(180), status: 'active', realNameStatus: 'verified', archiveCount: 3, orderCount: 5, inviterName: '张先生', regionCode: '330106', regionName: '杭州市西湖区' },
  { id: 'u_demo_002', nickname: '用户0001', phone: '13800000001', registeredAt: daysAgo(150), status: 'active', realNameStatus: 'verified', archiveCount: 2, orderCount: 3, inviterName: '体验用户', regionCode: '330106', regionName: '杭州市西湖区' },
  { id: 'u_demo_003', nickname: '用户0002', phone: '13900000002', registeredAt: daysAgo(120), status: 'active', realNameStatus: 'pending', archiveCount: 1, orderCount: 2, regionCode: '330100', regionName: '杭州市' },
  { id: 'u_demo_004', nickname: '用户0003', phone: '13700000003', registeredAt: daysAgo(96), status: 'active', realNameStatus: 'none', archiveCount: 1, orderCount: 0, inviterName: '张先生', regionCode: '330200', regionName: '宁波市' },
  { id: 'u_demo_005', nickname: '用户0004', phone: '13600000004', registeredAt: daysAgo(75), status: 'active', realNameStatus: 'verified', archiveCount: 4, orderCount: 6, inviterName: '李女士' },
  { id: 'u_demo_006', nickname: '用户0005', phone: '13500000005', registeredAt: daysAgo(50), status: 'disabled', realNameStatus: 'rejected', archiveCount: 0, orderCount: 1 },
  { id: 'u_demo_007', nickname: '用户0006', phone: '13400000006', registeredAt: daysAgo(32), status: 'active', realNameStatus: 'pending', archiveCount: 2, orderCount: 1, inviterName: '陈女士' },
  { id: 'u_demo_008', nickname: '用户0007', phone: '13300000007', registeredAt: daysAgo(12), status: 'active', realNameStatus: 'none', archiveCount: 1, orderCount: 0, inviterName: '陈女士' },
]

export const defaultAdminArchives: AdminArchive[] = [
  { id: 'arch_001', ownerName: '张明远', archiveType: 'self', creatorNickname: '用户8000', materialCounts: { image: 46, audio: 8, document: 5 }, privacyStatus: 'public', completion: 92, createdAt: daysAgo(160) },
  { id: 'arch_002', ownerName: '王桂芬', archiveType: 'parent', creatorNickname: '用户0001', materialCounts: { image: 32, audio: 5, document: 3 }, privacyStatus: 'public', completion: 85, createdAt: daysAgo(140) },
  { id: 'arch_003', ownerName: '李华亭', archiveType: 'grandparent', creatorNickname: '用户0002', materialCounts: { image: 58, audio: 12, document: 9 }, privacyStatus: 'shared', completion: 78, createdAt: daysAgo(110) },
  { id: 'arch_004', ownerName: '周秀英', archiveType: 'parent', creatorNickname: '用户0004', materialCounts: { image: 21, audio: 3, document: 2 }, privacyStatus: 'shared', completion: 66, createdAt: daysAgo(70) },
  { id: 'arch_005', ownerName: '陈建国', archiveType: 'self', creatorNickname: '用户0004', materialCounts: { image: 15, audio: 2, document: 1 }, privacyStatus: 'private', completion: 45, createdAt: daysAgo(60) },
  { id: 'arch_006', ownerName: '赵德柱', archiveType: 'grandparent', creatorNickname: '用户0006', materialCounts: { image: 9, audio: 1, document: 0 }, privacyStatus: 'private', completion: 30, createdAt: daysAgo(28) },
  { id: 'arch_007', ownerName: '孙玉梅', archiveType: 'relative', creatorNickname: '用户0007', materialCounts: { image: 6, audio: 0, document: 1 }, privacyStatus: 'private', completion: 18, createdAt: daysAgo(10) },
  { id: 'arch_008', ownerName: '王守义', archiveType: 'other', creatorNickname: '用户0003', materialCounts: { image: 12, audio: 4, document: 2 }, privacyStatus: 'shared', completion: 52, createdAt: daysAgo(90) },
]

export const defaultAITasks: AITask[] = [
  { id: 'task_001', type: 'biography', targetName: '张明远：一位苏州企业家的六十年', userName: '用户8000', userPhone: '13800138000', status: 'success', tokens: 48200, model: 'Kimi K2', createdAt: daysAgo(20), finishedAt: daysAgo(20) },
  { id: 'task_002', type: 'biography', targetName: '山村教师王桂芬', userName: '用户0001', userPhone: '13800000001', status: 'success', tokens: 39500, model: 'DeepSeek-V3', createdAt: daysAgo(15), finishedAt: daysAgo(15) },
  { id: 'task_003', type: 'digital_person', targetName: '李华亭', userName: '用户0002', userPhone: '13900000002', status: 'success', tokens: 76800, model: '通义千问 Max', createdAt: daysAgo(12), finishedAt: daysAgo(12) },
  { id: 'task_004', type: 'short_video', targetName: '周秀英纪念短视频', userName: '用户0004', userPhone: '13600000004', status: 'failed', tokens: 12400, model: '豆包 Pro', createdAt: daysAgo(8), finishedAt: daysAgo(8), failReason: '配音服务超时，请重试' },
  { id: 'task_005', type: 'pdf', targetName: '我的母亲周秀英', userName: '用户0004', userPhone: '13600000004', status: 'success', tokens: 3200, model: 'Kimi K2', createdAt: daysAgo(7), finishedAt: daysAgo(7) },
  { id: 'task_006', type: 'biography', targetName: '陈建国自传', userName: '用户0004', userPhone: '13600000004', status: 'running', tokens: 18600, model: 'Kimi K2', createdAt: daysAgo(1) },
  { id: 'task_007', type: 'digital_person', targetName: '王桂芬', userName: '用户0001', userPhone: '13800000001', status: 'queued', tokens: 0, model: '通义千问 Max', createdAt: daysAgo(1) },
  { id: 'task_008', type: 'short_video', targetName: '张明远创业故事短片', userName: '用户8000', userPhone: '13800138000', status: 'queued', tokens: 0, model: '豆包 Pro', createdAt: daysAgo(0) },
  { id: 'task_009', type: 'pdf', targetName: '山村教师王桂芬', userName: '用户0001', userPhone: '13800000001', status: 'failed', tokens: 800, model: 'DeepSeek-V3', createdAt: daysAgo(3), finishedAt: daysAgo(3), failReason: '章节内容为空，排版失败' },
  { id: 'task_010', type: 'biography', targetName: '赵德柱回忆录', userName: '用户0006', userPhone: '13400000006', status: 'running', tokens: 9800, model: 'DeepSeek-V3', createdAt: daysAgo(0) },
]

export const defaultPromptTemplates: PromptTemplate[] = [
  { id: 'tpl_001', type: 'prompt', name: '传记生成·朴实纪实', summary: '以第三人称平实叙述，突出时间线与事实细节，避免夸张修辞。', updatedAt: daysAgo(30), enabled: true },
  { id: 'tpl_002', type: 'prompt', name: '传记生成·温情怀念', summary: '以家人视角书写，强调情感记忆与亲情细节，适合纪念逝者。', updatedAt: daysAgo(25), enabled: true },
  { id: 'tpl_003', type: 'questionnaire', name: '标准采访问卷（10 题）', summary: '覆盖童年、家庭、事业、人生回忆、家风传承五大类共 10 题。', updatedAt: daysAgo(40), enabled: true },
  { id: 'tpl_004', type: 'questionnaire', name: '企业家深度问卷', summary: '增加创业抉择、关键战役、管理感悟等 8 道追问题目。', updatedAt: daysAgo(18), enabled: true },
  { id: 'tpl_005', type: 'style', name: '家族传承文风', summary: '语言庄重典雅，章节末附家训小结，面向后代读者。', updatedAt: daysAgo(22), enabled: true },
  { id: 'tpl_006', type: 'interview_rule', name: '采访追问规则 v2', summary: '当回答少于 50 字时自动追问细节；涉及敏感话题时礼貌跳过。', updatedAt: daysAgo(10), enabled: true },
  { id: 'tpl_007', type: 'interview_rule', name: '老人友好采访规则', summary: '单次提问不超过 20 字，语速放慢，允许长时间沉默与重复讲述。', updatedAt: daysAgo(6), enabled: false },
]

export const defaultComplianceRecords: ComplianceRecord[] = [
  { id: 'comp_001', type: 'biography_public', targetName: '张明远：一位苏州企业家的六十年', authorizedBy: '体验用户', authorizedAt: daysAgo(90), status: 'valid' },
  { id: 'comp_002', type: 'biography_public', targetName: '山村教师王桂芬', authorizedBy: '张先生', authorizedAt: daysAgo(80), status: 'valid' },
  { id: 'comp_003', type: 'portrait', targetName: '李华亭', authorizedBy: '李女士', authorizedAt: daysAgo(60), status: 'valid' },
  { id: 'comp_004', type: 'voice', targetName: '李华亭', authorizedBy: '李女士', authorizedAt: daysAgo(60), status: 'valid' },
  { id: 'comp_005', type: 'portrait', targetName: '周秀英', authorizedBy: '陈女士', authorizedAt: daysAgo(45), status: 'expired' },
  { id: 'comp_006', type: 'biography_public', targetName: '医者仁心：李华亭回忆录', authorizedBy: '李女士', authorizedAt: daysAgo(38), status: 'revoked' },
]

export const defaultAgreementConfigs: AgreementConfig[] = [
  {
    id: 'agr_001',
    name: '用户服务协议',
    version: 'v3.2',
    content: [
      '一、协议的确认与接受。欢迎使用传家世 AI 数字人生与家风传承平台（以下简称"本平台"）。您在注册、登录或使用本平台服务前，应当认真阅读并充分理解本协议全部内容。您点击"同意"或实际使用本平台服务，即视为您已阅读并同意接受本协议的全部约定。',
      '二、服务内容。本平台为您提供 AI 智能采访、AI 传记生成、人生档案馆、家庭空间、数字家谱、数字博物馆、数字人格等数字人生记录与家风传承相关服务。平台有权根据业务发展调整服务内容，并通过页面公告等方式通知您。',
      '三、账号管理。您应使用本人真实有效的手机号注册账号，并妥善保管账号与验证码。因您主动泄露账号信息导致的损失，由您自行承担。如发现账号被盗用，请立即联系平台客服处理。',
      '四、用户行为规范。您承诺不上传、发布含有违法违规、侵犯他人合法权益（包括但不限于肖像权、名誉权、隐私权、著作权）的内容。您上传的传记、照片、音视频等素材，应确保已取得相关权利人的合法授权。',
      '五、付费服务。本平台部分服务为付费服务，具体价格以页面展示为准。虚拟内容服务一经交付，除法律法规另有规定外，不支持退款；实体产品（如精装书）适用七天无理由退货规则（定制类商品除外）。',
      '六、协议的变更与终止。平台可根据法律法规及业务需要修订本协议，修订后的协议将在平台公示。若您不同意变更后的协议，应停止使用本平台服务；继续使用则视为接受变更。',
    ].join('\n\n'),
    updatedAt: daysAgo(60),
  },
  {
    id: 'agr_002',
    name: '隐私政策',
    version: 'v2.8',
    content: [
      '一、我们收集的信息。为向您提供传记生成、数字人构建等服务，我们会收集您主动提供的姓名、手机号、采访回答、照片、音视频录音等信息，以及为完成实名认证所需的身份证信息。',
      '二、信息的使用。我们仅在以下场景使用您的信息：生成与排版您的传记内容、构建您授权创建的数字人形象与声音、完成订单交付与售后服务、依法履行内容安全审核义务。我们不会将您的传记内容用于训练公开模型或向无关第三方提供。',
      '三、信息的存储与保护。您的数据存储于境内服务器，我们采用加密传输、访问权限控制等措施保护您的信息安全。涉及逝者的数字馆内容，仅在您授权的访问范围内展示。',
      '四、您的权利。您可以随时查询、更正、删除您的个人信息与传记内容；可以申请注销账号，注销后我们将依法删除或匿名化处理您的个人信息。涉及他人肖像、声音的内容删除，我们将同步停用相关数字人服务。',
      '五、未成年人保护。本平台服务主要面向成年人。如您为未成年人，请在监护人陪同与同意下使用本平台服务。',
      '六、联系我们。如对本政策有任何疑问、意见或投诉，可通过平台"我的-联系客服"或隐私保护专线与我们取得联系，我们将在 15 个工作日内回复。',
    ].join('\n\n'),
    updatedAt: daysAgo(45),
  },
  {
    id: 'agr_003',
    name: '传记公开发布授权协议',
    version: 'v1.5',
    content: [
      '一、授权内容。您同意将本人创作或委托本平台生成的传记作品（以下简称"作品"）在本平台"公开书架"栏目公开发表，供其他用户在线阅读或付费解锁阅读。',
      '二、授权性质。本授权为非独占性授权，您仍保留作品的著作权及在其他平台发表的权利。涉及付费阅读的收益，按照平台公示的分成比例结算给您。',
      '三、内容保证。您保证对作品拥有合法权利，作品内容不侵犯任何第三方的肖像权、名誉权、隐私权及著作权；作品中涉及的仍在世人物，您已取得其本人或监护人的同意。因作品内容引发的纠纷，由您承担相应责任。',
      '四、审核与下架。平台有权对申请公开的作品进行内容审核，审核不通过的不予公开；已公开作品如被投诉或发现违规，平台有权先行下架并通知您。',
      '五、授权的撤销。您可随时申请撤销公开授权，平台将在 3 个工作日内完成下架处理。撤销前已产生的付费阅读订单仍按原约定结算。',
    ].join('\n\n'),
    updatedAt: daysAgo(30),
  },
  {
    id: 'agr_004',
    name: '数字人肖像与声音授权协议',
    version: 'v1.2',
    content: [
      '一、授权范围。您授权本平台使用您（或经权利人授权的被记录人）的照片、影像、录音等素材，通过 AI 技术生成数字人形象与声音模型，用于本平台内的数字人对话、视频生成等服务。',
      '二、授权前提。若数字人以他人（含已故亲友）为原型，您声明已取得该本人、其监护人或近亲属的明确授权，并愿意就授权真实性承担法律责任。平台有权要求您补充提供授权证明材料。',
      '三、使用限制。数字人形象与声音仅在本平台服务范围内使用，未经您另行书面同意，平台不会将其用于广告代言、模型训练对外授权等其他用途。任何用户不得利用数字人服务生成冒充他人、误导公众的内容。',
      '四、授权期限与撤回。本授权自您确认之日起生效，至您主动删除数字人或注销账号时终止。您可随时申请删除数字人及其底层素材，平台将在 7 个工作日内完成删除并停止相关服务。',
      '五、风险提示。AI 生成的数字人内容可能与真人表达存在差异，平台已在页面显著位置标注"AI 生成"标识。请勿将数字人内容用于任何违法或违背公序良俗的用途。',
    ].join('\n\n'),
    updatedAt: daysAgo(20),
  },
]

/** 拼团规则默认配置（与默认活动保持一致） */
export const defaultGroupBuyRules: GroupBuyRules = {
  firstRoundSize: 6,
  laterRoundSize: 5,
  durationHours: 24,
  freeEnabled: true,
  firstRoundFreeCount: 3,
  laterRoundFreeCount: 2,
  maxLaunchPerDevice: 1,
  maxJoinPerPhone: 1,
}

/** 分润规则默认配置 */
export const defaultCommissionRules: CommissionRules = {
  directRate: 10,
  platformPoolRate: 15,
  bookshelfRate: 30,
  biographerRate: 85,
}

/** 内容审核-素材审核种子数据 */
export const defaultMediaReviewItems: MediaReviewItem[] = [
  { id: 'media_001', type: 'image', title: '1978 年全家福老照片', owner: '张先生', createdAt: '2026-07-18 10:24', status: 'pending' },
  { id: 'media_002', type: 'audio', title: '父亲口述录音·参军经历', owner: '李女士', createdAt: '2026-07-17 15:02', status: 'pending' },
  { id: 'media_003', type: 'image', title: '老宅门前合影', owner: '王先生', createdAt: '2026-07-16 09:40', status: 'pending' },
]

/** 内容审核-举报种子数据 */
export const defaultContentReports: ContentReport[] = [
  { id: 'report_001', reporter: '刘先生', target: '传记《医者仁心：李华亭回忆录》', reason: '部分内容侵犯家属隐私，未经授权公开', createdAt: '2026-07-19 09:18', status: 'pending' },
  { id: 'report_002', reporter: '赵女士', target: '书架评论', reason: '评论含人身攻击内容', createdAt: '2026-07-18 16:45', status: 'pending' },
  { id: 'report_003', reporter: '周先生', target: '公开传记《陈建国自传》', reason: '疑似抄袭其他出版物章节', createdAt: '2026-07-15 13:27', status: 'processed' },
]

/** 敏感词库种子数据（覆盖六个分类、三种处置方式） */
export const defaultSensitiveWords: SensitiveWord[] = [
  { id: 'sw_001', word: '颠覆国家政权', category: 'politics', action: 'block', enabled: true, hitCount: 12, createdAt: daysAgo(90), updatedAt: daysAgo(30) },
  { id: 'sw_002', word: '法轮功', category: 'politics', action: 'block', enabled: true, hitCount: 8, createdAt: daysAgo(90), updatedAt: daysAgo(30) },
  { id: 'sw_003', word: '台独', category: 'politics', action: 'review', enabled: true, hitCount: 3, createdAt: daysAgo(60), updatedAt: daysAgo(12) },
  { id: 'sw_004', word: '色情视频', category: 'porn', action: 'block', enabled: true, hitCount: 21, createdAt: daysAgo(90), updatedAt: daysAgo(20) },
  { id: 'sw_005', word: '裸聊', category: 'porn', action: 'block', enabled: true, hitCount: 6, createdAt: daysAgo(75), updatedAt: daysAgo(15) },
  { id: 'sw_006', word: '成人用品', category: 'porn', action: 'review', enabled: false, hitCount: 2, createdAt: daysAgo(50), updatedAt: daysAgo(8) },
  { id: 'sw_007', word: '砍人', category: 'violence', action: 'review', enabled: true, hitCount: 4, createdAt: daysAgo(60), updatedAt: daysAgo(10) },
  { id: 'sw_008', word: '自杀', category: 'violence', action: 'replace', replacement: '**', enabled: true, hitCount: 9, createdAt: daysAgo(60), updatedAt: daysAgo(5) },
  { id: 'sw_009', word: '枪支买卖', category: 'violence', action: 'block', enabled: true, hitCount: 1, createdAt: daysAgo(45), updatedAt: daysAgo(45) },
  { id: 'sw_010', word: '代办信用卡', category: 'ads', action: 'block', enabled: true, hitCount: 15, createdAt: daysAgo(90), updatedAt: daysAgo(25) },
  { id: 'sw_011', word: '刷销量', category: 'ads', action: 'block', enabled: true, hitCount: 7, createdAt: daysAgo(70), updatedAt: daysAgo(18) },
  { id: 'sw_012', word: '加微信', category: 'ads', action: 'replace', replacement: '***', enabled: true, hitCount: 33, createdAt: daysAgo(80), updatedAt: daysAgo(3) },
  { id: 'sw_013', word: '微商代理', category: 'ads', action: 'review', enabled: true, hitCount: 5, createdAt: daysAgo(55), updatedAt: daysAgo(9) },
  { id: 'sw_014', word: '老不死', category: 'abuse', action: 'review', enabled: true, hitCount: 3, createdAt: daysAgo(40), updatedAt: daysAgo(7) },
  { id: 'sw_015', word: '废物', category: 'abuse', action: 'replace', replacement: '**', enabled: false, hitCount: 11, createdAt: daysAgo(40), updatedAt: daysAgo(14) },
  { id: 'sw_016', word: '断绝关系', category: 'custom', action: 'review', enabled: true, hitCount: 2, createdAt: daysAgo(30), updatedAt: daysAgo(6) },
  { id: 'sw_017', word: '遗嘱无效', category: 'custom', action: 'review', enabled: true, hitCount: 1, createdAt: daysAgo(28), updatedAt: daysAgo(28) },
  { id: 'sw_018', word: '争家产', category: 'custom', action: 'block', enabled: true, hitCount: 0, createdAt: daysAgo(20), updatedAt: daysAgo(20) },
]

const hoursAgo = (n: number) => new Date(Date.now() - n * 3600 * 1000).toISOString()

/** 敏感词命中记录种子数据（覆盖四种来源类型、三种状态） */
export const defaultSensitiveHits: SensitiveHit[] = [
  { id: 'sh_001', wordId: 'sw_001', word: '颠覆国家政权', category: 'politics', action: 'block', sourceType: 'biography_chapter', sourceTitle: '传记《峥嵘岁月：陈建国自传》第2章', context: '那一年的政治风波中，有人喊出了颠覆国家政权的口号，村里人议论纷纷。', userId: 'u_demo_001', userName: '体验用户', status: 'blocked', processorId: 'admin_001', processedAt: hoursAgo(2), createdAt: hoursAgo(5) },
  { id: 'sh_002', wordId: 'sw_012', word: '加微信', category: 'ads', action: 'replace', sourceType: 'museum_message', sourceTitle: '数字馆留言 · 张家老宅', context: '故事很感人，想了解更多家族史料可以加微信详聊。', userId: 'u_demo_002', userName: '用户0001', status: 'pending', createdAt: hoursAgo(3) },
  { id: 'sh_003', wordId: 'sw_007', word: '砍人', category: 'violence', action: 'review', sourceType: 'interview_text', sourceTitle: '采访转写 · 王大爷口述：动乱年代', context: '他回忆说当年集市上确实发生过砍人事件，大家都吓得不敢出门。', userId: 'u_demo_003', userName: '用户0002', status: 'pending', createdAt: hoursAgo(8) },
  { id: 'sh_004', wordId: 'sw_014', word: '老不死', category: 'abuse', action: 'review', sourceType: 'comment', sourceTitle: '书架评论 · 《医者仁心：李华亭回忆录》', context: '写得什么玩意，这种老不死的经历也好意思出书。', userId: 'u_demo_004', userName: '用户0003', status: 'blocked', processorId: 'admin_001', processedAt: hoursAgo(20), createdAt: hoursAgo(26) },
  { id: 'sh_005', wordId: 'sw_008', word: '自杀', category: 'violence', action: 'replace', sourceType: 'biography_chapter', sourceTitle: '传记《山村教师王桂芬》第3章', context: '最艰难的那几年，她也曾动过自杀的念头，但讲台上的孩子们让她坚持了下来。', userId: 'u_demo_001', userName: '体验用户', status: 'released', processorId: 'admin_001', processedAt: hoursAgo(30), createdAt: daysAgo(2) },
  { id: 'sh_006', wordId: 'sw_010', word: '代办信用卡', category: 'ads', action: 'block', sourceType: 'comment', sourceTitle: '书架评论 · 《陈建国自传》', context: '需要资金周转的朋友可以联系我，专业代办信用卡，额度高放款快。', userId: 'u_demo_005', userName: '用户0004', status: 'blocked', processorId: 'admin_001', processedAt: daysAgo(2), createdAt: daysAgo(2) },
  { id: 'sh_007', wordId: 'sw_003', word: '台独', category: 'politics', action: 'review', sourceType: 'interview_text', sourceTitle: '采访转写 · 退伍老兵访谈', context: '谈到两岸关系时，老人情绪激动地批评了台独分裂行径。', userId: 'u_demo_006', userName: '用户0005', status: 'released', processorId: 'admin_001', processedAt: daysAgo(3), createdAt: daysAgo(4) },
  { id: 'sh_008', wordId: 'sw_016', word: '断绝关系', category: 'custom', action: 'review', sourceType: 'biography_chapter', sourceTitle: '传记《慈母手中线》第5章', context: '一气之下，父亲说再这样就和他断绝关系，母子俩抱头痛哭。', userId: 'u_demo_002', userName: '用户0001', status: 'released', processorId: 'admin_001', processedAt: daysAgo(4), createdAt: daysAgo(5) },
  { id: 'sh_009', wordId: 'sw_013', word: '微商代理', category: 'ads', action: 'review', sourceType: 'museum_message', sourceTitle: '数字馆留言 · 李家祠堂', context: '家里老人留下的特产配方很不错，想做微商代理的私信我。', userId: 'u_demo_003', userName: '用户0002', status: 'pending', createdAt: daysAgo(1) },
  { id: 'sh_010', wordId: 'sw_004', word: '色情视频', category: 'porn', action: 'block', sourceType: 'comment', sourceTitle: '书架评论 · 《山村教师王桂芬》', context: '借楼发个广告，点击链接免费看色情视频。', userId: 'u_demo_005', userName: '用户0004', status: 'blocked', processorId: 'admin_001', processedAt: daysAgo(6), createdAt: daysAgo(6) },
]

export const defaultComplianceAlerts: ComplianceAlert[] = [
  { id: 'alert_001', biographerName: '陈墨涵', userNickname: '周先生', reason: '用户反馈传记师引导线下私下交易，绕过平台付款', riskLevel: 'high', status: 'pending', createdAt: daysAgo(3) },
  { id: 'alert_002', biographerName: '林清风', userNickname: '郑先生', reason: '订单沟通中多次出现个人收款码截图', riskLevel: 'medium', status: 'pending', createdAt: daysAgo(6) },
  { id: 'alert_003', biographerName: '王雅琴', userNickname: '刘女士', reason: '疑似要求用户取消平台订单改为私下签约', riskLevel: 'low', status: 'resolved', createdAt: daysAgo(15) },
]

export const defaultBookComments: BookComment[] = [
  { id: 'cmt_001', bookId: 'book_demo_001', userNickname: '张先生', content: '读完后对父辈那一代人的创业艰辛有了更深的理解，很受触动。', createdAt: daysAgo(18), likes: 12 },
  { id: 'cmt_002', bookId: 'book_demo_001', userNickname: '李女士', content: '文字很朴实，但正是这种真实最打动人，推荐给家里年轻人看看。', createdAt: daysAgo(12), likes: 8 },
  { id: 'cmt_003', bookId: 'book_demo_001', userNickname: '陈女士', content: '苏州老巷的描写特别有画面感，想起了自己的童年。', createdAt: daysAgo(5), likes: 5 },
  { id: 'cmt_004', bookId: 'book_demo_002', userNickname: '王先生', content: '四十年坚守山村讲台，向王老师致敬。', createdAt: daysAgo(10), likes: 15 },
  { id: 'cmt_005', bookId: 'book_demo_002', userNickname: '体验用户', content: '章节不长但内容很扎实，值回票价。', createdAt: daysAgo(4), likes: 3 },
  { id: 'cmt_006', bookId: 'book_demo_003', userNickname: '赵大伯', content: '从赤脚医生到专家的经历很传奇，期待正式上架。', createdAt: daysAgo(2), likes: 1 },
]

export const defaultMuseumMessages: MuseumMessage[] = [
  { id: 'msg_001', archiveId: 'arch_001', userNickname: '张先生', content: '张伯伯一路走好，您的创业故事我们会一直讲下去。', createdAt: daysAgo(9) },
  { id: 'msg_002', archiveId: 'arch_001', userNickname: '李女士', content: '看了数字馆很受感动，家风就是这样一代代传下来的。', createdAt: daysAgo(6) },
  { id: 'msg_003', archiveId: 'arch_002', userNickname: '王先生', content: '王老师是我小学班主任，永远怀念您。', createdAt: daysAgo(4) },
  { id: 'msg_004', archiveId: 'arch_003', userNickname: '陈女士', content: '爷爷的故事整理得真好，孩子们都来听。', createdAt: daysAgo(2) },
  { id: 'msg_005', archiveId: 'arch_001', userNickname: '孙女士', content: '献上一束花，愿先辈安息。', createdAt: daysAgo(1) },
]

// ========== 演示数字博物馆种子数据（archiveId 固定为 'demo'） ==========

export const DEMO_MUSEUM_ARCHIVE_ID = 'demo'

export const defaultDemoBiography: Biography = {
  id: 'biog_demo_001',
  archiveId: DEMO_MUSEUM_ARCHIVE_ID,
  title: '张明远：一位苏州企业家的六十年',
  style: 'plain',
  wordCount: 'standard',
  status: 'final',
  createdAt: daysAgo(200),
  updatedAt: daysAgo(180),
  chapters: [
    {
      id: 'biog_demo_ch1',
      order: 0,
      title: '第一章 水乡童年',
      images: [],
      content: [
        '1942 年深秋，张明远出生在苏州平江路的一座老宅里。宅子临水而建，清晨推开窗，便能听见摇橹声由远及近。父亲在绸缎庄做账房先生，母亲操持家务，一家人日子过得清苦却安稳。',
        '童年的张明远最盼的是年节。除夕夜，一家人围坐在八仙桌旁，父亲会讲祖上做丝绸生意的旧事，母亲则把积攒了一年的好布料拿出来，给孩子们各做一身新衣。那些关于诚信与勤恳的家常话，像种子一样埋进了他幼小的心田。',
        '家中兄弟姐妹五人，他排行第三，从小就懂得谦让与分担。放学后他常帮父亲誊抄账目，一笔一画工整清晰，父亲看了总是点头：「做事先做人，账要清，心更要清。」这句话，他记了一辈子。',
      ].join('\n\n'),
    },
    {
      id: 'biog_demo_ch2',
      order: 1,
      title: '第二章 从丝绸厂到创业路',
      images: [],
      content: [
        '1959 年，张明远考入苏州纺织工业学校。毕业后，他被分配到国营苏州丝绸厂，从学徒工做起，白天在车间跟师傅学手艺，晚上在灯下自学机械原理，很快成为厂里的技术骨干。那些年，他参与改进的织机工艺，让车间的良品率提升了近两成。',
        '1984 年，改革开放的春风吹遍江南。已过不惑之年的张明远做出了一个让全家人捏把汗的决定——辞去铁饭碗，倾尽积蓄创办明远纺织厂。创业之初，厂房是租来的旧仓库，机器是二手的，他白天跑原料、谈客户，晚上和工人一起检修设备，常常忙到后半夜。',
        '凭着「做生意先做人」的信条，明远纺织厂渐渐在苏州站稳了脚跟。九十年代末，企业已拥有员工三百余人，产品远销海外，先后获评「江苏省优秀民营企业」「苏州市诚信经营示范企业」。他最常说的一句话是：「厂子可以小，信誉不能倒。」',
      ].join('\n\n'),
    },
    {
      id: 'biog_demo_ch3',
      order: 2,
      title: '第三章 家风与晚年',
      images: [],
      content: [
        '1968 年，张明远与同厂的女工周婉清结为夫妻。两人相濡以沫五十余载，养育了一子一女。在子女的记忆里，父亲从不说教，却用行动立规矩：饭桌上长辈不动筷，孩子不能先吃；借了东西，必须按时归还；逢年过节，全家必回老宅团聚。',
        '2003 年退休后，张明远把企业交给儿女打理，自己则投身于家族事务与公益。他主持修订了张氏族谱，捐资助建了家乡的小学图书室，还坚持每年清明带着儿孙回乡祭祖，一路上讲述祖辈的故事，唯恐家风断代。',
        '2023 年春，张明远在苏州家中安详离世，享年八十一岁。弥留之际，他留给子孙最后一句话：「忠厚传家久，诗书继世长。守住本分，就是守住我们张家的根。」',
      ].join('\n\n'),
    },
  ],
}

export const defaultDemoTimeline: TimelineEvent[] = [
  { id: 'tl_demo_001', archiveId: DEMO_MUSEUM_ARCHIVE_ID, year: 1942, title: '出生于苏州', description: '深秋时节，张明远出生于苏州平江路一座临水老宅，父亲在绸缎庄做账房先生，家境清苦而温馨。', category: '童年', images: [] },
  { id: 'tl_demo_002', archiveId: DEMO_MUSEUM_ARCHIVE_ID, year: 1959, title: '考入纺织工业学校', description: '以优异成绩考入苏州纺织工业学校，离开老宅住校求学，开始系统学习纺织技术。', category: '求学', images: [] },
  { id: 'tl_demo_003', archiveId: DEMO_MUSEUM_ARCHIVE_ID, year: 1963, title: '进入国营苏州丝绸厂', description: '毕业后分配至国营苏州丝绸厂，从学徒工成长为技术骨干，参与改进织机工艺，良品率提升近两成。', category: '事业', images: [] },
  { id: 'tl_demo_004', archiveId: DEMO_MUSEUM_ARCHIVE_ID, year: 1968, title: '与周婉清结婚', description: '与同厂女工周婉清结为夫妻，婚礼简朴而热闹，两人相濡以沫五十余载，育有一子一女。', category: '家庭', images: [] },
  { id: 'tl_demo_005', archiveId: DEMO_MUSEUM_ARCHIVE_ID, year: 1984, title: '创办明远纺织厂', description: '改革开放浪潮中辞去公职，倾尽积蓄创办明远纺织厂。从租来的旧仓库起步，逐步发展为三百余人规模的企业。', category: '事业', images: [] },
  { id: 'tl_demo_006', archiveId: DEMO_MUSEUM_ARCHIVE_ID, year: 1998, title: '获评省优秀民营企业', description: '明远纺织厂获评「江苏省优秀民营企业」，产品远销海外，张明远本人当选苏州市劳动模范。', category: '荣誉', images: [] },
  { id: 'tl_demo_007', archiveId: DEMO_MUSEUM_ARCHIVE_ID, year: 2003, title: '退休，投身家族公益', description: '正式退休，将企业交给子女打理，此后主持修订张氏族谱，捐资助建家乡小学图书室。', category: '人生', images: [] },
  { id: 'tl_demo_008', archiveId: DEMO_MUSEUM_ARCHIVE_ID, year: 2023, title: '安详逝世', description: '2023 年春，张明远在苏州家中安详离世，享年八十一岁。临终留下家训：忠厚传家久，诗书继世长。', category: '人生', images: [] },
]

export const defaultDemoMaterials: Material[] = [
  { id: 'mat_demo_001', archiveId: DEMO_MUSEUM_ARCHIVE_ID, type: 'image', url: 'https://picsum.photos/seed/mingyuan-childhood/800/600', title: '平江路老宅旧影', category: '童年', description: '张家祖宅临水而建，承载着张明远的童年记忆。', shootTime: '1948-06-01', shootPlace: '苏州平江路', createdAt: daysAgo(200) },
  { id: 'mat_demo_002', archiveId: DEMO_MUSEUM_ARCHIVE_ID, type: 'image', url: 'https://picsum.photos/seed/mingyuan-school/800/600', title: '纺织工业学校求学照', category: '其他', description: '1959 年入学时与同窗在校门口的合影。', shootTime: '1959-09-01', shootPlace: '苏州', createdAt: daysAgo(200) },
  { id: 'mat_demo_003', archiveId: DEMO_MUSEUM_ARCHIVE_ID, type: 'image', url: 'https://picsum.photos/seed/mingyuan-factory/800/600', title: '丝绸厂车间留影', category: '事业', description: '张明远在织机车间的留影，彼时已是厂里的技术骨干。', shootTime: '1972-05-01', shootPlace: '国营苏州丝绸厂', createdAt: daysAgo(200) },
  { id: 'mat_demo_004', archiveId: DEMO_MUSEUM_ARCHIVE_ID, type: 'image', url: 'https://picsum.photos/seed/mingyuan-family/800/600', title: '全家合影', category: '家庭', description: '1975 年春节全家福，一家人在老宅门前合影。', shootTime: '1975-02-11', shootPlace: '苏州', createdAt: daysAgo(200) },
  { id: 'mat_demo_005', archiveId: DEMO_MUSEUM_ARCHIVE_ID, type: 'image', url: 'https://picsum.photos/seed/mingyuan-startup/800/600', title: '创业初期的厂房', category: '事业', description: '1984 年明远纺织厂创业之初租用的旧仓库厂房。', shootTime: '1984-10-01', shootPlace: '苏州郊区', createdAt: daysAgo(200) },
  { id: 'mat_demo_006', archiveId: DEMO_MUSEUM_ARCHIVE_ID, type: 'image', url: 'https://picsum.photos/seed/mingyuan-anniversary/800/600', title: '金婚纪念', category: '家庭', description: '2018 年与夫人周婉清的金婚纪念照，儿孙满堂。', shootTime: '2018-10-01', shootPlace: '苏州', createdAt: daysAgo(200) },
  { id: 'mat_demo_007', archiveId: DEMO_MUSEUM_ARCHIVE_ID, type: 'document', url: '', title: '江苏省优秀民营企业家', category: '荣誉', description: '1998 年，因明远纺织厂诚信经营、带动地方就业，张明远获评「江苏省优秀民营企业家」。', shootTime: '1998-12-01', createdAt: daysAgo(200) },
  { id: 'mat_demo_008', archiveId: DEMO_MUSEUM_ARCHIVE_ID, type: 'document', url: '', title: '苏州市劳动模范', category: '荣誉', description: '1998 年当选苏州市劳动模范，表彰其在纺织行业的突出贡献。', shootTime: '1998-05-01', createdAt: daysAgo(200) },
  { id: 'mat_demo_009', archiveId: DEMO_MUSEUM_ARCHIVE_ID, type: 'document', url: '', title: '诚信经营示范企业', category: '荣誉', description: '2002 年，明远纺织厂被苏州市评为「诚信经营示范企业」。', shootTime: '2002-03-01', createdAt: daysAgo(200) },
]

export const defaultDemoMuseum: Museum = {
  id: 'museum_demo_001',
  archiveId: DEMO_MUSEUM_ARCHIVE_ID,
  title: '张明远的人生数字博物馆',
  intro: '张明远（1942—2023），苏州人，明远纺织厂创始人。从国营丝绸厂学徒工到改革开放后的民营企业家，他用一生践行「做生意先做人」的信条。晚年修订族谱、捐资助学，把「忠厚传家久，诗书继世长」的家风留给了子孙后代。',
  cover: 'https://picsum.photos/seed/mingyuan-cover/1200/480',
  visibility: 'public',
  views: 3268,
  visitors: 1156,
  likes: 236,
  candles: 88,
  flowers: 152,
  createdAt: daysAgo(200),
}

// ========== 合伙人渠道/考核种子数据 ==========

export const defaultPartnerChannels: PartnerChannel[] = [
  { id: 'ch_001', partnerId: 'partner_demo', type: 'cemetery', orgName: '杭州南山陵园', contact: '周主任', phone: '057188001001', status: 'active', cooperatedAt: daysAgo(120) },
  { id: 'ch_002', partnerId: 'partner_demo', type: 'cemetery', orgName: '上海福寿园', contact: '吴经理', phone: '02188002002', status: 'active', cooperatedAt: daysAgo(90) },
  { id: 'ch_003', partnerId: 'partner_demo', type: 'elderly', orgName: '杭州亲和源养老社区', contact: '沈院长', phone: '057188003003', status: 'active', cooperatedAt: daysAgo(75) },
  { id: 'ch_004', partnerId: 'partner_demo', type: 'elderly', orgName: '苏州怡养老年公寓', contact: '钱院长', phone: '051288004004', status: 'active', cooperatedAt: daysAgo(50) },
  { id: 'ch_005', partnerId: 'partner_demo', type: 'cemetery', orgName: '南京雨花台功德园', contact: '徐经理', phone: '02588005005', status: 'inactive', cooperatedAt: daysAgo(150) },
  { id: 'ch_006', partnerId: 'partner_demo', type: 'elderly', orgName: '北京太阳城养老社区', contact: '马主任', phone: '01088006006', status: 'active', cooperatedAt: daysAgo(30) },
]

export const defaultPartnerAssessment: PartnerAssessment = {
  year: 2026,
  gmvTier: 'A 档（≥200 万）',
  gmvTarget: 2000000,
  gmvCompleted: 1286000,
  metrics: [
    { name: '渠道拓展', target: 10, completed: 6 },
    { name: '服务履约', target: 100, completed: 96 },
    { name: '品牌运营', target: 12, completed: 8 },
    { name: '合规风控', target: 100, completed: 100 },
  ],
  payouts: [
    { id: 'pay_001', period: '2026-03', amount: 12800, status: 'paid', paidAt: daysAgo(100) },
    { id: 'pay_002', period: '2026-04', amount: 15600, status: 'paid', paidAt: daysAgo(70) },
    { id: 'pay_003', period: '2026-05', amount: 18400, status: 'paid', paidAt: daysAgo(40) },
    { id: 'pay_004', period: '2026-06', amount: 21200, status: 'pending' },
  ],
}

export const defaultGmvLineStats: GmvLineStat[] = [
  {
    line: 'ai_biography',
    lineName: 'AI 传记',
    monthly: [
      { month: '2026-01', gmv: 68000 }, { month: '2026-02', gmv: 82000 }, { month: '2026-03', gmv: 96000 },
      { month: '2026-04', gmv: 112000 }, { month: '2026-05', gmv: 128000 }, { month: '2026-06', gmv: 145000 },
    ],
  },
  {
    line: 'bookshelf',
    lineName: '书架付费',
    monthly: [
      { month: '2026-01', gmv: 8600 }, { month: '2026-02', gmv: 12400 }, { month: '2026-03', gmv: 15800 },
      { month: '2026-04', gmv: 19200 }, { month: '2026-05', gmv: 23600 }, { month: '2026-06', gmv: 28900 },
    ],
  },
  {
    line: 'biographer_service',
    lineName: '传记师服务',
    monthly: [
      { month: '2026-01', gmv: 42000 }, { month: '2026-02', gmv: 56000 }, { month: '2026-03', gmv: 73000 },
      { month: '2026-04', gmv: 88000 }, { month: '2026-05', gmv: 96000 }, { month: '2026-06', gmv: 118000 },
    ],
  },
  {
    line: 'robot_hardware',
    lineName: '机器人硬件',
    monthly: [
      { month: '2026-01', gmv: 0 }, { month: '2026-02', gmv: 15800 }, { month: '2026-03', gmv: 31600 },
      { month: '2026-04', gmv: 47400 }, { month: '2026-05', gmv: 63200 }, { month: '2026-06', gmv: 94800 },
    ],
  },
]

export const defaultPartnerLocalOrders: PartnerLocalOrder[] = [
  { id: 'lo_001', userNickname: '张先生', productName: 'AI 传记标准版', amount: 99, status: 'completed', createdAt: daysAgo(26) },
  { id: 'lo_002', userNickname: '李女士', productName: '数字人陪伴版', amount: 299, status: 'completed', createdAt: daysAgo(19) },
  { id: 'lo_003', userNickname: '王先生', productName: '99 元 AI 传记拼团', amount: 99, status: 'paid', createdAt: daysAgo(11) },
  { id: 'lo_004', userNickname: '陈女士', productName: '实体书·精装版', amount: 288, status: 'delivering', createdAt: daysAgo(6) },
  { id: 'lo_005', userNickname: '赵大伯', productName: '60 秒纪念短视频', amount: 199, status: 'completed', createdAt: daysAgo(3) },
  { id: 'lo_006', userNickname: '孙女士', productName: '码记二维码', amount: 49, status: 'pending_pay', createdAt: daysAgo(1) },
]

// ========== 传记师结算种子数据 ==========

export const defaultBiographerSettlements: BiographerSettlement[] = [
  {
    biographerId: 'bio_001',
    escrowAmount: 5999,
    availableAmount: 23800,
    commissionRate: 0.15,
    incomes: [
      { orderNo: 'ord_001', amount: 1999, commission: 299.85, createdAt: daysAgo(32) },
      { orderNo: 'ord_002', amount: 5999, commission: 899.85, createdAt: daysAgo(47) },
      { orderNo: 'ord_003', amount: 1999, commission: 299.85, createdAt: daysAgo(62) },
    ],
    withdrawals: [
      { id: 'wd_001', amount: 8000, status: 'paid', appliedAt: daysAgo(50), paidAt: daysAgo(48) },
      { id: 'wd_007', amount: 3000, status: 'approved', appliedAt: daysAgo(10) },
      { id: 'wd_008', amount: 2000, status: 'rejected', appliedAt: daysAgo(6) },
      { id: 'wd_002', amount: 5000, status: 'pending', appliedAt: daysAgo(2) },
    ],
    penalties: [
      { id: 'pen_003', reason: '初稿交付逾期 1 天，按约扣除违约金', amount: 200, createdAt: daysAgo(20) },
    ],
  },
  {
    biographerId: 'bio_002',
    escrowAmount: 1299,
    availableAmount: 15200,
    commissionRate: 0.15,
    incomes: [
      { orderNo: 'ord_004', amount: 1299, commission: 194.85, createdAt: daysAgo(22) },
      { orderNo: 'ord_005', amount: 3999, commission: 599.85, createdAt: daysAgo(37) },
      { orderNo: 'ord_006', amount: 1299, commission: 194.85, createdAt: daysAgo(52) },
    ],
    withdrawals: [
      { id: 'wd_003', amount: 6000, status: 'paid', appliedAt: daysAgo(40), paidAt: daysAgo(38) },
    ],
    penalties: [
      { id: 'pen_001', reason: '交付逾期 2 天，按约扣除违约金', amount: 200, createdAt: daysAgo(50) },
    ],
  },
  {
    biographerId: 'bio_003',
    escrowAmount: 8999,
    availableAmount: 31600,
    commissionRate: 0.18,
    incomes: [
      { orderNo: 'ord_007', amount: 8999, commission: 1619.82, createdAt: daysAgo(17) },
      { orderNo: 'ord_008', amount: 4999, commission: 899.82, createdAt: daysAgo(42) },
    ],
    withdrawals: [
      { id: 'wd_004', amount: 12000, status: 'paid', appliedAt: daysAgo(30), paidAt: daysAgo(28) },
      { id: 'wd_005', amount: 8000, status: 'rejected', appliedAt: daysAgo(5) },
    ],
    penalties: [
      { id: 'pen_002', reason: '疑似引导私单，冻结部分结算款', amount: 1000, createdAt: daysAgo(3) },
    ],
  },
  {
    biographerId: 'bio_004',
    escrowAmount: 2999,
    availableAmount: 9800,
    commissionRate: 0.15,
    incomes: [
      { orderNo: 'ord_009', amount: 2999, commission: 449.85, createdAt: daysAgo(27) },
      { orderNo: 'ord_010', amount: 1599, commission: 239.85, createdAt: daysAgo(57) },
    ],
    withdrawals: [
      { id: 'wd_006', amount: 4000, status: 'paid', appliedAt: daysAgo(35), paidAt: daysAgo(33) },
    ],
    penalties: [],
  },
]

// ========== 平台管理端扩展种子数据 ==========

export const defaultQrCodes: QrCodeRecord[] = [
  { id: 'qr_001', code: 'QR-T-20260001', museumName: '李华亭数字纪念馆', type: 'tombstone', status: 'bound', createdAt: daysAgo(60) },
  { id: 'qr_002', code: 'QR-T-20260002', museumName: '周秀英数字纪念馆', type: 'tombstone', status: 'enabled', createdAt: daysAgo(45) },
  { id: 'qr_003', code: 'QR-M-20260003', museumName: '张明远家风馆', type: 'memorial', status: 'bound', createdAt: daysAgo(40) },
  { id: 'qr_004', code: 'QR-M-20260004', museumName: '王桂芬纪念馆', type: 'memorial', status: 'disabled', createdAt: daysAgo(30) },
  { id: 'qr_005', code: 'QR-S-20260005', museumName: '李华亭数字纪念馆', type: 'share', status: 'enabled', createdAt: daysAgo(20) },
  { id: 'qr_006', code: 'QR-S-20260006', museumName: '陈氏家族馆', type: 'share', status: 'unbound', createdAt: daysAgo(10) },
  { id: 'qr_007', code: 'QR-T-20260007', museumName: '赵德柱纪念馆', type: 'tombstone', status: 'unbound', createdAt: daysAgo(3) },
]

export const defaultBiographerDeposits: BiographerDepositRecord[] = [
  { id: 'dep_001', biographerId: 'bio_001', biographerName: '李传记', amount: 1000, paidAt: daysAgo(120), status: 'paid' },
  { id: 'dep_002', biographerId: 'bio_002', biographerName: '王雅琴', amount: 800, paidAt: daysAgo(100), status: 'paid' },
  { id: 'dep_003', biographerId: 'bio_003', biographerName: '陈墨涵', amount: 1000, paidAt: daysAgo(80), status: 'deducted' },
  { id: 'dep_004', biographerId: 'bio_004', biographerName: '林清风', amount: 500, paidAt: daysAgo(60), status: 'refunded' },
]

export const defaultBiographerPenalties: BiographerPenaltyRecord[] = [
  { id: 'pnr_001', biographerId: 'bio_002', biographerName: '王雅琴', violationType: '交付逾期', measure: '扣款', amount: 200, reason: '交付逾期 2 天，按约扣除违约金', status: 'effective', createdAt: daysAgo(50) },
  { id: 'pnr_002', biographerId: 'bio_003', biographerName: '陈墨涵', violationType: '私单引流', measure: '扣款+警告', amount: 1000, reason: '疑似引导私单，冻结部分结算款', status: 'effective', createdAt: daysAgo(3) },
  { id: 'pnr_003', biographerId: 'bio_001', biographerName: '李传记', violationType: '交付逾期', measure: '扣款', amount: 200, reason: '初稿交付逾期 1 天，按约扣除违约金', status: 'effective', createdAt: daysAgo(20) },
]

export const defaultPartnerFees: PartnerFeeRecord[] = [
  { id: 'fee_001', partnerId: 'partner_001', partnerName: '杭州合作服务商', feeType: 'license', amount: 50000, paidAt: daysAgo(150), status: 'paid' },
  { id: 'fee_002', partnerId: 'partner_001', partnerName: '杭州合作服务商', feeType: 'saas', amount: 12000, paidAt: daysAgo(150), status: 'paid' },
  { id: 'fee_003', partnerId: 'partner_001', partnerName: '杭州合作服务商', feeType: 'deposit', amount: 30000, paidAt: daysAgo(148), status: 'paid' },
  { id: 'fee_004', partnerId: 'partner_002', partnerName: '宁波合作服务商', feeType: 'license', amount: 50000, paidAt: daysAgo(90), status: 'paid' },
  { id: 'fee_005', partnerId: 'partner_002', partnerName: '宁波合作服务商', feeType: 'saas', amount: 12000, paidAt: daysAgo(88), status: 'pending' },
  { id: 'fee_006', partnerId: 'partner_003', partnerName: '温州合作服务商', feeType: 'deposit', amount: 30000, paidAt: daysAgo(30), status: 'refunded' },
]

export const defaultPartnerShareConfigs: PartnerShareConfig[] = [
  { id: 'shr_001', regionName: '杭州市西湖区', partnerId: 'partner_001', partnerName: '杭州合作服务商', rate: 0.15, effectiveAt: '2026-01-01T00:00:00' },
  { id: 'shr_002', regionName: '宁波市海曙区', partnerId: 'partner_002', partnerName: '宁波合作服务商', rate: 0.12, effectiveAt: '2026-01-01T00:00:00' },
  { id: 'shr_003', regionName: '温州市鹿城区', partnerId: 'partner_003', partnerName: '温州合作服务商', rate: 0.1, effectiveAt: '2026-03-01T00:00:00' },
]

export const defaultPartnerRewardConfigs: PartnerRewardConfig[] = [
  { id: 'rwd_001', level: 'city', condition: '年度 GMV ≥ 100 万', amount: 20000, status: 'enabled' },
  { id: 'rwd_002', level: 'city', condition: '年度 GMV ≥ 300 万', amount: 60000, status: 'enabled' },
  { id: 'rwd_003', level: 'province', condition: '年度 GMV ≥ 500 万且考核评级优秀', amount: 150000, status: 'enabled' },
  { id: 'rwd_004', level: 'province', condition: '年度渠道拓展 ≥ 20 家', amount: 80000, status: 'disabled' },
]

export const defaultPartnerAssessments: PartnerAssessmentRecord[] = [
  { id: 'asm_001', partnerId: 'partner_001', partnerName: '杭州合作服务商', year: 2025, gmvTier: 'A 档（300-500 万）', channelScore: 88, fulfillmentScore: 95, brandScore: 82, complianceScore: 100, rating: '优秀' },
  { id: 'asm_002', partnerId: 'partner_002', partnerName: '宁波合作服务商', year: 2025, gmvTier: 'B 档（100-300 万）', channelScore: 76, fulfillmentScore: 90, brandScore: 70, complianceScore: 95, rating: '良好' },
  { id: 'asm_003', partnerId: 'partner_003', partnerName: '温州合作服务商', year: 2025, gmvTier: 'C 档（50-100 万）', channelScore: 60, fulfillmentScore: 72, brandScore: 55, complianceScore: 80, rating: '合格' },
]
