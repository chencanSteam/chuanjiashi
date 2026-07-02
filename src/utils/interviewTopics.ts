import { interviewTopics, type InterviewTopic } from '../data/aiMock';

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
  const topic: InterviewTopic = {
    id,
    title: input.title.trim(),
    summary: (input.summary || '').trim(),
    questions: [
      {
        id: `${id}_q1`,
        text: `请谈谈您的${input.title.trim()}经历。`,
        mockAnswer: '',
      },
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

export function generateInterviewTopics(
  archive: ArchiveInfo | null,
  archiveId?: string
): InterviewTopic[] {
  if (!archive) return interviewTopics;

  const age = getAge(archive.birthYear);
  const occupation = (archive.occupation || '').toLowerCase();

  const allTopics = interviewTopics.map((t) => personalizeTopic(t, archive));
  const result: InterviewTopic[] = [];

  // 童年：几乎所有人都有
  result.push(allTopics.find((t) => t.id === 'childhood')!);

  // 求学：年龄达到学龄后
  if (age >= 7) {
    result.push(allTopics.find((t) => t.id === 'school')!);
  }

  // 工作：成年后
  if (age >= 20) {
    const workTopic = allTopics.find((t) => t.id === 'work')!;
    result.push({
      ...workTopic,
      questions: workTopic.questions.map((q) => ({
        ...q,
        text: q.text.replace(/您毕业后/g, `您从${archive.origin || '家乡'}走出来后`),
      })),
    });
  }

  // 婚姻家庭：成家立业的年龄
  if (age >= 25) {
    result.push(allTopics.find((t) => t.id === 'family')!);
  }

  // 创业：职业相关或年龄较大
  const startupKeywords = ['创业', '老板', '企业家', '个体', '经商', '生意', '公司', '厂长'];
  const hasStartup = startupKeywords.some((k) => occupation.includes(k));
  if (hasStartup && age >= 30) {
    const startupTopic = allTopics.find((t) => t.id === 'startup')!;
    result.push({
      ...startupTopic,
      questions: startupTopic.questions.map((q) => ({
        ...q,
        text: q.text.replace(
          /为什么选择创业/g,
          `作为一名${archive.occupation || '从业者'}，您为什么选择创业`
        ),
      })),
    });
  }

  // 人生感悟：年长者
  if (age >= 55) {
    result.push(allTopics.find((t) => t.id === 'reflection')!);
  }

  // 如果基本信息无法推断出足够主题，至少保留默认主题（除创业外）
  if (result.length < 3) {
    ['school', 'work', 'family', 'reflection'].forEach((id) => {
      const topic = allTopics.find((t) => t.id === id);
      if (topic && !result.some((t) => t.id === id)) {
        result.push(topic);
      }
    });
  }

  // 根据人生标签生成针对性主题
  result.push(...tagBasedTopics(archive));

  // 追加用户自定义主题
  if (archiveId) {
    result.push(...loadCustomTopics(archiveId));
  }

  return result;
}
