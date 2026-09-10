// 演示内容注入：登录/进入演示模式时为默认档案（张明远）补齐传记章节、成书快照与采访记录，
// 保证传记生成、我的传记、传记印刷、数字资产导出、采访记录等页面开箱即有内容。
// 只在对应 key 不存在时写入，不覆盖用户已有数据。

import { demoChapterTopics } from '../utils/biographyOutline';

const DEMO_ARCHIVE_ID = 'default';

function setIfAbsent(key: string, value: unknown) {
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const demoChapters = [
  {
    title: '故里童年 · 初心萌芽',
    content: '<p>1958 年 3 月，我出生在苏州的一条老巷里。父亲是中学教师，母亲操持家务，家里虽不富裕，书香气息却很浓。</p><p>童年最深的记忆是巷口那棵大樟树。夏天傍晚，父亲收工回来，总在树下给我们讲《三国演义》。母亲在灶间忙碌，饭菜香混着蝉鸣，是我一生难忘的画面。</p><p>父亲常说："再穷不能穷教育。"这句话，后来成了我们家的家训。</p>',
  },
  {
    title: '求学成长 · 岁月积淀',
    content: '<p>1965 年我进入苏州市立实验小学，班主任王老师对我影响深远。她发现我喜欢拆东西，非但没有批评，反而鼓励我"搞明白原理再装回去"。</p><p>中学时期，我迷上了机械。家里的闹钟、收音机都被我拆开又装回去过。1976 年考入苏州市中学后，我把全部课余时间都泡在学校的小工厂里。</p><p>那些年养成的钻研习惯，为我后来的工程师生涯打下了底子。</p>',
  },
  {
    title: '择业入行 · 缘起初心',
    content: '<p>1985 年从苏州大学机械工程专业毕业后，我被分配到国营机械厂做技术员。毕业分配时，我放弃了去机关的机会，主动要求到一线。</p><p>"机器不会骗人"，这是入行时师傅教我的第一句话，也成了我此后几十年的职业信条。</p>',
  },
  {
    title: '深耕岁月 · 历练成长',
    content: '<p>我跟着车间主任跑了三年一线，把每台设备的脾气都摸熟了。1988 年，我主持的第一条技改产线投产，效率提升了近四成。</p><p>1992 年，我辞去稳定的工作，创办了明远机械有限公司。从国营厂的技术员到民营企业的创办者，身份变了，对行业的热爱始终没变。</p>',
  },
  {
    title: '风雨磨砺 · 破局成长',
    content: '<p>创业头两年异常艰难，最困难的时候账上只剩几千块钱。1994 年，一笔大额订单因精度问题险些被退回，那是我创业以来最大的坎。</p><p>我带着团队在车间泡了三个月，逐项排查工艺问题，最终通过了客户最严苛的复检。回头看，每一次破局，都让脚下的路更坚实。</p>',
  },
  {
    title: '行业感悟 · 职业修为',
    content: '<p>在机械制造这个行业摸爬滚打了三十多年，最深的体会是：技术会迭代，设备会更新，但"认真"二字永远不会过时。</p><p>做技术的人，手上要有功夫，心里要有敬畏。中国制造要赢得尊重，靠的不是低价，而是把每一个零件都做到极致。</p>',
  },
  {
    title: '家风人生 · 温情生活',
    content: '<p>1980 年，我和相恋多年的晓如结了婚。婚礼很简朴，两床新被面，一桌家常菜，但我们许下的承诺一直没有变。</p><p>1982 年长子子涵出生，1985 年女儿雨桐出生。创业再忙，每周日的家庭晚餐我从不缺席。孩子们后来都成家立业，这是我们最骄傲的事。</p>',
  },
  {
    title: '人生回望 · 未来愿景',
    content: '<p>2008 年起，我在家乡设立了明远助学基金，资助贫困学生完成学业。能力越大，责任越大——这是我办企业三十年最深的体会。</p><p>正直、担当、勤俭、善良，这八个字是我们家最宝贵的财产。钱传不下去，做人做事的道理可以。</p>',
  },
];


function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

// 旧版章节框架（前言/童年记忆/求学岁月/工作经历/创业之路/家庭生活/人生感悟/后记）
const legacyTitles = ['前言', '童年记忆', '求学岁月', '工作经历', '创业之路', '家庭生活', '人生感悟', '后记'];

// 旧框架 → 八大篇章 的标题映射（前言/后记在八大篇章中不存在，迁移时丢弃）
const legacyTitleMap: Record<string, string> = {
  '童年记忆': '故里童年 · 初心萌芽',
  '求学岁月': '求学成长 · 岁月积淀',
  '工作经历': '择业入行 · 缘起初心',
  '创业之路': '深耕岁月 · 历练成长',
  '家庭生活': '家风人生 · 温情生活',
  '人生感悟': '人生回望 · 未来愿景',
};

/** 迁移所有档案的旧框架章节数据（章节草稿 / 大纲 / 成书快照），保留已写内容，仅改标题并丢弃前言/后记 */
function migrateLegacyBiographyData() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  keys.forEach((key) => {
    try {
      if (key.startsWith('cj_biography_chapters_')) {
        const list = JSON.parse(localStorage.getItem(key) || 'null') as Array<{ title?: string; content?: string }> | null;
        if (!Array.isArray(list) || !list.length) return;
        if (!list.every((c) => c.title && legacyTitles.includes(c.title))) return;
        const migrated = list
          .filter((c) => c.title !== '前言' && c.title !== '后记')
          .map((c) => ({ ...c, title: legacyTitleMap[c.title || ''] || c.title }));
        // 补齐八大篇章中缺失的章节（空内容、未生成）
        const newTitles = [
          '故里童年 · 初心萌芽', '求学成长 · 岁月积淀', '择业入行 · 缘起初心', '深耕岁月 · 历练成长',
          '风雨磨砺 · 破局成长', '行业感悟 · 职业修为', '家风人生 · 温情生活', '人生回望 · 未来愿景',
        ];
        newTitles.forEach((t) => {
          if (!migrated.some((c) => c.title === t)) {
            migrated.push({ title: t, content: '', status: 'notGenerated', updatedAt: null } as never);
          }
        });
        migrated.sort((a, b) => newTitles.indexOf(a.title || '') - newTitles.indexOf(b.title || ''));
        localStorage.setItem(key, JSON.stringify(migrated));
      } else if (key.startsWith('cj_biography_outline_')) {
        const outline = JSON.parse(localStorage.getItem(key) || 'null') as { chapters?: Array<{ title?: string }> } | null;
        if (!outline?.chapters?.length) return;
        if (!outline.chapters.every((c) => c.title && legacyTitles.includes(c.title))) return;
        outline.chapters = outline.chapters
          .filter((c) => c.title !== '前言' && c.title !== '后记')
          .map((c) => ({ ...c, title: legacyTitleMap[c.title || ''] || c.title }));
        localStorage.setItem(key, JSON.stringify(outline));
      } else if (/^cj_biography_(?!chapters_|outline_|versions_|style_|suggestions_)/.test(key)) {
        const snapshot = JSON.parse(localStorage.getItem(key) || 'null') as { chapters?: Array<{ title?: string }> } | null;
        if (!snapshot?.chapters?.length) return;
        if (!snapshot.chapters.every((c) => c.title && legacyTitles.includes(c.title))) return;
        snapshot.chapters = snapshot.chapters
          .filter((c) => c.title !== '前言' && c.title !== '后记')
          .map((c) => ({ ...c, title: legacyTitleMap[c.title || ''] || c.title }));
        localStorage.setItem(key, JSON.stringify(snapshot));
      }
    } catch {
      // ignore
    }
  });
}

/** 为默认档案补齐演示传记与采访数据（已有数据时不覆盖） */
export function ensureDemoContent() {
  // 传记章节（AI 传记生成 / 我的传记 / 印刷 / 导出共用）；旧框架（前言/童年记忆…）的演示数据自动升级为八大篇章
  const chapters = demoChapters.map((c, i) => ({
    title: c.title,
    materials: 3,
    status: (i < 2 ? 'edited' : 'generated') as 'edited' | 'generated',
    updatedAt: daysAgo(demoChapters.length - i),
    content: c.content,
  }));
  const chaptersKey = `cj_biography_chapters_${DEMO_ARCHIVE_ID}`;
  try {
    const raw = localStorage.getItem(chaptersKey);
    const existing = raw ? (JSON.parse(raw) as Array<{ title?: string }>) : null;
    if (!existing || existing.every((c) => c.title && legacyTitles.includes(c.title))) {
      localStorage.setItem(chaptersKey, JSON.stringify(chapters));
    }
  } catch {
    // ignore
  }

  // 成书快照（演示为「修改中」状态：有内容但未定稿）；同样做旧框架升级
  const snapshotKey = `cj_biography_${DEMO_ARCHIVE_ID}`;
  const snapshot = {
    title: '张明远传',
    author: 'AI 整理',
    createdAt: daysAgo(20),
    status: 'draft',
    chapters: demoChapters.map((c) => ({ title: c.title, content: c.content })),
  };
  try {
    const raw = localStorage.getItem(snapshotKey);
    const existing = raw ? (JSON.parse(raw) as { title?: string; author?: string; status?: string; chapters?: Array<{ title?: string }> }) : null;
    const isLegacy = existing && (existing.chapters || []).every((c) => c.title && legacyTitles.includes(c.title));
    const isDemoFinal = existing?.title === '张明远传' && existing?.author === 'AI 整理' && existing?.status === 'final';
    if (!existing || isLegacy || isDemoFinal) {
      localStorage.setItem(snapshotKey, JSON.stringify(snapshot));
    }
  } catch {
    // ignore
  }

  // 采访逐字稿（采访页与采访记录页展示历史对话）
  const transcript: { speaker: string; time: string; text: string; topic?: string }[] = [
    { speaker: 'AI采访官', time: daysAgo(20), text: '请谈谈您的童年经历，它是怎么开始的？', topic: '故里童年' },
    { speaker: '张明远', time: daysAgo(20), text: '我 1958 年出生在苏州的一条老巷里，父亲是中学教师，家里书香气息很浓。', topic: '故里童年' },
    { speaker: 'AI采访官', time: daysAgo(20), text: '巷口的大樟树在您的记忆里扮演了怎样的角色？', topic: '故里童年' },
    { speaker: '张明远', time: daysAgo(20), text: '夏天傍晚父亲总在树下给我们讲故事，那是我童年最温暖的画面。', topic: '故里童年' },
    { speaker: 'AI采访官', time: daysAgo(19), text: '求学路上，哪位老师对您影响最深？', topic: '求学成长' },
    { speaker: '张明远', time: daysAgo(19), text: '小学班主任王老师。我喜欢拆东西，她不但不批评，还鼓励我搞明白原理再装回去。', topic: '求学成长' },
    { speaker: 'AI采访官', time: daysAgo(19), text: '1985 年毕业后进入国营机械厂，最初的工作状态是怎样的？', topic: '择业入行' },
    { speaker: '张明远', time: daysAgo(19), text: '跟着车间主任跑了三年一线，把每台设备的脾气都摸熟了。', topic: '择业入行' },
    { speaker: 'AI采访官', time: daysAgo(18), text: '1992 年下海创业，最困难的时候是怎么熬过来的？', topic: '风雨磨砺' },
    { speaker: '张明远', time: daysAgo(18), text: '账上只剩几千块钱的时候也没想过放弃，认准方向、守住质量，订单总会来的。', topic: '风雨磨砺' },
    { speaker: 'AI采访官', time: daysAgo(18), text: '回顾这一生，您最想传给后辈的是什么？', topic: '人生回望' },
    { speaker: '张明远', time: daysAgo(18), text: '正直、担当、勤俭、善良。钱传不下去，做人做事的道理可以。', topic: '人生回望' },
  ];
  setIfAbsent(`cj_interview_transcript_${DEMO_ARCHIVE_ID}`, transcript);

  // 采访提纲（含每章话题）：采访页左侧「采访话题」、传记提纲页由此展示
  setIfAbsent(`cj_biography_outline_${DEMO_ARCHIVE_ID}`, {
    version: 1,
    status: 'confirmed',
    updatedAt: daysAgo(20),
    chapters: demoChapters.map((c, i) => ({
      id: `demo_oc_${i + 1}`,
      title: c.title,
      summary: '',
      eventTitles: demoChapterTopics[c.title] || [],
    })),
  });

  // ============ 需要触发才会出现的区块，直接补演示数据 ============
  const now = Date.now();
  const at = (daysAgoN: number) => new Date(now - daysAgoN * 86400000).toISOString();
  const loadList = <T,>(key: string): T[] => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  };

  // 第二份档案（王桂芬）：用于协作演示，不影响默认档案
  const archives = loadList<{ id: string }>('cj_archives');
  if (!archives.some((a) => a.id === 'demo_archive_wgf')) {
    archives.push({
      id: 'demo_archive_wgf',
      name: '王桂芬',
      gender: '女',
      birthYear: '1962',
      origin: '江苏省南京市',
      occupation: '教师',
      createdAt: at(15),
    } as never);
    try { localStorage.setItem('cj_archives', JSON.stringify(archives)); } catch { /* ignore */ }
  }

  // 第三份档案（周建国）：已完成并上架的演示作品，「我的传记」展示收益、稿件全状态与付费服务开通
  const ZJG_ID = 'demo_archive_zjg';
  if (!archives.some((a) => a.id === ZJG_ID)) {
    archives.push({
      id: ZJG_ID,
      name: '周建国',
      gender: '男',
      birthYear: '1966',
      origin: '湖北省黄冈市',
      occupation: '电工 · 家电维修',
      createdAt: at(30),
    } as never);
    try { localStorage.setItem('cj_archives', JSON.stringify(archives)); } catch { /* ignore */ }
  }
  const zjgChapters = [
    { title: '故里童年 · 初心萌芽', content: '<p>1966 年，我出生在湖北黄冈一个普通农村家庭。家里四个孩子，我排行老二。父亲年轻时做木工，母亲在家务农。</p><p>小时候家里条件不算好，放学以后我经常帮家里割草、喂猪、挑水。苦日子教会我的第一件事，就是自己的活要自己干好。</p>' },
    { title: '求学成长 · 岁月积淀', content: '<p>1973 年我开始上小学，成绩还不错，尤其喜欢数学。上初中后学校离家远，每天来回要走五六公里山路。</p><p>1982 年初中毕业，因为家里经济条件有限，我没有继续读高中，跟着叔叔学电工，从拉电线、装灯泡开始学起。</p>' },
    { title: '择业入行 · 缘起初心', content: '<p>1984 年，我进了县里一家机械厂当学徒，后来成为一名正式电工。工资虽然不高，但我很珍惜这份工作，经常跟着老师傅学习机器维修和线路检查。</p>' },
    { title: '深耕岁月 · 历练成长', content: '<p>下岗后，我在县城租了一个不到 20 平方米的小门面，开了一家电维修部。从修电视、冰箱、洗衣机做起，后来也卖插座、电线和灯具，还带了好几个徒弟。</p><p>2005 年，我用这些年攒下的钱在县城买了一套 90 多平方米的房子，一家人从农村搬到了县城。</p>' },
    { title: '风雨磨砺 · 破局成长', content: '<p>1996 年以后，机械厂经营越来越差，工资经常拖欠。1998 年，我正式下岗。在厂里干了十几年，一下子没了固定工作，心里挺迷茫的。</p><p>后来我想，与其一直等，不如靠自己学过的手艺挣钱。开店初期生意很一般，有时候一天也接不到几个活，但我修东西认真，生意慢慢就稳定下来了。</p>' },
    { title: '行业感悟 · 职业修为', content: '<p>做维修这么多年，我认准一个理：东西可以旧，手艺不能潮；活儿可以小，心思不能少。</p><p>后来家电越来越智能，年轻人东西坏了更愿意换新的。2018 年，我关掉了经营 20 年的维修店。关门那天，我一个人在店里坐了很久——那个小店陪了我 20 年，也靠它养大了两个孩子。</p>' },
    { title: '家风人生 · 温情生活', content: '<p>1987 年经亲戚介绍，我认识了李梅，相处一年后我们结了婚。1990 年大女儿周婷出生，1994 年小儿子周凯出生。</p><p>2008 年女儿考上武汉的大学，收到通知书那天我和她妈妈都特别高兴。那几年为了供孩子读书，家里能省的地方都省了。孩子们先后留在武汉工作，是我们最欣慰的事。</p>' },
    { title: '人生回望 · 未来愿景', content: '<p>退休后我和妻子搬到武汉，帮女儿照顾外孙。我开始养花，2020 年和邻居一起把小区里的荒地慢慢建成了小花园；2022 年物业请我照看公共绿化，没有工资，但我很愿意干。</p><p>我这一辈子没做过什么惊天动地的大事：当过电工，下过岗，开过维修店，养大了两个孩子。把眼前的事情认真做好，把家里人照顾好，在别人需要时帮上一点忙，我觉得就已经挺好了。</p>' },
  ];
  setIfAbsent(`cj_biography_${ZJG_ID}`, {
    title: '周建国传',
    author: 'AI 整理',
    createdAt: at(25),
    completedAt: at(7),
    status: 'final',
    chapters: zjgChapters,
  });
  // 上架信息（售价/试看）与付费服务开通状态（下载 PDF、生成二维码已开通）
  setIfAbsent(`cj_work_license_settings_${ZJG_ID}`, { isFree: false, price: 19.9, trialWords: 2000 });
  setIfAbsent(`cj_work_paid_${ZJG_ID}`, ['download', 'qrcode']);
  setIfAbsent(`cj_work_brief_${ZJG_ID}`, true);

  // 采访协作者：默认档案加妻子李晓如；王桂芬档案加"我"（演示账号即张明远，首页「我协助的传记」由此而来）
  const collabKey = (id: string) => `cj_interview_collaborators_${id}`;
  const defaultCollabs = loadList<{ name: string }>(collabKey(DEMO_ARCHIVE_ID));
  const collabSeeds = [
    { id: 'collab_demo_lxr', name: '李晓如', relation: '妻子', phone: '13900002222', joinedAt: at(10), status: 'active' },
    { id: 'collab_demo_zh', name: '张子涵', relation: '儿子', phone: '13800006666', joinedAt: at(9), status: 'active' },
  ];
  const collabMissing = collabSeeds.filter((c) => !defaultCollabs.some((d) => d.name === c.name));
  if (collabMissing.length > 0) {
    try { localStorage.setItem(collabKey(DEMO_ARCHIVE_ID), JSON.stringify([...defaultCollabs, ...collabMissing])); } catch { /* ignore */ }
  }
  const wgfCollabs = loadList<{ name: string }>(collabKey('demo_archive_wgf'));
  if (!wgfCollabs.some((c) => c.name === '张明远')) {
    wgfCollabs.push({ id: 'collab_demo_zmy', name: '张明远', relation: '同事', phone: '13800138003', joinedAt: at(8), status: 'active' } as never);
    try { localStorage.setItem(collabKey('demo_archive_wgf'), JSON.stringify(wgfCollabs)); } catch { /* ignore */ }
  }

  // 协作邀请：① 发给我的采访协助邀请（首页「协作邀请」）；② 我发出的待确认协助邀请（采访页）；③ 我发出的人物关系邀请（人生档案）
  const invites = loadList<{ id: string }>('cj_collab_invites');
  const inviteSeeds = [
    { id: 'ci_demo_1', kind: 'collab', scope: 'interview', archiveId: 'demo_archive_wgf', archiveName: '王桂芬', subjectName: '王桂芬', inviterName: '王建华', targetPhone: '13800138003', relation: '同事', status: 'pending', createdAt: at(1) },
    { id: 'ci_demo_2', kind: 'collab', scope: 'interview', archiveId: DEMO_ARCHIVE_ID, archiveName: '张明远', subjectName: '张明远', inviterName: '张明远', targetPhone: '13900004444', relation: '儿子', status: 'pending', createdAt: at(2) },
    { id: 'ci_demo_3', kind: 'relation', archiveId: DEMO_ARCHIVE_ID, archiveName: '张明远', subjectName: '张明远', inviterName: '张明远', targetPhone: '13900005555', relation: '女儿', status: 'pending', createdAt: at(2) },
    { id: 'ci_demo_4', kind: 'collab', scope: 'edit', archiveId: 'demo_archive_wgf', archiveName: '王桂芬', subjectName: '王桂芬', inviterName: '王建华', targetPhone: '13800138003', relation: '同事', status: 'pending', createdAt: at(0) },
  ];
  const inviteMissing = inviteSeeds.filter((s) => !invites.some((i) => i.id === s.id));
  if (inviteMissing.length > 0) {
    try { localStorage.setItem('cj_collab_invites', JSON.stringify([...invites, ...inviteMissing])); } catch { /* ignore */ }
  }

  // 用户邀请：演示账号（13800138003）已邀请 2 位好友（邀请页「我邀请的用户」）
  const registeredUsers = loadList<{ phone: string }>('cj_registered_users');
  const registeredSeeds = [
    { phone: '13800006666', name: '张子涵', inviteCode: 'ZZH2026', roles: ['user'] },
    { phone: '13800007777', name: '张雨桐', inviteCode: 'ZYT2026', roles: ['user'] },
  ];
  const registeredMissing = registeredSeeds.filter((s) => !registeredUsers.some((u) => u.phone === s.phone));
  if (registeredMissing.length > 0) {
    try { localStorage.setItem('cj_registered_users', JSON.stringify([...registeredUsers, ...registeredMissing])); } catch { /* ignore */ }
  }
  const userInvites = loadList<{ id: string }>('cj_user_invites');
  const userInviteSeeds = [
    { id: 'ui_demo_1', inviterUserId: '13800138003', inviteeUserId: '13800006666', createdAt: at(12) },
    { id: 'ui_demo_2', inviterUserId: '13800138003', inviteeUserId: '13800007777', createdAt: at(6) },
  ];
  const userInviteMissing = userInviteSeeds.filter((s) => !userInvites.some((i) => i.id === s.id));
  if (userInviteMissing.length > 0) {
    try { localStorage.setItem('cj_user_invites', JSON.stringify([...userInvites, ...userInviteMissing])); } catch { /* ignore */ }
  }

  // 待确认的新主题提议（采访页「待确认主题」入口）
  const proposalsKey = `cj_interview_topic_proposals_${DEMO_ARCHIVE_ID}`;
  const proposals = loadList<{ id: string }>(proposalsKey);
  if (!proposals.some((p) => p.id === 'tp_demo_1')) {
    proposals.push({
      id: 'tp_demo_1',
      archiveId: DEMO_ARCHIVE_ID,
      proposerId: 'collab_demo_lxr',
      proposerName: '李晓如',
      proposerPhone: '13900002222',
      proposerRelation: '妻子',
      topic: {
        id: 'topic_demo_military',
        title: '公益岁月',
        summary: '助学基金的缘起、资助的学生与回馈社会的故事。',
        questions: [
          { id: 'tp_demo_q1', text: '您是什么时候开始资助贫困学生的？当时的想法是什么？', mockAnswer: '2008 年开始的。企业做起来以后，总想着为家乡做点什么。' },
        ],
      },
      status: 'pending',
      createdAt: at(1),
    } as never);
    try { localStorage.setItem(proposalsKey, JSON.stringify(proposals)); } catch { /* ignore */ }
  }

  // 传记协作修改建议（AI 传记生成页「协助修改」弹窗；多条、不同状态，展示效果更完整）
  const sugKey = `cj_biography_suggestions_${DEMO_ARCHIVE_ID}`;
  const existingSugs = loadList<{ id: string }>(sugKey);
  const sugSeeds = [
    {
      id: 'sug_demo_1',
      chapterIndex: 0,
      chapterTitle: '故里童年 · 初心萌芽',
      sentenceIndex: 0,
      original: '1958 年 3 月，我出生在苏州的一条老巷里。',
      suggested: '1958 年 3 月，我出生在苏州平江路附近的一条老巷里。',
      note: '补充了具体位置，供参考',
      authorName: '李晓如',
      collaboratorId: 'collab_demo_lxr',
      authorPhone: '13900002222',
      status: 'pending',
      createdAt: at(1),
    },
    {
      id: 'sug_demo_2',
      chapterIndex: 4,
      chapterTitle: '风雨磨砺 · 破局成长',
      sentenceIndex: 1,
      original: '1994 年，一笔大额订单因精度问题险些被退回，那是我创业以来最大的坎。',
      suggested: '1994 年夏天，一笔大额订单因精度问题险些被退回，那是明远机械创办以来最凶险的一道坎。',
      note: '时间和主体写得更准确一些',
      authorName: '张子涵',
      collaboratorId: 'collab_demo_zh',
      authorPhone: '13800006666',
      status: 'pending',
      createdAt: at(0),
    },
    {
      id: 'sug_demo_3',
      chapterIndex: 6,
      chapterTitle: '家风人生 · 温情生活',
      sentenceIndex: 0,
      original: '1980 年，我和相恋多年的晓如结了婚。',
      suggested: '1980 年春天，我和相恋多年的晓如结了婚。',
      authorName: '李晓如',
      collaboratorId: 'collab_demo_lxr',
      authorPhone: '13900002222',
      status: 'accepted',
      createdAt: at(3),
      resolvedAt: at(2),
    },
  ];
  const sugMissing = sugSeeds.filter((s) => !existingSugs.some((e) => e.id === s.id));
  if (sugMissing.length > 0) {
    try { localStorage.setItem(sugKey, JSON.stringify([...existingSugs, ...sugMissing])); } catch { /* ignore */ }
  }

  // 传记修改邀请（协助修改弹窗「待对方同意」区）
  const editInviteSeed = { id: 'ci_demo_5', kind: 'collab', scope: 'edit', archiveId: DEMO_ARCHIVE_ID, archiveName: '张明远', subjectName: '张明远', inviterName: '张明远', targetPhone: '13800006666', relation: '儿子', status: 'pending', createdAt: at(1) };
  if (!invites.some((i) => i.id === editInviteSeed.id)) {
    try { localStorage.setItem('cj_collab_invites', JSON.stringify([...loadList('cj_collab_invites'), editInviteSeed])); } catch { /* ignore */ }
  }

  // AI 家风提炼：历史记录与已保存结果
  // 所有档案的旧框架章节数据统一迁移（章节草稿 / 大纲 / 成书快照）
  migrateLegacyBiographyData();

  setIfAbsent('cj_ai_refine_history', ['勤劳善良', '书香传家']);
  setIfAbsent('cj_ai_refine_saved', [
    {
      id: 'refine_demo_1',
      text: '以书传家，以德立身处世；勤勉为本，温良恭俭传家。',
      source: 'AI 家风提炼',
      time: at(5),
    },
  ]);

  // 拼团记录：演示账号（u_13800138003）一团已成团、一团进行中、一团失败待退款
  setIfAbsent('cj_mock_group_buy_records', [
    {
      id: 'gb_rec_demo_1',
      activityId: 'gb_activity_001',
      launcherId: 'u_13800138003',
      launcherPhone: '13800138003',
      currentCount: 6,
      targetCount: 6,
      status: 'success',
      endAt: at(2),
      members: [
        { id: 'gbm_d1', activityId: 'gb_activity_001', userId: 'u_13800138003', phone: '13800138003', orderId: 'ord_gb_demo_1', isLauncher: true, isFree: false, joinedAt: at(5) },
        { id: 'gbm_d2', activityId: 'gb_activity_001', userId: 'u_13800000001', phone: '13800000001', orderId: 'ord_gb_demo_2', isLauncher: false, isFree: true, refunded: true, joinedAt: at(5) },
        { id: 'gbm_d3', activityId: 'gb_activity_001', userId: 'u_13800000002', phone: '13800000002', orderId: 'ord_gb_demo_3', isLauncher: false, isFree: false, joinedAt: at(4) },
      ],
      createdAt: at(5),
    },
    {
      id: 'gb_rec_demo_2',
      activityId: 'gb_activity_001',
      launcherId: 'u_13800000003',
      launcherPhone: '13800000003',
      currentCount: 3,
      targetCount: 5,
      status: 'pending',
      endAt: new Date(now + 18 * 3600000).toISOString(),
      members: [
        { id: 'gbm_d4', activityId: 'gb_activity_001', userId: 'u_13800000003', phone: '13800000003', orderId: 'ord_gb_demo_4', isLauncher: true, isFree: false, joinedAt: at(0) },
        { id: 'gbm_d5', activityId: 'gb_activity_001', userId: 'u_13800138003', phone: '13800138003', orderId: 'ord_gb_demo_5', isLauncher: false, isFree: false, joinedAt: at(0) },
      ],
      createdAt: at(0),
    },
    {
      id: 'gb_rec_demo_3',
      activityId: 'gb_activity_001',
      launcherId: 'u_13800000004',
      launcherPhone: '13800000004',
      currentCount: 2,
      targetCount: 6,
      status: 'failed',
      endAt: at(6),
      members: [
        { id: 'gbm_d6', activityId: 'gb_activity_001', userId: 'u_13800000004', phone: '13800000004', orderId: 'ord_gb_demo_6', isLauncher: true, isFree: false, refunded: false, joinedAt: at(7) },
        { id: 'gbm_d7', activityId: 'gb_activity_001', userId: 'u_13800000005', phone: '13800000005', orderId: 'ord_gb_demo_7', isLauncher: false, isFree: false, refunded: false, joinedAt: at(7) },
      ],
      createdAt: at(7),
    },
  ]);

  // 订单：清掉旧收费模式（¥99「AI 传记标准版」）的历史订单，按新收费模式（下载/出版/二维码）补演示订单
  try {
    const ORDERS_KEY = 'cj_mock_orders';
    const rawOrders = localStorage.getItem(ORDERS_KEY);
    const orders = rawOrders ? (JSON.parse(rawOrders) as Array<Record<string, unknown>>) : [];
    const cleaned = orders.filter((o) => o.productId !== 'prod_biography_99');
    const currentRaw = localStorage.getItem('cj_mock_current_user');
    const currentUser = currentRaw ? (JSON.parse(currentRaw) as { id?: string }) : null;
    if (currentUser?.id && !cleaned.some((o) => typeof o.id === 'string' && o.id.startsWith('ord_demo_paid_'))) {
      const uid = currentUser.id;
      cleaned.push(
        { id: 'ord_demo_paid_1', userId: uid, type: 'biography', productId: 'download_default', productName: '张明远的传记 · 下载 PDF', amount: 9.9, quantity: 1, status: 'completed', payTime: at(6), createdAt: at(6), updatedAt: at(6), deliverables: [{ type: 'pdf', name: '张明远的传记.pdf', url: '#', createdAt: at(6) }] },
        { id: 'ord_demo_paid_2', userId: uid, type: 'book', productId: 'publish_default', productName: '张明远的传记 · 出版实体书', amount: 59, quantity: 1, status: 'delivering', payTime: at(3), createdAt: at(3), updatedAt: at(3), address: { name: '张明远', phone: '138****8003', province: '江苏省', city: '苏州市', district: '姑苏区', detail: '平江路 12 号' }, logistics: { company: '顺丰速运', trackingNo: 'SF20260908003', shippedAt: at(2) } },
        { id: 'ord_demo_paid_3', userId: uid, type: 'qrcode', productId: 'qrcode_default', productName: '张明远的传记 · 生成二维码', amount: 19.9, quantity: 1, status: 'completed', payTime: at(1), createdAt: at(1), updatedAt: at(1), deliverables: [{ type: 'qrcode', name: '家风纪念馆二维码', url: '#', createdAt: at(1) }] },
      );
    }
    localStorage.setItem(ORDERS_KEY, JSON.stringify(cleaned));
  } catch {
    // ignore
  }
}
