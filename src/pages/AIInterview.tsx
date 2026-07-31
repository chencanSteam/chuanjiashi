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
  FileAudio,
  FileUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../hooks/useToast';
import { interviewApi } from '../api/interview';
import { quotaApi } from '../api/quota';
import {
  loadCollaborators,
  saveCollaborators,
  removeCollaborator,
  loadSupplementAnswers,
  saveSupplementAnswers,
  addSupplementAnswer,
  getCollaboratorAnswerCounts,
  createCollabInvite,
  invitesForArchive,
  revokeCollabInvite,
  findAccountByPhoneOrIdCard,
  type Collaborator,
  type SupplementAnswer,
} from '../data/interviewCollaboration';
import { relationTypeOptions } from '../utils/familyRelations';
import { useAuth } from '../hooks/useAuth';
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
  /** 资料完整度（百分比），未设置时按采访已答问题数计算 */
  completion?: number;
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
  const { user } = useAuth();

  const archive = useMemo(() => loadCurrentArchive(), []);
  const archiveId = archive?.id || 'default';
  const subjectName = archive?.name || '张家声';

  // 档案传主与当前账号昵称一致 → 本人（回答自己的传记）；其他档案一律为协助模式（回答计入补充素材）
  const collaboratorRecord = loadCollaborators(archiveId).find((c) => c.name === user?.name);
  const isOwnArchive = subjectName === user?.name;
  const myCollaborator: RespondentInfo | null = isOwnArchive
    ? null
    : {
        id: collaboratorRecord?.id || `self_${user?.phone || 'anon'}`,
        name: user?.name || '协作人',
        relation: collaboratorRecord?.relation || '协作人',
        isSubject: false,
      };
  const currentRespondent: RespondentInfo = myCollaborator ?? {
    id: 'subject',
    name: subjectName,
    relation: '本人',
    isSubject: true,
  };
  const isSubjectMode = currentRespondent.isSubject;

  // 每个回答者独立抽题与进度：AI 按各自对话生成问题，本人与协助者的问题互不相同
  const respondentSuffix = myCollaborator ? `_${myCollaborator.id}` : '';
  const interviewTopics = generateInterviewTopics(archive, archiveId, `${archiveId}${respondentSuffix}`);

  // 本人=回答自己的传记；协作者=协助传主的传记
  const respondentLabel = (r: RespondentInfo) =>
    r.isSubject ? `${r.name} · 本人（回答自己的传记）` : `${r.name} · ${r.relation}（协助${subjectName}的传记）`;

  // 传记选择：自己的传记显示本人，其他传记一律显示协助；切换后重载页面以载入对应档案数据
  const allArchives = useMemo(() => loadJson<Archive[]>('cj_archives', []), []);
  const archiveOptions = allArchives.map((a) => {
    const collab = loadCollaborators(a.id).find((c) => c.name === user?.name);
    return {
      id: a.id,
      label:
        a.name === user?.name
          ? `${a.name} 的传记 · 本人`
          : `${a.name} 的传记 · 协助（我是${collab?.relation || '协作人'}）`,
    };
  });
  const handleSwitchArchive = (id: string) => {
    if (id === archiveId) return;
    localStorage.setItem('cj_current_archive_id', id);
    window.location.reload();
  };

  const [quota, setQuota] = useState<AIQuota | null>(null);

  useEffect(() => {
    quotaApi.get().then(setQuota).catch(() => setQuota(null));
  }, []);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    loadJson<Record<string, string>>(`cj_interview_answers_${archiveId}`, {})
  );
  // 转写/进度/视频按回答者独立存储
  const transcriptKey = `cj_interview_transcript_${archiveId}${respondentSuffix}`;
  const sessionKey = `cj_interview_session_${archiveId}${respondentSuffix}`;
  const videoKey = `cj_interview_video_${archiveId}${respondentSuffix}`;
  const [transcript, setTranscript] = useState<TranscriptLine[]>(() =>
    loadJson<TranscriptLine[]>(transcriptKey, [])
  );
  const [session, setSession] = useState<InterviewSession>(() =>
    loadJson<InterviewSession>(sessionKey, {
      currentTopicIndex: 0,
      currentQuestionIndex: 0,
      answeredIds: [],
      skippedIds: [],
      followUps: {},
    })
  );
  const firstQuestion = interviewTopics[0]?.questions[0];
  const [currentAnswer, setCurrentAnswer] = useState(() => {
    if (!firstQuestion) return '';
    if (myCollaborator) {
      const supps = loadSupplementAnswers(archiveId)[firstQuestion.id] || [];
      return supps.find((a) => a.respondentId === myCollaborator.id)?.text || '';
    }
    return loadJson<Record<string, string>>(`cj_interview_answers_${archiveId}`, {})[firstQuestion.id] || firstQuestion.mockAnswer;
  });
  const [generatingFollowUp, setGeneratingFollowUp] = useState(false);
  const [answerMode, setAnswerMode] = useState<'text' | 'voice' | 'video'>('text');
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [recordingVideo, setRecordingVideo] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState(0);
  const [videoRecorded, setVideoRecorded] = useState(false);
  const [videoRecordings, setVideoRecordings] = useState<Record<string, VideoRecording>>(() =>
    loadJson<Record<string, VideoRecording>>(videoKey, {})
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteRelation, setInviteRelation] = useState('配偶');
  const [inviteFound, setInviteFound] = useState<{ phone: string; name?: string } | null>(null);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [invitesRefresh, setInvitesRefresh] = useState(0);
  // 本档案已发出、待对方同意的邀请
  const pendingInvites = useMemo(
    () => invitesForArchive(archiveId).filter((i) => i.status === 'pending'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [archiveId, invitesRefresh, collaborators]
  );
  const [viewingSupplements, setViewingSupplements] = useState<string | null>(null);
  // 本人视角：在主题区切换查看某位协助人的问答
  const [viewRespondentId, setViewRespondentId] = useState<'subject' | string>('subject');

  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const docFileRef = useRef<HTMLInputElement>(null);

  // 素材处理：语音转文字 / 采访记录导入
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState(0);

  const currentTopic = interviewTopics[session.currentTopicIndex];
  const currentQuestion = currentTopic?.questions[session.currentQuestionIndex];

  useEffect(() => {
    saveJson(`cj_interview_answers_${archiveId}`, answers);
  }, [answers, archiveId]);

  useEffect(() => {
    saveJson(transcriptKey, transcript);
  }, [transcript, transcriptKey]);

  useEffect(() => {
    saveJson(sessionKey, session);
  }, [session, sessionKey]);

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

  const collaboratorAnswerCounts = useMemo(
    () => getCollaboratorAnswerCounts(archiveId, collaborators),
    [archiveId, collaborators, supplementAnswers]
  );

  const currentQuestionSupplements = currentQuestion ? supplementAnswers[currentQuestion.id] || [] : [];

  // 正在查看的协助人：TA 有独立的问题集与问答记录（AI 按 TA 的回答生成）
  const viewingCollaborator =
    isSubjectMode && viewRespondentId !== 'subject'
      ? collaborators.find((c) => c.id === viewRespondentId) ?? null
      : null;
  const viewedTopics = viewingCollaborator
    ? generateInterviewTopics(archive, archiveId, `${archiveId}_${viewingCollaborator.id}`)
    : interviewTopics;
  const viewedTopic = viewedTopics[Math.min(session.currentTopicIndex, viewedTopics.length - 1)];
  const displayedQuestion = viewingCollaborator
    ? viewedTopic?.questions[Math.min(session.currentQuestionIndex, (viewedTopic?.questions.length || 1) - 1)]
    : currentQuestion;
  const viewingCollabAnswer =
    viewingCollaborator && displayedQuestion
      ? (supplementAnswers[displayedQuestion.id] || []).find((a) => a.respondentId === viewingCollaborator.id)?.text || ''
      : '';

  // 当前主题下有补充回答的协助者（协助按主题划分，如发小协助童年、配偶协助婚姻家庭）
  const topicCollaborators = useMemo(() => {
    if (!isSubjectMode || !currentTopic) return [];
    return collaborators.filter((c) => {
      const theirTopic = generateInterviewTopics(archive, archiveId, `${archiveId}_${c.id}`).find(
        (t) => t.id === currentTopic.id
      );
      return (theirTopic?.questions || []).some((q) =>
        (supplementAnswers[q.id] || []).some((a) => a.respondentId === c.id)
      );
    });
  }, [isSubjectMode, collaborators, currentTopic, supplementAnswers, archive, archiveId]);

  // 切换主题后，若当前查看的协助者在该主题下没有回答，自动切回本人
  useEffect(() => {
    if (viewRespondentId !== 'subject' && !topicCollaborators.some((c) => c.id === viewRespondentId)) {
      setViewRespondentId('subject');
    }
  }, [topicCollaborators, viewRespondentId]);

  const nowTime = () =>
    new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  const totalQuestions = useMemo(
    () => interviewTopics.reduce((sum, t) => sum + t.questions.length, 0),
    [interviewTopics]
  );
  const answeredCount = session.answeredIds.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);
  // 资料完整度：优先取档案的 completion 字段，否则按已答问题比例计算
  const completionPercent = Math.max(
    0,
    Math.min(100, Math.round(archive?.completion ?? progressPercent))
  );

  // 语音转文字：选择音频文件 → mock 转换进度 → 生成文本片段插入采访记录
  const handleAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setTranscribing(true);
    setTranscribeProgress(0);
    addToast(`正在将「${file.name}」转换为文字…`, 'info');
    const timer = setInterval(() => {
      setTranscribeProgress((prev) => {
        const next = Math.min(100, prev + 20);
        if (next >= 100) {
          clearInterval(timer);
          setTranscribing(false);
          setTranscript((list) => [
            ...list,
            {
              speaker: '语音转文字',
              time: nowTime(),
              text: `[语音转文字 · ${file.name}] 那时候家里条件虽然艰苦，但一家人和和睦睦，日子过得很踏实。我记得最清楚的，是父亲手把手教我写字的那个晚上……（mock 转写内容）`,
            },
          ]);
          addToast('语音转文字完成，已插入采访记录', 'success');
        }
        return next;
      });
    }, 300);
  };

  // 采访记录导入：选择文本/文档文件 → 读取内容作为一条采访记录
  const handleDocFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = ((reader.result as string) || '').trim();
      if (!text) {
        addToast('文件内容为空，未导入', 'error');
        return;
      }
      const snippet = text.length > 500 ? `${text.slice(0, 500)}…` : text;
      setTranscript((list) => [
        ...list,
        { speaker: '采访记录导入', time: nowTime(), text: `[导入自 ${file.name}]\n${snippet}` },
      ]);
      addToast('采访记录已导入', 'success');
    };
    reader.onerror = () => addToast('文件读取失败，请重试', 'error');
    reader.readAsText(file);
  };


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

  // 后台设定：每个问题的 AI 追问不超过 3 次（对用户无感，达到上限后静默停止）
  const MAX_FOLLOW_UPS_PER_QUESTION = 3;

  const generateFollowUps = async (questionId: string, maxNew = 2) => {
    const existing = session.followUps[questionId]?.length ?? 0;
    const count = Math.min(maxNew, MAX_FOLLOW_UPS_PER_QUESTION - existing);
    if (count <= 0) return;
    try {
      const used = await quotaApi.consume('followUp');
      setQuota(used);
    } catch (err: any) {
      addToast(err.message || '延伸问题额度不足', 'error');
      return;
    }
    setGeneratingFollowUp(true);

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

    // 本人回答追问后，AI 可继续衍生新问题（仍受每题 3 次追问上限约束）
    if (currentRespondent.isSubject) {
      generateFollowUps(currentQuestion.id, 1);
    }
  };

  const selectFollowUp = (index: number) => {
    setActiveFollowUpIndex(index);
    setFollowUpAnswer('');
  };

  // 查找账号（手机号/身份证号）并发送协作邀请，对方同意后才会成为协作者
  const handleFindAccount = () => {
    if (!inviteQuery.trim()) {
      addToast('请输入手机号或身份证号', 'error');
      return;
    }
    const found = findAccountByPhoneOrIdCard(inviteQuery);
    if (!found) {
      setInviteFound(null);
      addToast('未找到该账号，请确认手机号或身份证号是否正确', 'error');
      return;
    }
    if (found.phone === user?.phone) {
      addToast('不能邀请自己', 'error');
      return;
    }
    if (collaborators.some((c) => c.phone === found.phone)) {
      addToast('TA 已经是协作者', 'info');
      return;
    }
    if (invitesForArchive(archiveId).some((i) => i.targetPhone === found.phone && i.status === 'pending')) {
      addToast('已向 TA 发送过邀请，等待对方同意', 'info');
      return;
    }
    setInviteFound(found);
  };

  const handleSendInvite = () => {
    if (!inviteFound) return;
    createCollabInvite({
      kind: 'collab',
      archiveId,
      archiveName: subjectName,
      subjectName,
      inviterName: user?.name || subjectName,
      targetPhone: inviteFound.phone,
      relation: inviteRelation,
    });
    setInviteFound(null);
    setInviteQuery('');
    setInviteRelation('配偶');
    setShowInviteModal(false);
    addToast('邀请已发送，待对方同意后即可协助采访', 'success');
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
    addToast('协作者已移除', 'info');
  };

  return (
    <div className="interview-page">
      <header className="page-header interview-header">
        <h1 className="page-title">AI智能采访</h1>
        {isSubjectMode && (
          <button className="btn btn-primary end-interview-btn" onClick={endInterview}>
            <FolderOpen size={14} /> 结束采访并整理
          </button>
        )}
      </header>

      <div className="interview-top-stats">
        <div className="card stat-person">
          <div className="card-body">
            <div className="archive-switch-row">
              <span className="respondent-label">选择传记</span>
              <select value={archiveId} onChange={(e) => handleSwitchArchive(e.target.value)}>
                {archiveOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
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
                <span className="respondent-identity">{respondentLabel(currentRespondent)}</span>
              </div>
              {isSubjectMode && (
                <>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowInviteModal(true)}>
                    邀请补充
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowCollaborators(true)}>
                    协作者
                  </button>
                </>
              )}
            </div>
            {!isSubjectMode && (
              <div className="collab-mode-tip">
                你正在协助 {subjectName} 的传记采访，你的回答会作为补充素材，不影响采访进度。
              </div>
            )}
            <div className="archive-completion">
              <div className="archive-completion-header">
                <span>资料完整度</span>
                <span className="archive-completion-value">{completionPercent}%</span>
              </div>
              <div className="archive-completion-bar">
                <div className="archive-completion-fill" style={{ width: `${completionPercent}%` }} />
              </div>
              {completionPercent < 60 && (
                <div className="archive-completion-tip">资料还不够完整，继续采访可生成更丰富的传记</div>
              )}
            </div>
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
            {viewedTopics.map((topic, ti) => {
              const done = viewingCollaborator
                ? topic.questions.filter((q) =>
                    (supplementAnswers[q.id] || []).some((a) => a.respondentId === viewingCollaborator.id)
                  ).length
                : topic.questions.filter((q) => session.answeredIds.includes(q.id)).length;
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
            {topicCollaborators.length > 0 && (
              <select
                className="topic-collab-select"
                value={viewRespondentId}
                onChange={(e) => setViewRespondentId(e.target.value)}
              >
                <option value="subject">本人回答</option>
                {topicCollaborators.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}（{c.relation}）的补充</option>
                ))}
              </select>
            )}
            {currentQuestion && session.answeredIds.includes(currentQuestion.id) && !viewingCollaborator && (
              <span className="answered-badge"><CheckCircle2 size={12} /> 已保存</span>
            )}
          </div>
          <div className="card-body workspace-body">
            {currentQuestion ? (
              <>
                <div className="question-box">
                  <div className="question-number">{session.currentQuestionIndex + 1}</div>
                  <div className="question-text">{displayedQuestion?.text}</div>
                </div>

                {viewingCollaborator && (
                  <div className="collab-mode-tip">
                    正在查看 {viewingCollaborator.name}（{viewingCollaborator.relation}）的补充问答，切回「本人回答」可继续采访。
                  </div>
                )}

                <div className="workspace-actions workspace-actions-top">
                  {!viewingCollaborator && (
                    <button className="btn btn-primary" onClick={saveCurrentAnswer} disabled={generatingFollowUp || !currentAnswer.trim()}>
                      <Save size={14} /> 保存本段
                    </button>
                  )}
                  <button className="btn btn-outline" onClick={handleNextQuestion} disabled={generatingFollowUp}>
                    下一题 <ChevronRight size={14} />
                  </button>
                  {!viewingCollaborator && (
                    <button className="btn btn-ghost" onClick={handleSkip} disabled={generatingFollowUp}>
                      <SkipForward size={14} /> 跳过问题
                    </button>
                  )}
                </div>

                {viewingCollaborator && (
                  <div className="answer-section">
                    <label className="section-label">
                      <Users size={14} /> {viewingCollaborator.name}（{viewingCollaborator.relation}）的补充回答
                    </label>
                    {viewingCollabAnswer ? (
                      <div className="viewing-answer-text">{viewingCollabAnswer}</div>
                    ) : (
                      <div className="transcript-empty">TA 还没有回答这道题</div>
                    )}
                  </div>
                )}

                {!viewingCollaborator && (
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
                )}

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

          <div className="card material-card">
            <div className="card-header">
              <h3 className="card-title"><FileUp size={14} /> 素材处理</h3>
            </div>
            <div className="card-body material-body">
              <button
                className="btn btn-outline material-btn"
                onClick={() => audioFileRef.current?.click()}
                disabled={transcribing}
              >
                <FileAudio size={14} /> 语音转文字
              </button>
              <input
                ref={audioFileRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac"
                style={{ display: 'none' }}
                onChange={handleAudioFile}
              />
              <button
                className="btn btn-outline material-btn"
                onClick={() => docFileRef.current?.click()}
              >
                <FileUp size={14} /> 采访记录导入
              </button>
              <input
                ref={docFileRef}
                type="file"
                accept=".txt,.md,.doc,.docx"
                style={{ display: 'none' }}
                onChange={handleDocFile}
              />
              {transcribing && (
                <div className="material-progress">
                  <div className="material-progress-text">语音转换中 {transcribeProgress}%</div>
                  <div className="material-progress-bar">
                    <div className="material-progress-fill" style={{ width: `${transcribeProgress}%` }} />
                  </div>
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
              <h3>邀请补充访谈者</h3>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">通过手机号或身份证号查找对方的账号并发出邀请，对方同意后才会成为协作者。</p>
              <div className="form-row">
                <label>手机号 / 身份证号</label>
                <div className="invite-search-row">
                  <input
                    type="text"
                    value={inviteQuery}
                    onChange={(e) => { setInviteQuery(e.target.value); setInviteFound(null); }}
                    placeholder="请输入对方注册的手机号或身份证号"
                  />
                  <button className="btn btn-outline" onClick={handleFindAccount}>查找</button>
                </div>
              </div>
              {inviteFound && (
                <div className="invite-found">
                  <Avatar name={inviteFound.name || inviteFound.phone} size={40} />
                  <div className="invite-found-info">
                    <strong>{inviteFound.name || '未设置姓名的用户'}</strong>
                    <span>{inviteFound.phone}</span>
                  </div>
                  <select value={inviteRelation} onChange={(e) => setInviteRelation(e.target.value)}>
                    {relationTypeOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={handleSendInvite}>发送邀请</button>
                </div>
              )}
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowInviteModal(false)}>取消</button>
              </div>
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
              {collaborators.length === 0 && pendingInvites.length === 0 ? (
                <div className="collab-empty">暂无协作者，点击「邀请补充」查找并邀请家人或朋友。</div>
              ) : (
                <>
                  {collaborators.length > 0 && (
                    <div className="collab-list">
                      {collaborators.map((c) => (
                        <div className="collab-item" key={c.id}>
                          <div className="collab-info">
                            <strong>{c.name}</strong>
                            <span>{c.relation}</span>
                            <span className="collab-count">已补充 {collaboratorAnswerCounts[c.id] || 0} 题</span>
                          </div>
                          <div className="collab-actions">
                            <button className="btn btn-ghost btn-sm danger" onClick={() => handleRemoveCollaborator(c.id)}>
                              移除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {pendingInvites.length > 0 && (
                    <div className="collab-list">
                      <div className="collab-section-title">待对方同意</div>
                      {pendingInvites.map((i) => (
                        <div className="collab-item" key={i.id}>
                          <div className="collab-info">
                            <strong>{i.targetPhone}</strong>
                            <span>{i.relation}</span>
                            <span className="collab-count">等待对方同意</span>
                          </div>
                          <div className="collab-actions">
                            <button
                              className="btn btn-ghost btn-sm danger"
                              onClick={() => {
                                revokeCollabInvite(i.id);
                                setInvitesRefresh((v) => v + 1);
                                addToast('邀请已撤销', 'info');
                              }}
                            >
                              撤销
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
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
