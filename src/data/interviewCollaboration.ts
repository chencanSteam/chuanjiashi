export interface Collaborator {
  id: string;
  name: string;
  relation: string;
  phone?: string;
  remark?: string;
  joinedAt: string;
}

export interface SupplementAnswer {
  respondentId: string;
  respondentName: string;
  relation: string;
  text: string;
  answeredAt: string;
}

export interface InterviewInvite {
  code: string;
  relation: string;
  remark: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  acceptedBy?: string;
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

export function getInvitesKey(archiveId: string) {
  return `cj_interview_invites_${archiveId}`;
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
  const list = loadCollaborators(archiveId).filter((c) => c.id !== id);
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
  const fullAnswer: SupplementAnswer = { ...answer, answeredAt: new Date().toISOString() };
  if (existingIndex >= 0) {
    list[existingIndex] = fullAnswer;
  } else {
    list.push(fullAnswer);
  }
  saveSupplementAnswers(archiveId, { ...all, [questionId]: list });
  return fullAnswer;
}

export function loadInvites(archiveId: string): InterviewInvite[] {
  return loadJson<InterviewInvite[]>(getInvitesKey(archiveId), []);
}

export function saveInvites(archiveId: string, invites: InterviewInvite[]) {
  saveJson(getInvitesKey(archiveId), invites);
}

export function createInvite(archiveId: string, relation: string, remark: string): InterviewInvite {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const invite: InterviewInvite = {
    code,
    relation,
    remark,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  const list = loadInvites(archiveId);
  saveInvites(archiveId, [invite, ...list]);
  return invite;
}

export function acceptInvite(archiveId: string, code: string, name: string): Collaborator | null {
  const invites = loadInvites(archiveId);
  const invite = invites.find((i) => i.code === code && i.status === 'pending');
  if (!invite) return null;

  const collaborator = addCollaborator(archiveId, {
    name,
    relation: invite.relation,
    remark: invite.remark,
  });

  saveInvites(
    archiveId,
    invites.map((i) => (i.code === code ? { ...i, status: 'accepted' as const, acceptedBy: collaborator.id } : i))
  );
  return collaborator;
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
