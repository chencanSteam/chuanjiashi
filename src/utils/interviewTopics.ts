import { interviewTopics, interviewQuestionBank, type InterviewTopic, type InterviewQuestion } from '../data/aiMock';
import { loadTopicConfig } from '../data/interviewTopicConfig';

interface ArchiveInfo {
  name: string;
  gender?: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
  tags?: string[];
}

function getAge(birthYear: string): number {
  const year = Number(birthYear);
  if (!year || year < 1900 || year > new Date().getFullYear()) return 0;
  return new Date().getFullYear() - year;
}

function replacePlaceholders(text: string, archive: ArchiveInfo): string {
  return text
    .replace(/张明远/g, archive.name || '受访者')
    .replace(/江苏苏州/g, archive.origin || '家乡')
    .replace(/南京/g, archive.origin || '当地')
    .replace(/机械/g, archive.occupation || '本行业')
    .replace(/工程师/g, archive.occupation || '从业者');
}

function personalizeTopic(topic: InterviewTopic, archive: ArchiveInfo): InterviewTopic {
  return {
    ...topic,
    summary: replacePlaceholders(topic.summary, archive),
    questions: topic.questions.map((q) => ({
      ...q,
      text: replacePlaceholders(q.text, archive),
      mockAnswer: replacePlaceholders(q.mockAnswer, archive),
    })),
  };
}

const customTopicsKey = (archiveId: string) => `cj_interview_custom_topics_${archiveId}`;
const drawnKey = (archiveId: string) => `cj_interview_drawn_${archiveId}`;

function loadDrawn(archiveId: string): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(drawnKey(archiveId));
    if (raw) return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    // ignore
  }
  return {};
}

// 每个主题从题库（自带 3 题 + 扩展题库）随机抽 3 题；抽取结果按 drawKey 持久化，刷新不变
// drawKey 按回答者区分：本人与每位协助者各自独立抽题（问题由 AI 按各自回答生成，互不相同）
function drawTopicQuestions(topic: InterviewTopic, archive: ArchiveInfo, drawKey?: string): InterviewTopic {
  const extra = interviewQuestionBank[topic.id] || [];
  if (extra.length === 0) return topic;
  const pool: InterviewQuestion[] = [...topic.questions, ...extra].map((q) => ({
    ...q,
    text: replacePlaceholders(q.text, archive),
    mockAnswer: replacePlaceholders(q.mockAnswer, archive),
  }));
  if (!drawKey) return { ...topic, questions: pool.slice(0, 3) };

  const stored = loadDrawn(drawKey);
  let ids = stored[topic.id];
  if (!ids || ids.some((id) => !pool.some((q) => q.id === id))) {
    ids = [...pool].sort(() => Math.random() - 0.5).slice(0, 3).map((q) => q.id);
    try {
      localStorage.setItem(drawnKey(drawKey), JSON.stringify({ ...stored, [topic.id]: ids }));
    } catch {
      // ignore
    }
  }
  return { ...topic, questions: ids.map((id) => pool.find((q) => q.id === id)!) };
}

export function loadCustomTopics(archiveId: string): InterviewTopic[] {
  try {
    const raw = localStorage.getItem(customTopicsKey(archiveId));
    if (raw) return JSON.parse(raw) as InterviewTopic[];
  } catch {
    // ignore
  }
  return [];
}

export function saveCustomTopic(archiveId: string, input: { title: string; summary?: string }): InterviewTopic {
  const existing = loadCustomTopics(archiveId);
  const id = `custom_${Date.now()}`;
  const title = input.title.trim();
  // 自定义主题没有预设题库，由 AI 根据主题名称生成开场问题
  const topic: InterviewTopic = {
    id,
    title,
    summary: (input.summary || '').trim(),
    questions: [
      { id: `${id}_q1`, text: `请谈谈您的${title}经历，它是怎么开始的？`, mockAnswer: '' },
      { id: `${id}_q2`, text: `在${title}的过程中，有没有让您特别难忘的人或事？`, mockAnswer: '' },
      { id: `${id}_q3`, text: `${title}这段经历对您后来的生活或想法有什么影响？`, mockAnswer: '' },
    ],
  };
  localStorage.setItem(customTopicsKey(archiveId), JSON.stringify([...existing, topic]));
  return topic;
}

export function deleteCustomTopic(archiveId: string, topicId: string) {
  try {
    const existing = loadCustomTopics(archiveId);
    localStorage.setItem(
      customTopicsKey(archiveId),
      JSON.stringify(existing.filter((t) => t.id !== topicId))
    );
  } catch {
    // ignore
  }
}

// 根据人生标签生成针对性问题
function tagBasedTopics(archive: ArchiveInfo): InterviewTopic[] {
  const tags = (archive.tags || []).map((t) => t.trim()).filter(Boolean);
  const result: InterviewTopic[] = [];

  const questionMap: Record<string, { title: string; summary: string; questions: string[] }> = {
    '参军入伍': {
      title: '军旅生涯',
      summary: '参军动机、部队生活与战友情谊。',
      questions: [
        `您当年为什么决定参军？家人支持吗？`,
        `部队里让您印象最深刻的一次任务或训练是什么？`,
        `退伍后，军旅生活对您的人生有什么影响？`,
      ],
    },
    '出国留学': {
      title: '海外求学',
      summary: '出国动机、异国生活与学成归来。',
      questions: [
        `您当初为什么选择出国留学？`,
        `在国外生活学习时，最不适应和最难忘的是什么？`,
        `这段经历对您的观念和人生选择有什么影响？`,
      ],
    },
    '下海创业': {
      title: '创业之路',
      summary: '创业契机、艰难时刻与事业成就。',
      questions: [
        `作为一名${archive.occupation || '创业者'}，您为什么选择下海创业？`,
        `创业过程中遇到的最大困难是什么？是怎么挺过来的？`,
        `如果让您总结创业成功的关键，您觉得是什么？`,
      ],
    },
    '调岗转行': {
      title: '职业转折',
      summary: '工作变动、重新选择与适应过程。',
      questions: [
        `您职业生涯中有没有一次重要的转行或调岗？`,
        `面对新的岗位，您是怎么快速适应的？`,
        `这次转折对您后来的发展有什么影响？`,
      ],
    },
    '结婚生子': {
      title: '婚姻家庭',
      summary: '伴侣相识、家庭组建与相处之道。',
      questions: [
        `您和伴侣是怎么相识的？第一印象是什么？`,
        `组建家庭后，您觉得生活中最大的变化是什么？`,
        `夫妻俩相处多年，您最想分享的一点心得是什么？`,
      ],
    },
    '养育子女': {
      title: '养育子女',
      summary: '子女教育、代际传承与家庭故事。',
      questions: [
        `在养育子女的过程中，您最重视培养他们哪些品质？`,
        `您的教育方式受自己父母影响大吗？`,
        `看着子女长大，您最欣慰和最操心的是什么？`,
      ],
    },
    '退休生活': {
      title: '退休生活',
      summary: '退休后的日常、爱好与心态转变。',
      questions: [
        `退休后您的生活节奏有什么变化？`,
        `您培养了哪些新的兴趣爱好？`,
        `对于即将退休或已经退休的朋友，您有什么建议？`,
      ],
    },
    '疾病康复': {
      title: '健康与康复',
      summary: '面对疾病、康复经历与人生感悟。',
      questions: [
        `您有没有经历过比较严重的健康问题？当时是什么情况？`,
        `康复过程中，家人和医生给了您哪些支持？`,
        `那次经历让您对生活和健康有了什么新的认识？`,
      ],
    },
    '书法绘画': {
      title: '书法绘画',
      summary: '艺术爱好的缘起、练习与作品故事。',
      questions: [
        `您是怎么喜欢上书法绘画的？`,
        `练习过程中有没有遇到过瓶颈？是怎么坚持的？`,
        `有没有一幅作品让您特别难忘？背后有什么故事？`,
      ],
    },
    '音乐戏曲': {
      title: '音乐戏曲',
      summary: '音乐戏曲爱好的由来与难忘经历。',
      questions: [
        `您喜欢哪种音乐或戏曲？是怎么接触上的？`,
        `有没有一场演出或一位艺术家让您印象特别深？`,
        `这个爱好在您生活中扮演着什么角色？`,
      ],
    },
    '旅游摄影': {
      title: '旅游摄影',
      summary: '旅行见闻、摄影记录与难忘风景。',
      questions: [
        `您去过哪些地方旅行？最难忘的是哪一次？`,
        `您是从什么时候开始喜欢摄影的？`,
        `有没有一张照片背后有特别的故事？`,
      ],
    },
    '钓鱼养花': {
      title: '钓鱼养花',
      summary: '休闲爱好中的乐趣与心得。',
      questions: [
        `您是怎么喜欢上钓鱼或养花的？`,
        `在这个过程中，您最大的乐趣是什么？`,
        `有没有一次特别难忘的垂钓或养花经历？`,
      ],
    },
    '体育运动': {
      title: '体育运动',
      summary: '运动习惯、坚持与比赛经历。',
      questions: [
        `您平时喜欢什么运动？坚持多久了？`,
        `运动给您的生活带来了哪些改变？`,
        `有没有参加过什么比赛或活动？`,
      ],
    },
    '宗教信仰': {
      title: '宗教信仰',
      summary: '信仰的由来、修行与心灵寄托。',
      questions: [
        `您是从什么时候开始有宗教信仰的？`,
        `信仰对您的人生观和处事方式有什么影响？`,
        `有没有什么特别的修行或仪式让您印象深刻？`,
      ],
    },
    '家乡迁徙': {
      title: '家乡迁徙',
      summary: '离开家乡、适应新环境与乡愁。',
      questions: [
        `您为什么离开${archive.origin || '家乡'}？当时是怎么决定的？`,
        `刚到新环境时，最不适应的是什么？`,
        `这么多年过去，您最想念家乡的什么？`,
      ],
    },
    '求学深造': {
      title: '求学深造',
      summary: '继续学习、深造经历与知识追求。',
      questions: [
        `您为什么选择在学业上继续深造？`,
        `深造期间哪位老师或哪门课对您影响最大？`,
        `这段学习经历对您后来的发展有什么帮助？`,
      ],
    },
  };

  tags.forEach((tag) => {
    const config = questionMap[tag];
    if (!config) return;
    result.push({
      id: `tag_${tag}`,
      title: config.title,
      summary: config.summary,
      questions: config.questions.map((text, i) => ({
        id: `tag_${tag}_q${i + 1}`,
        text,
        mockAnswer: '',
      })),
    });
  });

  return result;
}

// 后台新增主题（无固定题库）：AI 按主题名生成开场问题
function aiGeneratedQuestions(topicId: string, title: string) {
  return [
    { id: `${topicId}_q1`, text: `请谈谈您的${title}经历，它是怎么开始的？`, mockAnswer: '' },
    { id: `${topicId}_q2`, text: `在${title}的过程中，有没有让您特别难忘的人或事？`, mockAnswer: '' },
    { id: `${topicId}_q3`, text: `${title}这段经历对您后来的生活或想法有什么影响？`, mockAnswer: '' },
  ];
}

export function generateInterviewTopics(
  archive: ArchiveInfo | null,
  archiveId?: string,
  drawKey?: string
): InterviewTopic[] {
  if (!archive) return interviewTopics;

  const age = getAge(archive.birthYear);
  const occupation = (archive.occupation || '').toLowerCase();
  const startupKeywords = ['创业', '老板', '企业家', '个体', '经商', '生意', '公司', '厂长'];
  const hasStartup = startupKeywords.some((k) => occupation.includes(k));

  const allTopics = interviewTopics.map((t) => personalizeTopic(t, archive));
  const presetById = new Map(allTopics.map((t) => [t.id, t]));

  // 预设主题的适用条件（按年龄/职业推断）
  const meetsRule = (id: string): boolean => {
    switch (id) {
      case 'school':
        return age >= 7;
      case 'work':
        return age >= 20;
      case 'family':
        return age >= 25;
      case 'startup':
        return hasStartup && age >= 30;
      case 'reflection':
        return age >= 55;
      default:
        return true;
    }
  };

  // 主题来源：后台「采访主题」配置（启用 + 排序），预设主题沿用固定题库，新增主题由 AI 出题
  const result: InterviewTopic[] = [];
  const config = loadTopicConfig().filter((t) => t.enabled);
  config.forEach((cfg) => {
    const preset = presetById.get(cfg.id);
    if (preset) {
      if (!meetsRule(cfg.id)) return;
      let topic: InterviewTopic = { ...preset, title: cfg.title || preset.title, summary: cfg.summary || preset.summary };
      if (cfg.id === 'work') {
        topic = {
          ...topic,
          questions: topic.questions.map((q) => ({
            ...q,
            text: q.text.replace(/您毕业后/g, `您从${archive.origin || '家乡'}走出来后`),
          })),
        };
      }
      if (cfg.id === 'startup') {
        topic = {
          ...topic,
          questions: topic.questions.map((q) => ({
            ...q,
            text: q.text.replace(
              /为什么选择创业/g,
              `作为一名${archive.occupation || '从业者'}，您为什么选择创业`
            ),
          })),
        };
      }
      result.push(topic);
    } else {
      result.push({ id: cfg.id, title: cfg.title, summary: cfg.summary, questions: aiGeneratedQuestions(cfg.id, cfg.title) });
    }
  });

  // 如果配置/推断出的主题太少，用预设主题补齐（跳过已停用的）
  if (result.length < 3) {
    const disabledIds = new Set(loadTopicConfig().filter((t) => !t.enabled).map((t) => t.id));
    ['school', 'work', 'family', 'reflection'].forEach((id) => {
      const topic = presetById.get(id);
      if (topic && !disabledIds.has(id) && !result.some((t) => t.id === id)) {
        result.push(topic);
      }
    });
  }

  // 根据人生标签生成针对性主题
  result.push(...tagBasedTopics(archive));

  // 每个主题从题库随机抽 3 题作为采访开场（按回答者各自的 drawKey 独立抽取）
  const drawn = result.map((t) => drawTopicQuestions(t, archive, drawKey ?? archiveId));

  // 追加用户自定义主题（无题库，AI 按主题名生成问题）
  if (archiveId) {
    drawn.push(...loadCustomTopics(archiveId));
  }

  return drawn;
}
