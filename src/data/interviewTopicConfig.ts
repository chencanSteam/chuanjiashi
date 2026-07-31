import { interviewTopics } from '../data/aiMock';

export interface InterviewTopicConfig {
  id: string;
  title: string;
  summary: string;
  enabled: boolean;
  order: number;
  /** 内置预设主题（有固定题库）；false 为后台新增，采访问题由 AI 按主题名生成 */
  builtin: boolean;
}

const CONFIG_KEY = 'cj_interview_topic_config';

function seed(): InterviewTopicConfig[] {
  return interviewTopics.map((t, i) => ({
    id: t.id,
    title: t.title,
    summary: t.summary,
    enabled: true,
    order: i + 1,
    builtin: true,
  }));
}

export function loadTopicConfig(): InterviewTopicConfig[] {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const list = JSON.parse(raw) as InterviewTopicConfig[];
      if (Array.isArray(list) && list.length > 0) {
        return list.sort((a, b) => a.order - b.order);
      }
    }
  } catch {
    // ignore
  }
  const initial = seed();
  saveTopicConfig(initial);
  return initial;
}

export function saveTopicConfig(list: InterviewTopicConfig[]) {
  try {
    // 编号按当前列表顺序重排，保持连续，不留空号
    const resequenced = list.map((t, i) => ({ ...t, order: i + 1 }));
    localStorage.setItem(CONFIG_KEY, JSON.stringify(resequenced));
  } catch {
    // ignore
  }
}

export function createTopic(input: { title: string; summary?: string }): InterviewTopicConfig {
  const list = loadTopicConfig();
  const topic: InterviewTopicConfig = {
    id: `admin_${Date.now()}`,
    title: input.title.trim(),
    summary: (input.summary || '').trim(),
    enabled: true,
    order: Math.max(0, ...list.map((t) => t.order)) + 1,
    builtin: false,
  };
  saveTopicConfig([...list, topic]);
  return topic;
}

export function updateTopic(id: string, data: Partial<Omit<InterviewTopicConfig, 'id' | 'builtin'>>) {
  const list = loadTopicConfig().map((t) => (t.id === id ? { ...t, ...data } : t));
  saveTopicConfig(list);
}

export function removeTopic(id: string) {
  saveTopicConfig(loadTopicConfig().filter((t) => t.id !== id));
}
