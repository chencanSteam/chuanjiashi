import { useEffect, useMemo, useRef, useState, useReducer } from 'react';
import {
  Mic,
  FolderOpen,
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Plus,
  X,
  Send,
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
  loadInterviewTranscript,
  loadSupplementAnswers,
  saveSupplementAnswers,
  addSupplementAnswer,
  createCollabInvite,
  invitesForArchive,
  revokeCollabInvite,
  findAccountByPhoneOrIdCard,
  findCollaboratorForUser,
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
import {
  generateInterviewTopics,
  saveCustomTopic,
  removeTopicForArchive,
  loadTopicProposals,
  submitTopicProposal,
  reviewTopicProposal,
  type InterviewTopicProposal,
} from '../utils/interviewTopics';
import { syncReviewEventToTimeline } from '../utils/eventSync';
import Annotate from '../components/annotation/Annotate';
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
  /** 该条对话所属的采访主题 */
  topic?: string;
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

  // 当前账号在该档案的协作者名单中 → 协助模式（回答计入补充素材）；否则为创建者（档案由本账号创建）
  const collaboratorRecord = findCollaboratorForUser(archiveId, user);
  const myCollaborator: RespondentInfo | null = collaboratorRecord
    ? {
        id: collaboratorRecord.id,
        name: user?.name || '协作人',
        relation: collaboratorRecord.relation || '协作人',
        isSubject: false,
      }
    : null;
  const currentRespondent: RespondentInfo = myCollaborator ?? {
    id: 'subject',
    name: subjectName,
    relation: '创建者',
    isSubject: true,
  };
  const isSubjectMode = currentRespondent.isSubject;

  // 每个回答者独立抽题与进度：AI 按各自对话生成问题，创建者与协助者的问题互不相同
  const respondentSuffix = myCollaborator ? `_${myCollaborator.id}` : '';
  const [topicRevision, setTopicRevision] = useState(0);
  const interviewTopics = generateInterviewTopics(archive, archiveId);
  const topicProposals = useMemo<InterviewTopicProposal[]>(
    () => loadTopicProposals(archiveId),
    [archiveId, topicRevision]
  );
  const transcriptCountFor = (collaboratorId: string) => loadInterviewTranscript(archiveId, collaboratorId).length;
  const pendingTopicProposals = topicProposals.filter((proposal) => proposal.status === 'pending');

  // 创建者=主导本传记的采访；协作者=协助传主的传记
  const respondentLabel = (r: RespondentInfo) =>
    r.isSubject ? `${r.name} · 创建者（主导本传记的采访）` : `${r.name} · ${r.relation}（协助${subjectName}的传记）`;

  // 传记选择：本账号创建的传记显示创建者，被邀请协助的传记显示协助；切换后重载页面以载入对应档案数据
  const allArchives = useMemo(() => loadJson<Archive[]>('cj_archives', []), []);
  const archiveOptions = allArchives.map((a) => {
    const collab = loadCollaborators(a.id).find((c) => c.name === user?.name);
    return {
      id: a.id,
      label: collab
        ? `${a.name} 的传记 · 协助（我是${collab.relation || '协作人'}）`
        : `${a.name} 的传记 · 创建者`,
    };
  });
  const handleSwitchArchive = (id: string) => {
    if (id === archiveId) return;
    localStorage.setItem('cj_current_archive_id', id);
    window.location.reload();
  };

  const [quota, setQuota] = useState<AIQuota | null>(null);

  useEffect(() => {
    quotaApi.get().then(setQuota).catch(() => {
      setQuota({ interviewQuestion: { used: 0, total: 999 }, followUp: { used: 0, total: 999 } } as AIQuota);
    });
  }, []);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    loadJson<Record<string, string>>(`cj_interview_answers_${archiveId}`, {})
  );
  // 转写/进度/视频按回答者独立存储
  const transcriptKey = `cj_interview_transcript_${archiveId}${respondentSuffix}`;
  const sessionKey = `cj_interview_session_${archiveId}${respondentSuffix}`;
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
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
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
  const [showFinishPrompt, setShowFinishPrompt] = useState(false);
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
  // 创建者视角：在主题区切换查看某位协助人的问答

  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const currentTopic = interviewTopics[session.currentTopicIndex];
  const currentQuestion = currentTopic?.questions[session.currentQuestionIndex];

  useEffect(() => {
    if (isSubjectMode) saveJson(`cj_interview_answers_${archiveId}`, answers);
  }, [answers, archiveId, isSubjectMode]);

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

  const currentFollowUps = currentQuestion ? session.followUps[currentQuestion.id] || [] : [];
  const activeFollowUp = activeFollowUpIndex !== null ? currentFollowUps[activeFollowUpIndex] : null;

  // 对话流：消息记录与当前待答问题
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  const [chatInput, setChatInput] = useState('');
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // AI 正在问的问题：优先延伸问题，其次当前未答主问题
  const pendingChatQuestion = activeFollowUp
    ? activeFollowUp.question
    : currentQuestion && !session.answeredIds.includes(currentQuestion.id)
      ? currentQuestion.text
      : null;

  // 发送回答：延伸问题回答或主问题回答
  const handleChatSend = () => {
    const text = chatInput.trim();
    if (!text || generatingFollowUp) return;
    setChatInput('');
    if (activeFollowUpIndex !== null) {
      setFollowUpAnswer(text);
      saveFollowUpAnswer(text);
    } else {
      setCurrentAnswer(text);
      saveCurrentAnswer(text);
    }
  };

  // 对话自动滚动到底部
  useEffect(() => {
    const el = chatBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [pendingChatQuestion, generatingFollowUp]);

  const nowTime = () =>
    new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  // 采访记录导入：选择文本/文档文件 → 读取内容作为一条采访记录

  const saveCurrentAnswer = async (textOverride?: string) => {
    if (!currentQuestion) return;
    const text = (textOverride ?? currentAnswer).trim();
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
        } catch {
          // 原型无后台时使用本地额度，不阻断采访流程
          setQuota((prev) => prev || { interviewQuestion: { used: 0, total: 999 }, followUp: { used: 0, total: 999 } } as AIQuota);
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
      { speaker: 'AI采访官', time: nowTime(), text: currentQuestion.text, topic: currentTopic?.title },
      { speaker: currentRespondent.name, time: nowTime(), text, topic: currentTopic?.title },
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
    } catch {
      // 原型无后台时使用本地追问逻辑，不因额度接口缺失中断采访
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
      // 对话流：AI 自动提出第一个新衍生的延伸问题
      setActiveFollowUpIndex(existing);
      setGeneratingFollowUp(false);
    }, 800);
  };

  const formatSeconds = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // 语音回答：浏览器支持时用 Web Speech API 实时录制转写；不支持时回退模拟转写
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const startVoiceRecord = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = 'zh-CN';
      rec.continuous = true;
      rec.interimResults = true;
      let finalText = '';
      rec.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i += 1) {
          if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        setChatInput((finalText + interim).trim());
      };
      rec.onerror = () => {
        // 实时转写服务不可用（无麦克风/网络服务受限）时回退模拟录制，不打断录音流程
        recognitionRef.current = null;
        addToast('实时转写不可用，已切换为普通录制', 'info');
      };
      rec.onend = () => {
        // 已回退模拟录制时不清除录音状态
        if (recognitionRef.current) setRecordingVoice(false);
      };
      recognitionRef.current = rec;
      try {
        rec.start();
        setRecordingVoice(true);
        setVoiceSeconds(0);
        addToast('开始录制，正在实时转写…', 'info');
      } catch {
        // 无法启动实时转写（无麦克风/权限被拒）时回退模拟录制
        recognitionRef.current = null;
        setRecordingVoice(true);
        setVoiceSeconds(0);
        addToast('开始录制语音回答…', 'info');
      }
    } else {
      setRecordingVoice(true);
      setVoiceSeconds(0);
      addToast('开始录制语音回答…', 'info');
    }
  };

  const stopVoiceRecord = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      addToast('语音转写已完成', 'success');
    } else {
      const mockTranscript = '[语音转写] 我用语音回答了这个问题，讲述了当时真实的经历和感受。';
      setChatInput((prev) => (prev.trim() ? `${prev}\n\n${mockTranscript}` : mockTranscript));
      addToast('语音回答已转写', 'success');
    }
    setRecordingVoice(false);
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
      // 已是最后一个主题的最后一题：引导用户结束采访
      setShowFinishPrompt(true);
      return;
    }
    setSession((prev) => ({
      ...prev,
      currentTopicIndex: nextTopicIndex,
      currentQuestionIndex: nextQuestionIndex,
    }));
    setCurrentAnswer(answerFor(nextTopicIndex, nextQuestionIndex));
    setRecordingVoice(false);
    setVoiceSeconds(0);
  };

  const handleNextQuestion = async () => {
    if (currentAnswer.trim() && currentQuestion && !session.answeredIds.includes(currentQuestion.id)) {
      await saveCurrentAnswer();
      setTimeout(moveToNext, 300);
    } else {
      moveToNext();
    }
  };

  // 删除主题（预设/标签/自定义均可删除，按档案记录，刷新后仍隐藏）
  const handleRemoveTopic = (topic: { id: string; title: string }) => {
    if (!window.confirm(`确定删除主题「${topic.title}」吗？该主题的问题与回答进度将一并隐藏。`)) return;
    removeTopicForArchive(archiveId, topic.id);
    // 回到第一个主题并刷新其回答内容
    const freshTopics = generateInterviewTopics(archive, archiveId);
    const firstQ = freshTopics[0]?.questions[0];
    setSession((prev) => ({ ...prev, currentTopicIndex: 0, currentQuestionIndex: 0 }));
    setCurrentAnswer(firstQ ? (myCollaborator ? '' : answers[firstQ.id] || firstQ.mockAnswer) : '');
    addToast(`主题「${topic.title}」已删除`, 'info');
    forceUpdate();
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
    setRecordingVoice(false);
    setVoiceSeconds(0);
    setActiveFollowUpIndex(null);
    setFollowUpAnswer('');
  };

  const handleAddCustomTopic = () => {
    const title = customTopicTitle.trim();
    if (!title) {
      addToast('请输入主题名称', 'error');
      return;
    }
    if (myCollaborator) {
      submitTopicProposal(archiveId, {
        id: myCollaborator.id,
        name: myCollaborator.name,
        phone: collaboratorRecord?.phone,
        relation: myCollaborator.relation,
      }, { title, summary: customTopicSummary.trim() });
      addToast(`主题「${title}」已提交，待本人确认后进入正式采访`, 'success');
    } else {
      saveCustomTopic(archiveId, { title, summary: customTopicSummary.trim() });
      addToast(`已添加自定义主题「${title}」`, 'success');
    }
    setCustomTopicTitle('');
    setCustomTopicSummary('');
    setShowCustomTopic(false);
    setTopicRevision((v) => v + 1);
    forceUpdate();
  };

  const saveFollowUpAnswer = (textOverride?: string) => {
    const text = (textOverride ?? followUpAnswer).trim();
    if (!currentQuestion || activeFollowUpIndex === null || !text) return;
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
      { speaker: 'AI采访官·延伸', time: nowTime(), text: questionText, topic: currentTopic?.title },
      { speaker: currentRespondent.name, time: nowTime(), text, topic: currentTopic?.title },
    ]);
    setActiveFollowUpIndex(null);
    setFollowUpAnswer('');

    // 创建者回答追问后，AI 可继续衍生新问题（仍受每题 3 次追问上限约束）
    if (currentRespondent.isSubject) {
      generateFollowUps(currentQuestion.id, 1);
      // 对话流收尾：没有更多待答追问时，自动进入下一道主问题
      const qid = currentQuestion.id;
      setTimeout(() => {
        const list = sessionRef.current.followUps[qid] || [];
        const pendingIdx = list.findIndex((f) => !f.answered);
        if (pendingIdx >= 0) {
          setActiveFollowUpIndex(pendingIdx);
        } else {
          setActiveFollowUpIndex(null);
          handleNextQuestion();
        }
      }, 950);
    }
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
      scope: 'interview',
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

  const handleReviewTopicProposal = (proposal: InterviewTopicProposal, decision: 'approved' | 'rejected') => {
    reviewTopicProposal(archiveId, proposal.id, decision, { name: user?.name || subjectName, phone: user?.phone });
    setTopicRevision((v) => v + 1);
    addToast(decision === 'approved' ? `已通过主题「${proposal.topic.title}」` : `已拒绝主题「${proposal.topic.title}」`, 'success');
  };

  const handleRemoveCollaborator = (id: string) => {
    removeCollaborator(archiveId, id);
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
    addToast('协作者已移除，历史采访记录仍会保留', 'info');
  };

  return (
    <div className="interview-page">
      <header className="page-header interview-header">
        <h1 className="page-title">AI智能采访</h1>
        <div className="interview-header-actions">
          <Annotate id="interview.archive-switch" inline>
          <div className="archive-switch-row header-switch">
            <span className="respondent-label">选择传记</span>
            <select value={archiveId} onChange={(e) => handleSwitchArchive(e.target.value)}>
              {archiveOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          </Annotate>
          {isSubjectMode && (
            <Annotate id="interview.end-interview" inline>
            <button className="btn btn-primary end-interview-btn" onClick={endInterview}>
              <FolderOpen size={14} /> 结束采访并整理
            </button>
            </Annotate>
          )}
        </div>
      </header>

      <div className="interview-top-stats">
        <div className="card stat-person">
          <div className="card-body">
            <div className="stat-label-text">传记主</div>
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
            <Annotate id="interview.respondent">
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
            </Annotate>
            {!isSubjectMode && (
              <div className="collab-mode-tip">
                你正在协助 {subjectName} 的传记采访，你的回答会作为补充素材，不影响采访进度。
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="interview-grid">
        <div className="card topic-card">
          <div className="card-header">
            <h3 className="card-title">采访主题</h3>
            <span className="card-extra">{interviewTopics.length} 个主题</span>
          </div>
          <Annotate id="interview.topic-list">
          <div className="card-body topic-body">
            {interviewTopics.map((topic, ti) => {
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
                  {isSubjectMode && (
                    <span
                      className="topic-delete"
                      title="删除该主题"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTopic(topic);
                      }}
                    >
                      <X size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          </Annotate>
          <Annotate id="interview.custom-topic">
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
          </Annotate>
          {myCollaborator && topicProposals.filter((p) => p.proposerId === myCollaborator.id).length > 0 && (
            <div className="topic-proposal-panel my-topic-proposals">
              <div className="topic-proposal-panel-title">我提出的主题</div>
              {topicProposals.filter((p) => p.proposerId === myCollaborator.id).map((proposal) => (
                <div className="topic-proposal-status" key={proposal.id}>
                  <strong>{proposal.topic.title}</strong>
                  <span className={`proposal-status ${proposal.status}`}>
                    {proposal.status === 'pending' ? '待本人确认' : proposal.status === 'approved' ? '已通过' : proposal.status === 'rejected' ? `已拒绝${proposal.rejectionReason ? `：${proposal.rejectionReason}` : ''}` : '已撤回'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Annotate id="interview.chat">
        <div className="card chat-card">
          <div className="card-header">
            <h3 className="card-title">
              <Mic size={16} /> 采访对话
            </h3>
          </div>
          <div className="chat-body" ref={chatBodyRef}>
            {!currentQuestion ? (
              <div className="interview-done">
                <CheckCircle2 size={48} color="#1B5E4B" />
                <h3>本阶段采访问题已全部完成</h3>
                <p>您可以结束采访，进入整理页面。</p>
                <button className="btn btn-primary" onClick={endInterview}>
                  <FolderOpen size={14} /> 结束采访并整理
                </button>
              </div>
            ) : (
              // 中间只显示 AI 当前正在问的问题，历史见右侧对话记录
              <div className="chat-question-stage">
                <Avatar name="AI" size={72} />
                <div className="chat-question-name">AI 采访官</div>
                {pendingChatQuestion ? (
                  <div className="chat-question-text">{pendingChatQuestion}</div>
                ) : (
                  <div className="chat-empty">从左侧选择主题，AI 采访官将开始提问</div>
                )}
                {generatingFollowUp && (
                  <div className="chat-question-typing">正在根据回答思考延伸问题…</div>
                )}
              </div>
                        )}
          </div>
          {currentQuestion && (
            recordingVoice ? (
              <div className="chat-recording-bar">
                <span className="chat-recording-dot" />
                <div className="chat-recording-wave">
                  {Array.from({ length: 24 }, (_, i) => <span key={i} />)}
                </div>
                <span className="chat-recording-time">{formatSeconds(voiceSeconds)}</span>
                <button className="chat-recording-stop" onClick={stopVoiceRecord}>结束</button>
              </div>
            ) : (
            <div className="chat-input-bar">
              <button
                className="chat-mic-btn"
                onClick={startVoiceRecord}
                title="语音回答"
              >
                <Mic size={16} />
              </button>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleChatSend();
                  }
                }}
                placeholder={activeFollowUp ? '回答这个延伸问题…' : '输入回答，或点左侧话筒口述…'}
              />
              <button className="chat-send-btn" onClick={handleChatSend} disabled={!chatInput.trim() || generatingFollowUp}>
                <Send size={16} />
              </button>
            </div>
            )
          )}
        </div>
        </Annotate>

        <div className="interview-right">
          <Annotate id="interview.transcript">
          <div className="card transcript-card">
            <div className="card-header">
              <h3 className="card-title"><BookOpen size={14} /> 对话记录</h3>
              <div className="card-extra"><Clock size={12} /> 自动保存</div>
            </div>
            <div className="card-body transcript-body">
              {transcript.length === 0 ? (
                <div className="transcript-empty">采访开始后，对话记录会实时出现在这里</div>
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
          </Annotate>

          {quota && quota.interviewQuestion.used >= quota.interviewQuestion.total && (
            <Annotate id="interview.quota-alert" inline>
            <div className="card alert-card">
              <div className="card-body alert-body">
                <AlertCircle size={18} />
                <span>AI采访问题额度已用完，整理已有素材即可生成传记。</span>
              </div>
            </div>
            </Annotate>
          )}
        </div>
      </div>

      {showFinishPrompt && (
        <div className="modal-overlay" onClick={() => setShowFinishPrompt(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>已是最后一题</h3>
              <button className="modal-close" onClick={() => setShowFinishPrompt(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">采访问题已全部完成。您可以结束采访并查看整理好的采访记录，也可以返回继续检查或补充回答。</p>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowFinishPrompt(false)}>继续检查</button>
                <button className="btn btn-primary" onClick={() => { setShowFinishPrompt(false); endInterview(); }}>
                  <FolderOpen size={14} /> 结束采访并整理
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFindAccount();
                      }
                    }}
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
                  {isSubjectMode && pendingTopicProposals.length > 0 && (
                    <div className="topic-proposal-panel">
                      <div className="topic-proposal-panel-title">协助人新增主题待确认 ({pendingTopicProposals.length})</div>
                      {pendingTopicProposals.map((proposal) => (
                        <div className="topic-proposal-item" key={proposal.id}>
                          <div className="topic-proposal-head"><strong>{proposal.topic.title}</strong><span>{proposal.proposerName} · {proposal.proposerRelation}</span></div>
                          <p>{proposal.topic.summary || '暂无主题说明'}</p>
                          <div className="topic-proposal-actions">
                            <button className="btn btn-primary btn-sm" onClick={() => handleReviewTopicProposal(proposal, 'approved')}>通过</button>
                            <button className="btn btn-ghost btn-sm danger" onClick={() => handleReviewTopicProposal(proposal, 'rejected')}>拒绝</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {collaborators.length > 0 && (
                    <div className="collab-list">
                      {collaborators.map((c) => (
                        <div className="collab-item" key={c.id}>
                          <div className="collab-info">
                            <strong>{c.name}</strong>
                            <span>{c.relation}</span>
                            <span className="collab-count">对话 {transcriptCountFor(c.id)} 条</span>
                          </div>
                          <div className="collab-actions">
                            <button className="btn btn-outline btn-sm" onClick={() => { setShowCollaborators(false); navigate(`/interview-review?respondent=${c.id}`); }}>
                              查看对话
                            </button>
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
                            <span className="collab-count">{i.scope === 'edit' ? '邀请协助修改传记' : '邀请协助采访'} · 等待对方同意</span>
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


    </div>
  );
}
