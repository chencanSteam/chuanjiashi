export interface Collaborator {
  id: string;
  name: string;
  relation: string;
  phone?: string;
  remark?: string;
  joinedAt: string;
  /** 移除仅撤销访问，保留历史采访和建议；旧数据无此字段时视为 active */
  status?: 'active' | 'removed';
  removedAt?: string;
}

export interface InterviewTranscriptLine {
  speaker: string;
  time: string;
  text: string;
  topicId?: string;
  questionId?: string;
  kind?: 'welcome' | 'question' | 'answer' | 'follow-up-question' | 'follow-up-answer' | 'system';
  createdAt?: string;
}

export function getInterviewTranscriptKey(archiveId: string, collaboratorId?: string) {
  return `cj_interview_transcript_${archiveId}${collaboratorId ? `_${collaboratorId}` : ''}`;
}

export function getInterviewSessionKey(archiveId: string, collaboratorId?: string) {
  return `cj_interview_session_${archiveId}${collaboratorId ? `_${collaboratorId}` : ''}`;
}

function isActiveCollaborator(collaborator: Collaborator) {
  return collaborator.status !== 'removed';
}

export function loadActiveCollaborators(archiveId: string): Collaborator[] {
  return loadCollaborators(archiveId).filter(isActiveCollaborator);
}

export function findCollaboratorForUser(archiveId: string, user: { phone?: string; name?: string } | null | undefined) {
  if (!user) return null;
  const list = loadActiveCollaborators(archiveId);
  return list.find((item) => user.phone && item.phone === user.phone)
    || list.find((item) => user.name && item.name === user.name)
    || null;
}

export function loadInterviewTranscript(archiveId: string, collaboratorId?: string): InterviewTranscriptLine[] {
  return loadJson<InterviewTranscriptLine[]>(getInterviewTranscriptKey(archiveId, collaboratorId), []);
}

export function loadAllCollaborators(archiveId: string): Collaborator[] {
  return loadCollaborators(archiveId);
}

export interface SupplementAnswer {
  respondentId: string;
  respondentName: string;
  relation: string;
  text: string;
  answeredAt: string;
  /** 本人可作废协助者的回答，作废后不作为传记参考 */
  invalid?: boolean;
}

export interface CollabInvite {
  id: string;
  /** collab=采访协作邀请；relation=人物关系邀请（同意后建立关系图谱中的关系） */
  kind: 'collab' | 'relation';
  /** kind=collab 时的协作范围：interview=邀请协助采访，edit=邀请协助修改传记 */
  scope?: 'interview' | 'edit';
  archiveId: string;
  archiveName: string;
  subjectName: string;
  inviterName: string;
  /** 被邀请账号的手机号（查找时可用身份证号定位账号） */
  targetPhone: string;
  relation: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

const COLLAB_INVITES_KEY = 'cj_collab_invites';

export function loadCollabInvites(): CollabInvite[] {
  return loadJson<CollabInvite[]>(COLLAB_INVITES_KEY, []);
}

function saveCollabInvites(list: CollabInvite[]) {
  saveJson(COLLAB_INVITES_KEY, list);
}

export function createCollabInvite(input: Omit<CollabInvite, 'id' | 'status' | 'createdAt'>): CollabInvite {
  const invite: CollabInvite = {
    ...input,
    id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  saveCollabInvites([invite, ...loadCollabInvites()]);
  return invite;
}

export function invitesForArchive(archiveId: string): CollabInvite[] {
  return loadCollabInvites().filter((i) => i.archiveId === archiveId);
}

// 当前账号（手机号）收到的待处理邀请
export function pendingInvitesForPhone(phone: string): CollabInvite[] {
  return loadCollabInvites().filter((i) => i.targetPhone === phone && i.status === 'pending');
}

// 撤销未处理的邀请
export function revokeCollabInvite(id: string) {
  saveCollabInvites(loadCollabInvites().filter((i) => i.id !== id));
}

// 被邀请人同意/拒绝；采访协作邀请同意后以其账号昵称（或实名姓名）加入协作者
// 人物关系邀请的关系建立由调用方处理（需写入关系图谱）
export function respondCollabInvite(id: string, accept: boolean, accepterName: string): CollabInvite | null {
  const list = loadCollabInvites();
  const invite = list.find((i) => i.id === id && i.status === 'pending');
  if (!invite) return null;
  invite.status = accept ? 'accepted' : 'rejected';
  saveCollabInvites(list);
  if (accept && invite.kind !== 'relation') {
    addCollaborator(invite.archiveId, { name: accepterName, relation: invite.relation, phone: invite.targetPhone });
  }
  return invite;
}

// 按手机号或身份证号查找账号（原型演示：任意输入均可查到样例账号）
export function findAccountByPhoneOrIdCard(keyword: string): { phone: string; name?: string } | null {
  const kw = keyword.trim();
  if (!kw) return null;
  // 手机号：优先带出该账号的实名信息，否则返回样例姓名
  if (/^1\d{10}$/.test(kw)) {
    try {
      const raw = localStorage.getItem(`cj_security_${kw}`);
      const sec = raw ? (JSON.parse(raw) as { realName?: string }) : {};
      return { phone: kw, name: sec.realName || '李秀英' };
    } catch {
      return { phone: kw, name: '李秀英' };
    }
  }
  // 身份证号：先在实名信息中匹配，匹配不到返回样例账号
  if (/^\d{17}[\dXx]$/.test(kw)) {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('cj_security_')) continue;
      try {
        const sec = JSON.parse(localStorage.getItem(key) || '{}') as { realName?: string; idCard?: string };
        if (sec.idCard && sec.idCard.toLowerCase() === kw.toLowerCase()) {
          return { phone: key.replace('cj_security_', ''), name: sec.realName };
        }
      } catch {
        // ignore
      }
    }
  }
  // 其他任意输入：返回样例账号（演示用）
  return { phone: '13900001111', name: '李秀英' };
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function getCollaboratorsKey(archiveId: string) {
  return `cj_interview_collaborators_${archiveId}`;
}

export function getSupplementKey(archiveId: string) {
  return `cj_interview_supplement_${archiveId}`;
}

export function loadCollaborators(archiveId: string): Collaborator[] {
  return loadJson<Collaborator[]>(getCollaboratorsKey(archiveId), []);
}

export function saveCollaborators(archiveId: string, collaborators: Collaborator[]) {
  saveJson(getCollaboratorsKey(archiveId), collaborators);
}

export function addCollaborator(archiveId: string, collaborator: Omit<Collaborator, 'id' | 'joinedAt'>): Collaborator {
  const list = loadCollaborators(archiveId);
  const next: Collaborator = {
    ...collaborator,
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    joinedAt: new Date().toISOString(),
  };
  saveCollaborators(archiveId, [next, ...list]);
  return next;
}

export function removeCollaborator(archiveId: string, id: string) {
  const list = loadCollaborators(archiveId).map((collaborator) =>
    collaborator.id === id
      ? { ...collaborator, status: 'removed' as const, removedAt: new Date().toISOString() }
      : collaborator
  );
  saveCollaborators(archiveId, list);
}

export function loadSupplementAnswers(archiveId: string): Record<string, SupplementAnswer[]> {
  return loadJson<Record<string, SupplementAnswer[]>>(getSupplementKey(archiveId), {});
}

export function saveSupplementAnswers(archiveId: string, answers: Record<string, SupplementAnswer[]>) {
  saveJson(getSupplementKey(archiveId), answers);
}

export function addSupplementAnswer(
  archiveId: string,
  questionId: string,
  answer: Omit<SupplementAnswer, 'answeredAt'>
) {
  const all = loadSupplementAnswers(archiveId);
  const list = all[questionId] || [];
  const existingIndex = list.findIndex((a) => a.respondentId === answer.respondentId);
  // 重新回答时保留作废标记
  const prevInvalid = existingIndex >= 0 ? list[existingIndex].invalid : undefined;
  const fullAnswer: SupplementAnswer = { ...answer, answeredAt: new Date().toISOString(), invalid: prevInvalid };
  if (existingIndex >= 0) {
    list[existingIndex] = fullAnswer;
  } else {
    list.push(fullAnswer);
  }
  saveSupplementAnswers(archiveId, { ...all, [questionId]: list });
  return fullAnswer;
}

// 作废/恢复某位协助者在某问题上的回答；作废后不作为传记参考
export function setSupplementInvalid(archiveId: string, questionId: string, respondentId: string, invalid: boolean) {
  const all = loadSupplementAnswers(archiveId);
  const list = all[questionId] || [];
  const index = list.findIndex((a) => a.respondentId === respondentId);
  if (index < 0) return;
  list[index] = { ...list[index], invalid };
  saveSupplementAnswers(archiveId, { ...all, [questionId]: list });
}


export function getCollaboratorAnswerCounts(
  archiveId: string,
  collaborators: Collaborator[]
): Record<string, number> {
  const all = loadSupplementAnswers(archiveId);
  const counts: Record<string, number> = {};
  collaborators.forEach((c) => {
    counts[c.id] = 0;
  });
  Object.values(all).forEach((list) => {
    list.forEach((a) => {
      if (counts[a.respondentId] !== undefined) {
        counts[a.respondentId] += 1;
      }
    });
  });
  return counts;
}

export interface CollaboratingArchive {
  archiveId: string;
  archiveName: string;
  relation: string;
  /** 是否有正式邀请记录（否则为通用的协作身份） */
  invited: boolean;
}

// 当前账号在协作者名单中的档案 → 以协作身份参与；不在名单中的档案均为本账号创建（创建者）
export function findCollaboratingArchives(userName: string): CollaboratingArchive[] {
  const archives = loadJson<{ id: string; name: string }[]>('cj_archives', []);
  return archives
    .map((a) => {
      const collab = loadCollaborators(a.id).find((c) => c.name === userName);
      if (!collab) return null;
      return {
        archiveId: a.id,
        archiveName: a.name,
        relation: collab.relation || '协作人',
        invited: true,
      };
    })
    .filter((a): a is CollaboratingArchive => a !== null);
}
