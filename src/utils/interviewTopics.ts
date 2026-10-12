import { interviewTopics, type InterviewTopic } from '../data/aiMock';
import { loadTopicConfig } from '../data/interviewTopicConfig';
import { loadImportedBiography } from './importedBiography';

import type { Collaborator } from '../data/interviewCollaboration';

interface ArchiveInfo {
  name: string;
  gender?: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
}

export interface InterviewTopicProposal {
  id: string;
  archiveId: string;
  proposerId: string;
  proposerName: string;
  proposerPhone?: string;
  proposerRelation: string;
  topic: InterviewTopic;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  createdAt: string;
  reviewedAt?: string;
  reviewerName?: string;
  rejectionReason?: string;
}

const topicProposalsKey = (archiveId: string) => `cj_interview_topic_proposals_${archiveId}`;

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
const removedKey = (archiveId: string) => `cj_interview_removed_topics_${archiveId}`;

// 按档案记录用户删除的主题（预设/标签/自定义主题都可删除）
export function loadRemovedTopics(archiveId: string): string[] {
  try {
    const raw = localStorage.getItem(removedKey(archiveId));
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // ignore
  }
  return [];
}

export function removeTopicForArchive(archiveId: string, topicId: string) {
  const removed = loadRemovedTopics(archiveId);
  if (!removed.includes(topicId)) {
    try {
      localStorage.setItem(removedKey(archiveId), JSON.stringify([...removed, topicId]));
    } catch {
      // ignore
    }
  }
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

function buildCustomTopic(input: { title: string; summary?: string }, id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`): InterviewTopic {
  const title = input.title.trim();
  return {
    id,
    title,
    summary: (input.summary || '').trim(),
    questions: [
      { id: `${id}_q1`, text: `请谈谈您的${title}经历，它是怎么开始的？`, mockAnswer: '' },
      { id: `${id}_q2`, text: `在${title}的过程中，有没有让您特别难忘的人或事？`, mockAnswer: '' },
      { id: `${id}_q3`, text: `${title}这段经历对您后来的生活或想法有什么影响？`, mockAnswer: '' },
    ],
  };
}

export function saveCustomTopic(archiveId: string, input: { title: string; summary?: string }): InterviewTopic {
  const topic = buildCustomTopic(input);
  const existing = loadCustomTopics(archiveId);
  localStorage.setItem(customTopicsKey(archiveId), JSON.stringify([...existing, topic]));
  return topic;
}

export function loadTopicProposals(archiveId: string): InterviewTopicProposal[] {
  try {
    const raw = localStorage.getItem(topicProposalsKey(archiveId));
    return raw ? JSON.parse(raw) as InterviewTopicProposal[] : [];
  } catch {
    return [];
  }
}

export function submitTopicProposal(
  archiveId: string,
  proposer: Pick<Collaborator, 'id' | 'name' | 'phone' | 'relation'>,
  input: { title: string; summary?: string }
): InterviewTopicProposal {
  const title = input.title.trim();
  const existing = loadTopicProposals(archiveId);
  const duplicate = existing.find((p) => p.status === 'pending' && p.proposerId === proposer.id && p.topic.title === title);
  if (duplicate) return duplicate;
  const proposal: InterviewTopicProposal = {
    id: `proposal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    archiveId,
    proposerId: proposer.id,
    proposerName: proposer.name,
    proposerPhone: proposer.phone,
    proposerRelation: proposer.relation,
    topic: buildCustomTopic({ title, summary: input.summary }, `custom_collab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(topicProposalsKey(archiveId), JSON.stringify([proposal, ...existing]));
  return proposal;
}

export function reviewTopicProposal(
  archiveId: string,
  proposalId: string,
  decision: 'approved' | 'rejected',
  reviewer: { name: string; phone?: string },
  rejectionReason?: string
): InterviewTopicProposal | null {
  const proposals = loadTopicProposals(archiveId);
  const proposal = proposals.find((item) => item.id === proposalId);
  if (!proposal || proposal.status !== 'pending') return proposal || null;
  if (decision === 'approved') {
    const official = loadCustomTopics(archiveId);
    if (!official.some((topic) => topic.id === proposal.topic.id)) {
      localStorage.setItem(customTopicsKey(archiveId), JSON.stringify([...official, proposal.topic]));
    }
  }
  proposal.status = decision;
  proposal.reviewedAt = new Date().toISOString();
  proposal.reviewerName = reviewer.name;
  proposal.rejectionReason = decision === 'rejected' ? rejectionReason?.trim() || undefined : undefined;
  localStorage.setItem(topicProposalsKey(archiveId), JSON.stringify(proposals));
  return proposal;
}

export function withdrawTopicProposal(archiveId: string, proposalId: string, proposerId: string): boolean {
  const proposals = loadTopicProposals(archiveId);
  const proposal = proposals.find((item) => item.id === proposalId && item.proposerId === proposerId && item.status === 'pending');
  if (!proposal) return false;
  proposal.status = 'withdrawn';
  localStorage.setItem(topicProposalsKey(archiveId), JSON.stringify(proposals));
  return true;
}

export function getPendingTopicProposalCount(archiveId: string): number {
  return loadTopicProposals(archiveId).filter((item) => item.status === 'pending').length;
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
  archiveId?: string
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

  // 采访问题由 AI 根据主题名称生成
  const withQuestions = result.map((t) => ({ ...t, questions: aiGeneratedQuestions(t.id, t.title) }));

  // 追加用户自定义主题（AI 按主题名生成问题）
  if (archiveId) {
    withQuestions.push(...loadCustomTopics(archiveId));
  }

  // 「已有传记上传」的素材：围绕原文追加补充采访主题
  if (archiveId) {
    const imported = loadImportedBiography(archiveId);
    if (imported) {
      const excerpt = imported.text.replace(/\s+/g, ' ').slice(0, 60);
      withQuestions.push({
        id: 'imported_biography',
        title: '已有传记 · 细节补充',
        summary: `已读取上传的《${imported.fileName}》，围绕原文继续补充采访。`,
        questions: [
          { id: 'imported_biography_q1', text: `已有传记中提到"${excerpt}…"，这段经历能展开讲讲吗？`, mockAnswer: '' },
          { id: 'imported_biography_q2', text: '这本已有传记里，哪些部分您觉得还不够详细，希望补充？', mockAnswer: '' },
          { id: 'imported_biography_q3', text: '除了已经写下的内容，还有哪些人生故事没有记录进去？', mockAnswer: '' },
        ],
      });
    }
  }

  // 过滤用户已删除的主题（预设/自定义统一生效）
  if (archiveId) {
    const removed = new Set(loadRemovedTopics(archiveId));
    return withQuestions.filter((t) => !removed.has(t.id));
  }

  return withQuestions;
}
