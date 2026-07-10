import { useEffect, useMemo, useRef, useState, useReducer } from 'react';
import {
  Mic,
  ChevronRight,
  SkipForward,
  Save,
  Sparkles,
  MessageSquarePlus,
  FolderOpen,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Type,
  Video,
  Square,
  StopCircle,
  RefreshCw,
  Plus,
  X,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import { interviewApi } from '../api/interview';
import { quotaApi } from '../api/quota';
import {
  loadCollaborators,
  saveCollaborators,
  addCollaborator,
  removeCollaborator,
  loadSupplementAnswers,
  saveSupplementAnswers,
  addSupplementAnswer,
  getCollaboratorAnswerCounts,
  type Collaborator,
  type SupplementAnswer,
} from '../data/interviewCollaboration';
import { relationTypeOptions, getRelationCategory, invertRelation } from '../utils/familyRelations';
import { familyApi } from '../api/family';
import type { FamilyMember, FamilyRelation } from '../mocks/types';
import {
  followUpQuestionsPool,
  buildReviewData,
  type AIQuota,
} from '../data/aiMock';
import { generateInterviewTopics, saveCustomTopic } from '../utils/interviewTopics';
import { syncReviewEventToTimeline } from '../utils/eventSync';
import './AIInterview.css';

interface Archive {
  id: string;
  name: string;
  gender?: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
  tags?: string[];
}

interface TranscriptLine {
  speaker: string;
  time: string;
  text: string;
}

interface VideoRecording {
  seconds: number;
  recordedAt: string;
  transcript: string;
}

interface InterviewSession {
  currentTopicIndex: number;
  currentQuestionIndex: number;
  answeredIds: string[];
  skippedIds: string[];
  followUps: Record<string, { question: string; userAnswer?: string; answered: boolean }[]>;
}

interface RespondentInfo {
  id: 'subject' | string;
  name: string;
  relation: string;
  isSubject: boolean;
}

function loadCurrentArchive(): Archive | null {
  try {
    const currentId = localStorage.getItem('cj_current_archive_id');
    if (!currentId) return null;
    const raw = localStorage.getItem('cj_archives');
    if (!raw) return null;
    const archives: Archive[] = JSON.parse(raw);
    return archives.find((a) => a.id === currentId) || null;
  } catch {
    return null;
  }
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

export default function AIInterview() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const archive = useMemo(() => loadCurrentArchive(), []);
  const archiveId = archive?.id || 'default';
  const interviewTopics = generateInterviewTopics(archive, archiveId);
  const subjectName = archive?.name || '张家声';

  const [quota, setQuota] = useState<AIQuota | null>(null);

  useEffect(() => {
    quotaApi.get().then(setQuota).catch(() => setQuota(null));
  }, []);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    loadJson<Record<string, string>>(`cj_interview_answers_${archiveId}`, {})
  );
  const [transcript, setTranscript] = useState<TranscriptLine[]>(() =>
    loadJson<TranscriptLine[]>(`cj_interview_transcript_${archiveId}`, [])
  );
  const [session, setSession] = useState<InterviewSession>(() =>
    loadJson<InterviewSession>(`cj_interview_session_${archiveId}`, {
      currentTopicIndex: 0,
      currentQuestionIndex: 0,
      answeredIds: [],
      skippedIds: [],
      followUps: {},
    })
  );
  const firstQuestion = interviewTopics[0]?.questions[0];
  const [currentAnswer, setCurrentAnswer] = useState(
    firstQuestion ? loadJson<Record<string, string>>(`cj_interview_answers_${archiveId}`, {})[firstQuestion.id] || firstQuestion.mockAnswer : ''
  );
  const [generatingFollowUp, setGeneratingFollowUp] = useState(false);
  const [answerMode, setAnswerMode] = useState<'text' | 'voice' | 'video'>('text');
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [recordingVideo, setRecordingVideo] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState(0);
  const [videoRecorded, setVideoRecorded] = useState(false);
  const [videoRecordings, setVideoRecordings] = useState<Record<string, VideoRecording>>(() =>
    loadJson<Record<string, VideoRecording>>(`cj_interview_video_${archiveId}`, {})
  );
  const [activeFollowUpIndex, setActiveFollowUpIndex] = useState<number | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [showCustomTopic, setShowCustomTopic] = useState(false);
  const [customTopicTitle, setCustomTopicTitle] = useState('');
  const [customTopicSummary, setCustomTopicSummary] = useState('');
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // 多人协作与补充访谈
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => loadCollaborators(archiveId));
  const [supplementAnswers, setSupplementAnswers] = useState<Record<string, SupplementAnswer[]>>(() =>
    loadSupplementAnswers(archiveId)
  );
  const [currentRespondentId, setCurrentRespondentId] = useState<'subject' | string>('subject');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMode, setInviteMode] = useState<'select' | 'manual'>('select');
  const [inviteName, setInviteName] = useState('');
  const [inviteRelation, setInviteRelation] = useState('配偶');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyRelations, setFamilyRelations] = useState<FamilyRelation[]>([]);
  const [showCollaborators, setShowCollaborators] = useState(false);

  useEffect(() => {
    familyApi
      .members(archiveId)
      .then(setFamilyMembers)
      .catch(() => setFamilyMembers([]));
    familyApi
      .relations(archiveId)
      .then(setFamilyRelations)
      .catch(() => setFamilyRelations([]));
  }, [archiveId]);
  const [showSupplementPanel, setShowSupplementPanel] = useState(false);
  const [supplementDraft, setSupplementDraft] = useState('');
  const [viewingSupplements, setViewingSupplements] = useState<string | null>(null);

  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentTopic = interviewTopics[session.currentTopicIndex];
  const currentQuestion = currentTopic?.questions[session.currentQuestionIndex];

  useEffect(() => {
    saveJson(`cj_interview_answers_${archiveId}`, answers);
  }, [answers, archiveId]);

  useEffect(() => {
    saveJson(`cj_interview_transcript_${archiveId}`, transcript);
  }, [transcript, archiveId]);

  useEffect(() => {
    saveJson(`cj_interview_session_${archiveId}`, session);
  }, [session, archiveId]);

  useEffect(() => {
    saveCollaborators(archiveId, collaborators);
  }, [collaborators, archiveId]);

  useEffect(() => {
    saveSupplementAnswers(archiveId, supplementAnswers);
  }, [supplementAnswers, archiveId]);

  useEffect(() => {
    if (recordingVoice) {
      voiceTimerRef.current = setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
    } else if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    return () => { if (voiceTimerRef.current) clearInterval(voiceTimerRef.current); };
  }, [recordingVoice]);

  useEffect(() => {
    if (recordingVideo) {
      videoTimerRef.current = setInterval(() => setVideoSeconds((s) => s + 1), 1000);
    } else if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
    return () => { if (videoTimerRef.current) clearInterval(videoTimerRef.current); };
  }, [recordingVideo]);

  const voiceWaveHeights = useMemo(
    () => Array.from({ length: 40 }, (_, i) => 20 + ((i * 37 + 12) % 61)),
    []
  );

  const respondents: RespondentInfo[] = useMemo(
    () => [
      { id: 'subject', name: subjectName, relation: '本人', isSubject: true },
      ...collaborators.map((c) => ({ id: c.id, name: c.name, relation: c.relation, isSubject: false })),
    ],
    [collaborators, subjectName]
  );

  const currentRespondent = useMemo(
    () => respondents.find((r) => r.id === currentRespondentId) || respondents[0],
    [respondents, currentRespondentId]
  );

  const relatedPeople = useMemo(() => {
    const collaboratorNames = new Set(collaborators.map((c) => c.name));
    const map = new Map<string, { member: FamilyMember; relation: string }>();

    // 从关系记录中找与档案本人相关的人
    familyRelations.forEach((r) => {
      const isFromSubject = r.from === subjectName;
      const isToSubject = r.to === subjectName;
      if (!isFromSubject && !isToSubject) return;
      const otherName = isFromSubject ? r.to : r.from;
      const relText = isFromSubject ? r.relation : invertRelation(r.relation);
      const member = familyMembers.find((m) => m.name === otherName);
      if (member && !collaboratorNames.has(member.name) && member.name !== subjectName) {
        map.set(member.name, { member, relation: relText });
      }
    });

    // 家庭成员中尚未建立关系或未被加入的也列出来
    familyMembers.forEach((m) => {
      if (m.name !== subjectName && !collaboratorNames.has(m.name) && !map.has(m.name)) {
        map.set(m.name, { member: m, relation: m.role || '家庭成员' });
      }
    });

    return Array.from(map.values());
  }, [familyMembers, familyRelations, collaborators, subjectName]);

  const collaboratorAnswerCounts = useMemo(
    () => getCollaboratorAnswerCounts(archiveId, collaborators),
    [archiveId, collaborators, supplementAnswers]
  );

  const currentQuestionSupplements = currentQuestion ? supplementAnswers[currentQuestion.id] || [] : [];

  const nowTime = () =>
    new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  const totalQuestions = useMemo(
    () => interviewTopics.reduce((sum, t) => sum + t.questions.length, 0),
    [interviewTopics]
  );
  const answeredCount = session.answeredIds.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const saveCurrentAnswer = async () => {
    if (!currentQuestion) return;
    const text = currentAnswer.trim();
    if (!text) {
      addToast('请先输入回答内容', 'error');
      return;
    }

    const isSubject = currentRespondent.isSubject;

    if (isSubject) {
      if (!session.answeredIds.includes(currentQuestion.id)) {
        try {
          const nextQuota = await quotaApi.consume('interviewQuestion');
          setQuota(nextQuota);
        } catch (err: any) {
          addToast(err.message || 'AI采访问题额度不足', 'error');
          return;
        }
      }
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: text }));
      setSession((prev) => ({
        ...prev,
        answeredIds: Array.from(new Set([...prev.answeredIds, currentQuestion.id])),
        skippedIds: prev.skippedIds.filter((id) => id !== currentQuestion.id),
      }));
    } else {
      const added = addSupplementAnswer(archiveId, currentQuestion.id, {
        respondentId: currentRespondent.id,
        respondentName: currentRespondent.name,
        relation: currentRespondent.relation,
        text,
      });
      setSupplementAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: [...(prev[currentQuestion.id] || []).filter((a) => a.respondentId !== added.respondentId), added],
      }));
    }

    setTranscript((prev) => [
      ...prev,
      { speaker: 'AI采访官', time: nowTime(), text: currentQuestion.text },
      { speaker: currentRespondent.name, time: nowTime(), text },
    ]);

    addToast(isSubject ? '本段已保存' : `${currentRespondent.name} 的补充回答已保存`, 'success');

    // 根据当前回答自动生成延伸问题（仅主受访者触发）
    if (isSubject) {
      generateFollowUps(currentQuestion.id);
    }
  };

  const generateFollowUps = async (questionId: string) => {
    try {
      const used = await quotaApi.consume('followUp');
      setQuota(used);
    } catch (err: any) {
      addToast(err.message || '延伸问题额度不足', 'error');
      return;
    }
    setGeneratingFollowUp(true);

    const count = 2 + Math.floor(Math.random() * 2);
    const questions: string[] = [];
    while (questions.length < count) {
      const q = followUpQuestionsPool[Math.floor(Math.random() * followUpQuestionsPool.length)];
      if (!questions.includes(q)) questions.push(q);
    }

    setTimeout(() => {
      setSession((prev) => ({
        ...prev,
        followUps: {
          ...prev.followUps,
          [questionId]: [
            ...(prev.followUps[questionId] || []),
            ...questions.map((q) => ({ question: q, answered: false })),
          ],
        },
      }));
      setGeneratingFollowUp(false);
      addToast(`AI 根据您的回答生成了 ${questions.length} 个延伸问题`, 'success');
    }, 800);
  };

  const formatSeconds = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const startVoiceRecord = () => {
    setVoiceRecorded(false);
    setRecordingVoice(true);
    setVoiceSeconds(0);
    addToast('开始录制语音回答…', 'info');
  };

  const stopVoiceRecord = () => {
    setRecordingVoice(false);
    const mockTranscript = '[语音转写] 我用语音回答了这个问题，讲述了当时真实的经历和感受。';
    setCurrentAnswer((prev) => (prev.trim() ? `${prev}\n\n${mockTranscript}` : mockTranscript));
    setVoiceRecorded(true);
    addToast('语音回答已转写', 'success');
  };

  const startVideoRecord = () => {
    if (!currentQuestion) return;
    setVideoRecorded(false);
    setRecordingVideo(true);
    setVideoSeconds(0);
    addToast('开始录制视频回答…', 'info');
  };

  const stopVideoRecord = () => {
    if (!currentQuestion) return;
    setRecordingVideo(false);
    const mockTranscript = '[视频转写] 通过视频记录的回答，AI 已提取关键内容并整理成文字。';
    setCurrentAnswer((prev) => (prev.trim() ? `${prev}\n\n${mockTranscript}` : mockTranscript));
    const recording: VideoRecording = {
      seconds: videoSeconds,
      recordedAt: new Date().toISOString(),
      transcript: mockTranscript,
    };
    setVideoRecordings((prev) => ({ ...prev, [currentQuestion.id]: recording }));
    setVideoRecorded(true);
    addToast('视频回答已保存', 'success');
  };

  const answerFor = (topicIndex: number, questionIndex: number) => {
    const q = interviewTopics[topicIndex]?.questions[questionIndex];
    if (!q) return '';
    if (currentRespondent.isSubject) {
      return answers[q.id] || q.mockAnswer;
    }
    const supplements = supplementAnswers[q.id] || [];
    const found = supplements.find((a) => a.respondentId === currentRespondent.id);
    return found?.text || '';
  };

  const moveToNext = () => {
    if (!currentTopic || !currentQuestion) return;
    const questionList = currentTopic.questions;
    let nextTopicIndex = session.currentTopicIndex;
    let nextQuestionIndex = session.currentQuestionIndex;
    if (session.currentQuestionIndex < questionList.length - 1) {
      nextQuestionIndex += 1;
    } else if (session.currentTopicIndex < interviewTopics.length - 1) {
      nextTopicIndex += 1;
      nextQuestionIndex = 0;
    } else {
      addToast('已是最后一题，可以结束采访并整理', 'info');
      return;
    }
    setSession((prev) => ({
      ...prev,
      currentTopicIndex: nextTopicIndex,
      currentQuestionIndex: nextQuestionIndex,
    }));
    setCurrentAnswer(answerFor(nextTopicIndex, nextQuestionIndex));
    setAnswerMode('text');
    setRecordingVoice(false);
    setVoiceSeconds(0);
    setVoiceRecorded(false);
    setRecordingVideo(false);
    setVideoSeconds(0);
    setVideoRecorded(false);
  };

  const handleNextQuestion = async () => {
    if (currentAnswer.trim() && currentQuestion && !session.answeredIds.includes(currentQuestion.id)) {
      await saveCurrentAnswer();
      setTimeout(moveToNext, 300);
    } else {
      moveToNext();
    }
  };

  const handleSkip = () => {
    if (!currentQuestion) return;
    setSession((prev) => ({
      ...prev,
      skippedIds: Array.from(new Set([...prev.skippedIds, currentQuestion.id])),
    }));
    addToast('已跳过该问题', 'info');
    moveToNext();
  };

  const endInterview = async () => {
    // 将本次采访提炼的事件自动同步到人生档案时间轴
    try {
      const reviewData = buildReviewData(answers);
      reviewData.events.forEach((event) => {
        if (event.status !== 'ignored') {
          syncReviewEventToTimeline(archiveId, { ...event, status: 'confirmed' });
        }
      });
    } catch {
      // ignore sync errors
    }
    // 同步采访答案到 mock 后端
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => {
        const topic = interviewTopics.find((t) => t.questions.some((q) => q.id === questionId));
        return {
          questionId,
          category: topic?.title || '人生经历',
          answer,
        };
      });
      // 批量写入 MSW 会话
      for (const item of formattedAnswers) {
        await interviewApi.answer(archiveId, item.questionId, item.answer);
      }
      await interviewApi.complete(archiveId);
    } catch (err: any) {
      console.warn('同步采访答案到 mock 后端失败:', err);
    }
    navigate('/interview-review');
  };

  const selectQuestion = (topicIndex: number, questionIndex: number) => {
    setSession((prev) => ({
      ...prev,
      currentTopicIndex: topicIndex,
      currentQuestionIndex: questionIndex,
    }));
    setCurrentAnswer(answerFor(topicIndex, questionIndex));
    setAnswerMode('text');
    setRecordingVoice(false);
    setVoiceSeconds(0);
    setVoiceRecorded(false);
    setRecordingVideo(false);
    setVideoSeconds(0);
    setVideoRecorded(false);
    setActiveFollowUpIndex(null);
    setFollowUpAnswer('');
  };

  const handleAddCustomTopic = () => {
    const title = customTopicTitle.trim();
    if (!title) {
      addToast('请输入主题名称', 'error');
      return;
    }
    saveCustomTopic(archiveId, { title, summary: customTopicSummary.trim() });
    setCustomTopicTitle('');
    setCustomTopicSummary('');
    setShowCustomTopic(false);
    addToast(`已添加自定义主题「${title}」`, 'success');
    forceUpdate();
  };

  const currentFollowUps = currentQuestion ? session.followUps[currentQuestion.id] || [] : [];
  const pendingFollowUps = currentFollowUps.filter((f) => !f.answered);
  const answeredFollowUps = currentFollowUps.filter((f) => f.answered);
  const activeFollowUp = activeFollowUpIndex !== null ? currentFollowUps[activeFollowUpIndex] : null;

  const saveFollowUpAnswer = () => {
    if (!currentQuestion || activeFollowUpIndex === null || !followUpAnswer.trim()) return;
    const text = followUpAnswer.trim();
    const questionText = currentFollowUps[activeFollowUpIndex].question;

    if (currentRespondent.isSubject) {
      setSession((prev) => {
        const list = prev.followUps[currentQuestion.id] || [];
        const updated = list.map((f, i) =>
          i === activeFollowUpIndex ? { ...f, userAnswer: text, answered: true } : f
        );
        return { ...prev, followUps: { ...prev.followUps, [currentQuestion.id]: updated } };
      });
    } else {
      const added = addSupplementAnswer(archiveId, `${currentQuestion.id}_followup_${activeFollowUpIndex}`, {
        respondentId: currentRespondent.id,
        respondentName: currentRespondent.name,
        relation: currentRespondent.relation,
        text,
      });
      setSupplementAnswers((prev) => ({
        ...prev,
        [`${currentQuestion.id}_followup_${activeFollowUpIndex}`]: [
          ...(prev[`${currentQuestion.id}_followup_${activeFollowUpIndex}`] || []).filter(
            (a) => a.respondentId !== added.respondentId
          ),
          added,
        ],
      }));
    }

    setTranscript((prev) => [
      ...prev,
      { speaker: 'AI采访官·延伸', time: nowTime(), text: questionText },
      { speaker: currentRespondent.name, time: nowTime(), text },
    ]);
    setActiveFollowUpIndex(null);
    setFollowUpAnswer('');
    addToast('延伸问题回答已保存', 'success');
  };

  const selectFollowUp = (index: number) => {
    setActiveFollowUpIndex(index);
    setFollowUpAnswer('');
  };

  const handleSelectPersonAsCollaborator = (name: string, relation: string) => {
    const existing = collaborators.find((c) => c.name === name);
    if (existing) {
      addToast(`${name} 已经是协作者`, 'info');
      return;
    }
    const collaborator = addCollaborator(archiveId, { name, relation });
    setCollaborators((prev) => [collaborator, ...prev]);
    setShowInviteModal(false);
    addToast(`${name} 已添加为协作者`, 'success');
  };

  const handleAddCollaborator = () => {
    if (!inviteName.trim() || !inviteRelation.trim()) {
      addToast('请输入姓名和关系', 'error');
      return;
    }
    const collaborator = addCollaborator(archiveId, {
      name: inviteName.trim(),
      relation: inviteRelation,
    });
    setCollaborators((prev) => [collaborator, ...prev]);
    setInviteName('');
    setInviteRelation('配偶');
    setShowInviteModal(false);
    addToast(`${collaborator.name} 已添加为协作者`, 'success');
  };

  const handleRemoveCollaborator = (id: string) => {
    removeCollaborator(archiveId, id);
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
    setSupplementAnswers((prev) => {
      const next: Record<string, SupplementAnswer[]> = {};
      Object.entries(prev).forEach(([qid, list]) => {
        next[qid] = list.filter((a) => a.respondentId !== id);
      });
      return next;
    });
    if (currentRespondentId === id) setCurrentRespondentId('subject');
    addToast('协作者已移除', 'info');
  };

  const saveSupplementFromPanel = () => {
    if (!currentQuestion || !supplementDraft.trim()) return;
    const added = addSupplementAnswer(archiveId, currentQuestion.id, {
      respondentId: currentRespondent.id,
      respondentName: currentRespondent.name,
      relation: currentRespondent.relation,
      text: supplementDraft.trim(),
    });
    setSupplementAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: [...(prev[currentQuestion.id] || []).filter((a) => a.respondentId !== added.respondentId), added],
    }));
    setSupplementDraft('');
    setShowSupplementPanel(false);
    addToast('补充回答已保存', 'success');
  };

  return (
    <div className="interview-page">
      <header className="page-header interview-header">
        <h1 className="page-title">AI智能采访</h1>
        <button className="btn btn-primary end-interview-btn" onClick={endInterview}>
          <FolderOpen size={14} /> 结束采访并整理
        </button>
      </header>

      <div className="interview-top-stats">
        <div className="card stat-person">
          <div className="card-body">
            <div className="stat-label-text">当前采访对象</div>
            <div className="person-row">
              <Avatar name={subjectName} size={48} />
              <div>
                <div className="person-name">{subjectName}</div>
                <div className="person-tags">
                  <span>{archive?.birthYear ? `${new Date().getFullYear() - Number(archive.birthYear)}岁` : '75岁'}</span>
                  <span>{archive?.origin || '江苏苏州'}</span>
                </div>
              </div>
            </div>
            <div className="respondent-bar">
              <div className="respondent-select">
                <span className="respondent-label">当前回答者</span>
                <select
                  value={currentRespondentId}
                  onChange={(e) => {
                    setCurrentRespondentId(e.target.value);
                    setCurrentAnswer(answerFor(session.currentTopicIndex, session.currentQuestionIndex));
                  }}
                >
                  {respondents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.relation}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowInviteModal(true)}>
                邀请补充
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCollaborators(true)}>
                协作者
              </button>
            </div>
          </div>
        </div>
        <div className="card stat-phase">
          <div className="card-body">
            <div className="stat-label-text">当前主题</div>
            <div className="phase-num">{currentTopic?.title || '—'}</div>
            <div className="phase-desc">{currentTopic?.summary || ''}</div>
          </div>
        </div>
      </div>

      <div className="interview-grid">
        <div className="card topic-card">
          <div className="card-header">
            <h3 className="card-title">采访主题</h3>
            <span className="card-extra">{interviewTopics.length} 个主题</span>
          </div>
          <div className="card-body topic-body">
            {interviewTopics.map((topic, ti) => {
              const done = topic.questions.filter((q) => session.answeredIds.includes(q.id)).length;
              const active = ti === session.currentTopicIndex;
              return (
                <button
                  className={`topic-item ${active ? 'active' : ''}`}
                  key={topic.id}
                  onClick={() => selectQuestion(ti, 0)}
                >
                  <div className="topic-info">
                    <div className="topic-name">
                      {active ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      {topic.title}
                    </div>
                  </div>
                  <div className="topic-progress">{done}/{topic.questions.length}</div>
                </button>
              );
            })}
          </div>
          <div className="custom-topic-section">
            {!showCustomTopic ? (
              <button className="btn btn-outline btn-sm custom-topic-add" onClick={() => setShowCustomTopic(true)}>
                <Plus size={14} /> 添加自定义主题
              </button>
            ) : (
              <div className="custom-topic-form">
                <input
                  type="text"
                  placeholder="主题名称，如：军旅生涯"
                  value={customTopicTitle}
                  onChange={(e) => setCustomTopicTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="主题说明（可选）"
                  value={customTopicSummary}
                  onChange={(e) => setCustomTopicSummary(e.target.value)}
                />
                <div className="custom-topic-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowCustomTopic(false)}>取消</button>
                  <button className="btn btn-primary btn-sm" onClick={handleAddCustomTopic}>添加</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card workspace-card">
          <div className="card-header">
            <h3 className="card-title">
              <Mic size={16} /> 当前问题
            </h3>
            {currentQuestion && session.answeredIds.includes(currentQuestion.id) && (
              <span className="answered-badge"><CheckCircle2 size={12} /> 已保存</span>
            )}
          </div>
          <div className="card-body workspace-body">
            {currentQuestion ? (
              <>
                <div className="question-box">
                  <div className="question-number">{session.currentQuestionIndex + 1}</div>
                  <div className="question-text">{currentQuestion.text}</div>
                </div>

                <div className="workspace-actions workspace-actions-top">
                  <button className="btn btn-primary" onClick={saveCurrentAnswer} disabled={generatingFollowUp || !currentAnswer.trim()}>
                    <Save size={14} /> 保存本段
                  </button>
                  <button className="btn btn-outline" onClick={handleNextQuestion} disabled={generatingFollowUp}>
                    下一题 <ChevronRight size={14} />
                  </button>
                  <button className="btn btn-ghost" onClick={handleSkip} disabled={generatingFollowUp}>
                    <SkipForward size={14} /> 跳过问题
                  </button>
                  {!currentRespondent.isSubject && (
                    <button className="btn btn-accent" onClick={() => setShowSupplementPanel(true)}>
                      <Users size={14} /> 补充回答
                    </button>
                  )}
                </div>

                <div className="answer-section">
                  <div className="answer-section-header">
                    <label className="section-label">
                      {answerMode === 'text' ? <Type size={14} /> : answerMode === 'voice' ? <Mic size={14} /> : <Video size={14} />}
                      回答区
                    </label>
                    <div className="answer-mode-tabs">
                      <button className={`mode-tab ${answerMode === 'text' ? 'active' : ''}`} onClick={() => setAnswerMode('text')}>
                        <Type size={13} /> 文字
                      </button>
                      <button className={`mode-tab ${answerMode === 'voice' ? 'active' : ''}`} onClick={() => setAnswerMode('voice')}>
                        <Mic size={13} /> 语音
                      </button>
                      <button
                        className={`mode-tab ${answerMode === 'video' ? 'active' : ''}`}
                        onClick={() => {
                          setAnswerMode('video');
                          const rec = currentQuestion ? videoRecordings[currentQuestion.id] : undefined;
                          if (rec) {
                            setVideoRecorded(true);
                            setRecordingVideo(false);
                            setVideoSeconds(rec.seconds);
                          } else {
                            setVideoRecorded(false);
                            setRecordingVideo(false);
                            setVideoSeconds(0);
                          }
                        }}
                      >
                        <Video size={13} /> 视频
                      </button>
                    </div>
                  </div>

                  {answerMode === 'text' && (
                    <textarea
                      ref={textareaRef}
                      className="answer-textarea"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="请输入或口述回答…"
                      rows={6}
                    />
                  )}

                  {answerMode === 'voice' && (
                    <div className="media-answer voice-answer">
                      {voiceRecorded && !recordingVoice ? (
                        <div className="voice-recorded">
                          <div className="voice-wave-large">
                            {voiceWaveHeights.map((h, i) => (
                              <div key={i} className="voice-large-seg" style={{ height: `${h}%` }} />
                            ))}
                          </div>
                          <div className="voice-meta">
                            <span className="voice-duration"><Clock size={14} /> {formatSeconds(voiceSeconds)}</span>
                            <span className="voice-status">语音回答已转写为文字</span>
                          </div>
                          <button className="btn btn-outline" onClick={startVoiceRecord}>
                            <RefreshCw size={14} /> 重新录制
                          </button>
                        </div>
                      ) : (
                        <div className="voice-recorder">
                          <div className={`voice-wave-large ${recordingVoice ? 'recording' : ''}`}>
                            {voiceWaveHeights.map((h, i) => (
                              <div key={i} className="voice-large-seg" style={{ height: `${h}%` }} />
                            ))}
                          </div>
                          <div className="voice-meta">
                            {recordingVoice ? (
                              <>
                                <span className="recording-dot" />
                                <span>录制中 {formatSeconds(voiceSeconds)}</span>
                              </>
                            ) : (
                              <span>点击开始录制语音回答</span>
                            )}
                          </div>
                          {recordingVoice ? (
                            <button className="btn btn-danger" onClick={stopVoiceRecord}>
                              <Square size={14} /> 结束录制
                            </button>
                          ) : (
                            <button className="btn btn-primary" onClick={startVoiceRecord}>
                              <Mic size={14} /> 开始录制
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {answerMode === 'video' && (
                    <div className="media-answer video-answer">
                      {videoRecorded && !recordingVideo ? (
                        <div className="video-recorded">
                          <div className="video-preview">
                            <CheckCircle2 size={32} color="#1B5E4B" />
                            <span>视频回答已保存</span>
                            <span className="video-duration">{formatSeconds(videoSeconds)}</span>
                          </div>
                          <button className="btn btn-outline" onClick={startVideoRecord}>
                            <RefreshCw size={14} /> 重新录制
                          </button>
                        </div>
                      ) : (
                        <div className="video-recorder">
                          <div className="video-preview">
                            {recordingVideo ? (
                              <>
                                <div className="recording-dot" />
                                <span>正在录制 {formatSeconds(videoSeconds)}</span>
                              </>
                            ) : (
                              <>
                                <Video size={32} color="#9ca3af" />
                                <span>点击开始录制视频回答</span>
                              </>
                            )}
                          </div>
                          {recordingVideo ? (
                            <button className="btn btn-danger" onClick={stopVideoRecord}>
                              <StopCircle size={14} /> 结束录制
                            </button>
                          ) : (
                            <button className="btn btn-primary" onClick={startVideoRecord}>
                              <Video size={14} /> 开始录制
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {currentQuestionSupplements.length > 0 && (
                    <div className="supplement-hint">
                      <span className="supplement-dot" />
                      已有 {currentQuestionSupplements.length} 位家人补充回答
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setViewingSupplements(viewingSupplements === currentQuestion.id ? null : currentQuestion.id)}
                      >
                        {viewingSupplements === currentQuestion.id ? '收起' : '查看'}
                      </button>
                    </div>
                  )}

                  {viewingSupplements === currentQuestion.id && currentQuestionSupplements.length > 0 && (
                    <div className="supplement-list">
                      {currentQuestionSupplements.map((s, i) => (
                        <div className="supplement-item" key={i}>
                          <div className="supplement-meta">
                            <strong>{s.respondentName}</strong>
                            <span>{s.relation}</span>
                            <span>{new Date(s.answeredAt).toLocaleString()}</span>
                          </div>
                          <div className="supplement-text">{s.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {activeFollowUp && (
                  <div className="followup-answer-section">
                    <label className="section-label">
                      <MessageSquarePlus size={14} /> 当前延伸问题
                    </label>
                    <div className="followup-answer-question">
                      <Sparkles size={14} />
                      {activeFollowUp.question}
                    </div>
                    <textarea
                      className="answer-textarea followup-answer-textarea"
                      value={followUpAnswer}
                      onChange={(e) => setFollowUpAnswer(e.target.value)}
                      placeholder="请输入对这个延伸问题的回答…"
                      rows={4}
                    />
                    <div className="followup-answer-actions">
                      <button
                        className="btn btn-primary"
                        onClick={saveFollowUpAnswer}
                        disabled={!followUpAnswer.trim()}
                      >
                        <Save size={14} /> 保存延伸回答
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => {
                          setActiveFollowUpIndex(null);
                          setFollowUpAnswer('');
                        }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}

                {answeredFollowUps.length > 0 && (
                  <div className="followup-section">
                    <label className="section-label">
                      <MessageSquarePlus size={14} /> 已回答延伸问题
                    </label>
                    <div className="followup-list">
                      {answeredFollowUps.map((f, i) => (
                        <div className="followup-bubble" key={i}>
                          <div className="followup-q"><Sparkles size={12} /> {f.question}</div>
                          <div className="followup-a">{f.userAnswer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="interview-done">
                <CheckCircle2 size={48} color="#1B5E4B" />
                <h3>本阶段采访问题已全部完成</h3>
                <p>您可以结束采访，进入整理页面。</p>
                <button className="btn btn-primary" onClick={endInterview}>
                  <FolderOpen size={14} /> 结束采访并整理
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="interview-right">
          <div className="card progress-card">
            <div className="card-header">
              <h3 className="card-title">本次采访进度</h3>
            </div>
            <div className="card-body progress-body">
              <div className="progress-ring-wrap">
                <div className="progress-ring-bg">
                  <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#e8ecea" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#1B5E4B"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${progressPercent * 3.27} 327`}
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className="progress-ring-text">{progressPercent}%</div>
                </div>
              </div>
              <div className="progress-detail">
                <div><span className="dot green" /> 已回答 {answeredCount} 题</div>
                <div><span className="dot gray" /> 待回答 {totalQuestions - answeredCount} 题</div>
                <div><span className="dot orange" /> 已跳过 {session.skippedIds.length} 题</div>
              </div>

            </div>
          </div>

          <div className="card followup-sidebar-card">
            <div className="card-header">
              <h3 className="card-title"><MessageSquarePlus size={14} /> 延伸问题</h3>
              {pendingFollowUps.length > 0 && (
                <span className="followup-sidebar-count">{pendingFollowUps.length} 个待回答</span>
              )}
            </div>
            <div className="card-body followup-sidebar-body">
              {currentQuestion ? (
                pendingFollowUps.length > 0 ? (
                  <div className="followup-sidebar-list">
                    {pendingFollowUps.map((f) => {
                      const realIndex = currentFollowUps.findIndex((item) => item === f);
                      return (
                        <div
                          className={`followup-sidebar-item ${activeFollowUpIndex === realIndex ? 'active' : ''}`}
                          key={realIndex}
                          onClick={() => selectFollowUp(realIndex)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              selectFollowUp(realIndex);
                            }
                          }}
                        >
                          <div className="followup-sidebar-q"><Sparkles size={12} /> {f.question}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="followup-sidebar-empty">
                    <Sparkles size={24} color="#9ca3af" />
                    <p>暂无待回答延伸问题</p>
                    <span>保存当前问题回答后，AI 将自动根据内容生成延伸问题</span>
                  </div>
                )
              ) : (
                <div className="followup-sidebar-empty">
                  <Sparkles size={24} color="#9ca3af" />
                  <p>采访已完成</p>
                </div>
              )}
            </div>
          </div>

          {quota && quota.interviewQuestion.used >= quota.interviewQuestion.total && (
            <div className="card alert-card">
              <div className="card-body alert-body">
                <AlertCircle size={18} />
                <span>AI采访问题额度已用完，整理已有素材即可生成传记。</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content interview-invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>选择补充访谈者</h3>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="invite-mode-switch">
                <button
                  className={inviteMode === 'select' ? 'active' : ''}
                  onClick={() => setInviteMode('select')}
                >
                  从关系人选择
                </button>
                <button
                  className={inviteMode === 'manual' ? 'active' : ''}
                  onClick={() => setInviteMode('manual')}
                >
                  手动添加
                </button>
              </div>

              {inviteMode === 'select' ? (
                <>
                  <p className="modal-desc">从当前档案的家人、朋友、同事等关系人中选择补充访谈者。</p>
                  {relatedPeople.length === 0 ? (
                    <div className="related-empty">
                      <Users size={32} />
                      <p>暂无可选关系人</p>
                      <span>请先在「人生档案 → 人物关系图谱」或「关系维护」中添加朋友、同事等关系。</span>
                    </div>
                  ) : (
                    <div className="related-people-list">
                      {relatedPeople.map(({ member, relation }) => {
                        const category = getRelationCategory(relation);
                        return (
                          <div className="related-person" key={member.name}>
                            <Avatar name={member.name} size={40} />
                            <div className="related-person-info">
                              <strong>{member.name}</strong>
                              <span>{relation}</span>
                            </div>
                            <span className={`related-category ${category}`}>
                              {category === 'family' ? '家庭' : '社会关系'}
                            </span>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSelectPersonAsCollaborator(member.name, relation)}
                            >
                              添加
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="modal-desc">手动输入一个补充访谈者，不会加入人物关系图谱。</p>
                  <div className="form-row">
                    <label>姓名</label>
                    <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="如：李秀英" />
                  </div>
                  <div className="form-row">
                    <label>关系</label>
                    <select value={inviteRelation} onChange={(e) => setInviteRelation(e.target.value)}>
                      {relationTypeOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-outline" onClick={() => setShowInviteModal(false)}>取消</button>
                    <button className="btn btn-primary" onClick={handleAddCollaborator} disabled={!inviteName.trim()}>
                      添加为协作者
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCollaborators && (
        <div className="modal-overlay" onClick={() => setShowCollaborators(false)}>
          <div className="modal-content interview-collab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>协作者管理</h3>
              <button className="modal-close" onClick={() => setShowCollaborators(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {collaborators.length === 0 ? (
                <div className="collab-empty">暂无协作者，点击「邀请补充」添加家人或朋友。</div>
              ) : (
                <div className="collab-list">
                  {collaborators.map((c) => (
                    <div className="collab-item" key={c.id}>
                      <div className="collab-info">
                        <strong>{c.name}</strong>
                        <span>{c.relation}</span>
                        <span className="collab-count">已补充 {collaboratorAnswerCounts[c.id] || 0} 题</span>
                      </div>
                      <div className="collab-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setCurrentRespondentId(c.id);
                            setShowCollaborators(false);
                            setCurrentAnswer(answerFor(session.currentTopicIndex, session.currentQuestionIndex));
                          }}
                        >
                          切换回答
                        </button>
                        <button className="btn btn-ghost btn-sm danger" onClick={() => handleRemoveCollaborator(c.id)}>
                          移除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSupplementPanel && currentQuestion && (
        <div className="modal-overlay" onClick={() => setShowSupplementPanel(false)}>
          <div className="modal-content interview-supplement-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>补充回答：{currentQuestion.text.slice(0, 20)}…</h3>
              <button className="modal-close" onClick={() => setShowSupplementPanel(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label>当前补充者</label>
                <select
                  value={currentRespondentId}
                  onChange={(e) => setCurrentRespondentId(e.target.value)}
                >
                  {respondents.filter((r) => !r.isSubject).map((r) => (
                    <option key={r.id} value={r.id}>{r.name} · {r.relation}</option>
                  ))}
                </select>
              </div>
              <textarea
                className="answer-textarea"
                rows={5}
                value={supplementDraft}
                onChange={(e) => setSupplementDraft(e.target.value)}
                placeholder="请输入补充内容…"
              />
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowSupplementPanel(false)}>取消</button>
                <button className="btn btn-primary" onClick={saveSupplementFromPanel} disabled={!supplementDraft.trim()}>
                  保存补充
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card transcript-card">
        <div className="card-header">
          <h3 className="card-title"><BookOpen size={14} /> 实时转写</h3>
          <div className="card-extra"><Clock size={12} /> 自动保存</div>
        </div>
        <div className="card-body transcript-body">
          {transcript.length === 0 ? (
            <div className="transcript-empty">采访开始后，转写内容会实时出现在这里</div>
          ) : (
            <div className="transcript-list">
              {transcript.map((line, i) => (
                <div className={`transcript-line ${line.speaker === 'AI采访官' || line.speaker.includes('延伸') ? 'ai' : 'user'}`} key={i}>
                  <Avatar name={line.speaker} size={32} />
                  <div className="tx-main">
                    <div className="tx-header">
                      <span className="tx-speaker">{line.speaker}</span>
                      <span className="tx-time">{line.time}</span>
                    </div>
                    <div className="tx-text">{line.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
