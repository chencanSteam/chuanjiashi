import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Sparkles, CheckCircle2, ChevronDown, Mic, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateInterviewTopics } from '../../utils/interviewTopics';
import { followUpQuestionsPool } from '../../data/aiMock';
import { quotaApi } from '../../api/quota';
import { useToast } from '../../hooks/useToast';
import Annotate from '../../components/annotation/Annotate';
import './MobileInterview.css';

interface Archive {
  id: string;
  name: string;
  gender?: '男' | '女';
  birthYear: string;
  origin: string;
  occupation: string;
  tags?: string[];
}

// 与 Web 端一致的转写结构（存 cj_interview_transcript_*），topicId/category 为移动端按主题分组的附加字段，Web 端渲染时忽略
interface TranscriptLine {
  speaker: string;
  time: string;
  text: string;
  topicId?: string;
  category?: string;
}

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  time?: string;
  category?: string;
  topicId?: string;
}

// 与 Web 端一致：进度/回答/转写共用同一组 key
interface InterviewSessionState {
  currentTopicIndex: number;
  currentQuestionIndex: number;
  answeredIds: string[];
  skippedIds: string[];
  followUps: Record<string, { question: string; userAnswer?: string; answered: boolean }[]>;
}

const AI_SPEAKER = 'AI采访官';
// 与 Web 端一致：每个问题的 AI 追问不超过 3 次
const MAX_FOLLOW_UPS_PER_QUESTION = 3;

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

function loadArchives(): Archive[] {
  return loadJson<Archive[]>('cj_archives', []);
}

function loadCurrentArchive(): Archive | null {
  const currentId = localStorage.getItem('cj_current_archive_id');
  const archives = loadArchives();
  return archives.find((a) => a.id === currentId) || null;
}

function transcriptToMessages(lines: TranscriptLine[]): ChatMessage[] {
  return lines.map((l, i) => ({
    id: `line_${i}`,
    role: l.speaker.startsWith(AI_SPEAKER) ? 'ai' : 'user',
    text: l.text,
    time: l.time,
    category: l.category,
    topicId: l.topicId,
  }));
}

function messagesToTranscript(msgs: ChatMessage[], userName: string): TranscriptLine[] {
  return msgs.map((m) => ({
    speaker: m.role === 'ai' ? AI_SPEAKER : userName,
    time: m.time || '',
    text: m.text,
    topicId: m.topicId,
    category: m.category,
  }));
}

// 旧版移动端私有转写 key 一次性迁移到 Web 共用 key
function migrateLegacyTranscript(archiveId: string, userName: string) {
  const legacyKey = `cj_interview_transcript_mobile_${archiveId}`;
  const legacy = loadJson<ChatMessage[]>(legacyKey, []);
  if (legacy.length === 0) return;
  const sharedKey = `cj_interview_transcript_${archiveId}`;
  const existing = loadJson<TranscriptLine[]>(sharedKey, []);
  if (existing.length === 0) {
    saveJson(sharedKey, messagesToTranscript(legacy, userName));
  }
  try {
    localStorage.removeItem(legacyKey);
  } catch {
    // ignore
  }
}

export default function MobileInterview() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  const [archive] = useState<Archive | null>(() => loadCurrentArchive());
  const archiveId = archive?.id || '';
  const subjectName = archive?.name || '受访者';
  const allArchives = useMemo(() => loadArchives(), []);

  // 主题与 Web 端一致：同一套 generateInterviewTopics（含后台配置、标签主题、自定义主题）
  const topics = useMemo(
    () => (archive ? generateInterviewTopics(archive, archiveId) : []),
    [archive, archiveId]
  );

  // 与 Web 端共用同一组 key
  const answersKey = `cj_interview_answers_${archiveId}`;
  const sessionKey = `cj_interview_session_${archiveId}`;
  const transcriptKey = `cj_interview_transcript_${archiveId}`;

  const [session, setSession] = useState<InterviewSessionState>(() =>
    loadJson<InterviewSessionState>(sessionKey, {
      currentTopicIndex: 0,
      currentQuestionIndex: 0,
      answeredIds: [],
      skippedIds: [],
      followUps: {},
    })
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!archiveId) return [];
    migrateLegacyTranscript(archiveId, subjectName);
    const stored = transcriptToMessages(loadJson<TranscriptLine[]>(transcriptKey, []));
    // 兼容旧数据：没有 topicId 的消息按 category（主题名）补挂到对应主题
    return stored.map((m) =>
      m.topicId ? m : { ...m, topicId: topics.find((t) => t.title === m.category)?.id || topics[0]?.id }
    );
  });
  const [input, setInput] = useState('');
  const [generatingFollowUp, setGeneratingFollowUp] = useState(false);
  // 当前待答的延伸问题下标（对应当前主问题的 followUps 列表），与 Web 端 activeFollowUpIndex 同义
  const [activeFollowUpIndex, setActiveFollowUpIndex] = useState<number | null>(null);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 拍平问题列表，便于计算下一题与整体进度
  const flatQuestions = useMemo(
    () =>
      topics.flatMap((t, ti) =>
        t.questions.map((q, qi) => ({ ti, qi, id: q.id, text: q.text, topicTitle: t.title, topicId: t.id }))
      ),
    [topics]
  );

  const currentTopic = topics[session.currentTopicIndex];
  const currentQuestion = currentTopic?.questions[session.currentQuestionIndex];
  const isCompleted =
    flatQuestions.length > 0 && flatQuestions.every((f) => session.answeredIds.includes(f.id));
  const currentFollowUps = currentQuestion ? session.followUps[currentQuestion.id] || [] : [];
  const activeFollowUp = activeFollowUpIndex !== null ? currentFollowUps[activeFollowUpIndex] : null;

  // 对话内容按主题隔离：只显示当前主题的问答
  const visibleMessages = currentTopic
    ? messages.filter((m) => m.topicId === currentTopic.id)
    : messages;

  const nowTime = () =>
    new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  // 首次进入：写入欢迎语与当前问题
  useEffect(() => {
    if (!archive || seededRef.current) return;
    seededRef.current = true;
    if (messages.length > 0) return;
    const seed: ChatMessage[] = [
      {
        id: 'welcome',
        role: 'ai',
        text: `您好，我是您的 AI 采访助手。接下来我会和您聊聊${archive.name}的人生故事，您可以像聊天一样回答。`,
        time: nowTime(),
        topicId: currentTopic?.id || topics[0]?.id,
      },
    ];
    if (isCompleted) {
      seed.push({
        id: 'done',
        role: 'ai',
        text: '本次采访的全部主题都已完成！您可以在“人生档案”中查看整理好的内容，或去生成 AI 传记。',
        time: nowTime(),
        topicId: currentTopic?.id || topics[0]?.id,
      });
    } else if (currentTopic && currentQuestion) {
      seed.push({
        id: currentQuestion.id,
        role: 'ai',
        text: currentQuestion.text,
        time: nowTime(),
        category: currentTopic.title,
        topicId: currentTopic.id,
      });
    }
    setMessages(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archive]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (archiveId) saveJson(sessionKey, session);
  }, [session, sessionKey, archiveId]);

  // 转写保存到与 Web 端共用的 key，两端对话互相可见
  useEffect(() => {
    if (archiveId) saveJson(transcriptKey, messagesToTranscript(messages, subjectName));
  }, [messages, transcriptKey, archiveId, subjectName]);

  // 语音录制计时（与 Web 端一致）
  useEffect(() => {
    if (recordingVoice) {
      voiceTimerRef.current = setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
    } else if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    return () => { if (voiceTimerRef.current) clearInterval(voiceTimerRef.current); };
  }, [recordingVoice]);

  // 选择传记：与 Web 端一致，切换当前档案后重载以载入对应数据
  const handleSwitchArchive = (id: string) => {
    if (!id || id === archiveId) return;
    localStorage.setItem('cj_current_archive_id', id);
    window.location.reload();
  };

  // 选择主题：切换对话内容到该主题；该主题还没有对话时，AI 发出第一个问题
  const handleSelectTopic = (ti: number) => {
    const topic = topics[ti];
    if (!topic || ti === session.currentTopicIndex) return;
    const hasHistory = messages.some((m) => m.topicId === topic.id);
    const firstUnanswered = topic.questions.findIndex((q) => !session.answeredIds.includes(q.id));
    const qi = firstUnanswered >= 0 ? firstUnanswered : 0;
    const q = topic.questions[qi];
    setActiveFollowUpIndex(null);
    setSession((prev) => ({ ...prev, currentTopicIndex: ti, currentQuestionIndex: qi }));
    if (!hasHistory && q) {
      setMessages((prev) => [
        ...prev,
        {
          id: `t_${Date.now()}`,
          role: 'ai',
          category: topic.title,
          topicId: topic.id,
          time: nowTime(),
          text: q.text,
        },
      ]);
    }
  };

  // 推进到下一道未答主问题；没有则发出完成语
  const appendNextMainQuestion = (
    msgs: ChatMessage[],
    answeredIds: string[],
    afterQid: string
  ): ChatMessage[] => {
    const curFlatIndex = flatQuestions.findIndex((f) => f.id === afterQid);
    const nextQ = flatQuestions.slice(curFlatIndex + 1).find((f) => !answeredIds.includes(f.id));
    if (nextQ) {
      setSession((prev) => ({ ...prev, currentTopicIndex: nextQ.ti, currentQuestionIndex: nextQ.qi }));
      msgs.push({
        id: nextQ.id,
        role: 'ai',
        text: nextQ.text,
        time: nowTime(),
        category: nextQ.topicTitle,
        topicId: nextQ.topicId,
      });
    } else {
      msgs.push({
        id: `done_${Date.now()}`,
        role: 'ai',
        text: '感谢您完成本次采访！您可以在“人生档案”中查看整理好的内容，或去生成 AI 传记。',
        time: nowTime(),
        topicId: currentTopic?.id,
      });
    }
    return msgs;
  };

  // 与 Web 端一致：主问题回答后自动生成延伸问题（每次最多 2 个，每题累计上限 3 个）
  const generateFollowUps = async (questionId: string, answeredIds: string[]) => {
    const existing = session.followUps[questionId]?.length ?? 0;
    const count = Math.min(2, MAX_FOLLOW_UPS_PER_QUESTION - existing);
    if (count <= 0) {
      setMessages((prev) => appendNextMainQuestion([...prev], answeredIds, questionId));
      return;
    }
    try {
      await quotaApi.consume('followUp');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '延伸问题额度不足', 'error');
      // 额度不足：不再追问，直接进入下一道主问题
      setMessages((prev) => appendNextMainQuestion([...prev], answeredIds, questionId));
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
      // AI 自动提出第一个新衍生的延伸问题
      setActiveFollowUpIndex(existing);
      setMessages((prev) => [
        ...prev,
        {
          id: `f_${Date.now()}`,
          role: 'ai',
          text: questions[0],
          time: nowTime(),
          category: '延伸问题',
          topicId: currentTopic?.id,
        },
      ]);
      setGeneratingFollowUp(false);
    }, 800);
  };

  const handleSend = async () => {
    const answerText = input.trim();
    if (!answerText || !archive || !currentTopic || !currentQuestion || isCompleted || generatingFollowUp) return;
    setInput('');

    // 回答延伸问题：写入 session.followUps（结构与 Web 端一致）
    if (activeFollowUpIndex !== null && activeFollowUp) {
      const qid = currentQuestion.id;
      const idx = activeFollowUpIndex;
      const updatedFollowUps = currentFollowUps.map((f, i) =>
        i === idx ? { ...f, userAnswer: answerText, answered: true } : f
      );
      setSession((prev) => ({
        ...prev,
        followUps: { ...prev.followUps, [qid]: updatedFollowUps },
      }));
      const nextMsgs: ChatMessage[] = [
        ...messages,
        { id: `u_${Date.now()}`, role: 'user', text: answerText, time: nowTime(), topicId: currentTopic.id },
      ];
      const nextUnanswered = updatedFollowUps.findIndex((f) => !f.answered);
      if (nextUnanswered >= 0) {
        setActiveFollowUpIndex(nextUnanswered);
        nextMsgs.push({
          id: `f_${Date.now()}_n`,
          role: 'ai',
          text: updatedFollowUps[nextUnanswered].question,
          time: nowTime(),
          category: '延伸问题',
          topicId: currentTopic.id,
        });
        setMessages(nextMsgs);
      } else {
        setActiveFollowUpIndex(null);
        setMessages(appendNextMainQuestion(nextMsgs, session.answeredIds, qid));
      }
      return;
    }

    // 回答主问题（与 Web 端一致：首次回答消耗 interviewQuestion 额度，不足则拦截不保存）
    const qid = currentQuestion.id;
    const firstAnswer = !session.answeredIds.includes(qid);
    if (firstAnswer) {
      try {
        await quotaApi.consume('interviewQuestion');
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'AI采访问题额度不足', 'error');
        setInput(answerText);
        return;
      }
    }

    // 回答写入与 Web 端共用的 key，Web 端采访整理与传记生成可直接使用
    saveJson(answersKey, { ...loadJson<Record<string, string>>(answersKey, {}), [qid]: answerText });
    const newAnsweredIds = firstAnswer ? [...session.answeredIds, qid] : session.answeredIds;
    setSession((prev) => ({
      ...prev,
      answeredIds: newAnsweredIds,
      skippedIds: prev.skippedIds.filter((id) => id !== qid),
    }));
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: 'user', text: answerText, time: nowTime(), topicId: currentTopic.id },
    ]);

    // 与 Web 端一致：主问题回答后自动生成延伸问题
    generateFollowUps(qid, newAnsweredIds);
  };

  // 语音回答：与 Web 端一致，浏览器支持时用 Web Speech API 实时转写；不支持时回退模拟转写
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
        setInput((finalText + interim).trim());
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
      setInput((prev) => (prev.trim() ? `${prev}\n\n${mockTranscript}` : mockTranscript));
      addToast('语音回答已转写', 'success');
    }
    setRecordingVoice(false);
  };

  const formatSeconds = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (!archive) {
    return (
      <Annotate id="mobile-interview.empty-state">
      <div className="mobile-interview-empty">
        <p>暂无档案</p>
        <button onClick={() => navigate('/m')}>返回首页</button>
      </div>
      </Annotate>
    );
  }

  return (
    <div className="mobile-interview">
      {/* 传记选择：与 Web 端一致，可切换采访对象 */}
      <div className="mobile-interview-info">
        <Annotate id="mobile-interview.archive-switch" inline>
        <div className="mobile-interview-archive-select">
          <select value={archiveId} onChange={(e) => handleSwitchArchive(e.target.value)}>
            {allArchives.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} 的传记
              </option>
            ))}
          </select>
          <ChevronDown size={14} />
        </div>
        </Annotate>
        <span className="mobile-interview-status">
          {isCompleted ? <CheckCircle2 size={18} color="#2da44e" /> : <Sparkles size={18} />}
        </span>
      </div>

      {/* 主题选择：与 Web 端一致的采访主题 */}
      <Annotate id="mobile-interview.topic-tabs">
      <div className="mobile-interview-topics">
        {topics.map((t, ti) => (
          <button
            key={t.id}
            type="button"
            className={`mobile-interview-topic${ti === session.currentTopicIndex ? ' active' : ''}`}
            onClick={() => handleSelectTopic(ti)}
          >
            {t.title}
          </button>
        ))}
      </div>
      </Annotate>

      <Annotate id="mobile-interview.chat">
      <div className="mobile-interview-chat" ref={scrollRef}>
        {visibleMessages.map((msg) => (
          <div key={msg.id} className={`mobile-interview-message ${msg.role}`}>
            {msg.role === 'ai' && (
              <div className="mobile-interview-avatar">AI</div>
            )}
            <div className="mobile-interview-bubble">
              {msg.category && <span className="mobile-interview-category">{msg.category}</span>}
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        {generatingFollowUp && (
          <div className="mobile-interview-message ai">
            <div className="mobile-interview-avatar">AI</div>
            <div className="mobile-interview-bubble">
              <p>正在根据您的回答生成延伸问题…</p>
            </div>
          </div>
        )}
      </div>
      </Annotate>

      {recordingVoice && (
        <div className="mobile-interview-recording">正在录音 {formatSeconds(voiceSeconds)}，点击下方按钮结束</div>
      )}

      {isCompleted ? (
        <div className="mobile-interview-done">
          <div className="mobile-interview-done-text">
            <CheckCircle2 size={16} /> 采访已全部完成
          </div>
          <div className="mobile-interview-done-actions">
            <button className="mobile-interview-done-btn secondary" onClick={() => navigate('/interview-review')}>
              查看采访记录
            </button>
            <button className="mobile-interview-done-btn primary" onClick={() => navigate('/biography')}>
              去生成传记
            </button>
          </div>
        </div>
      ) : (
      <Annotate id="mobile-interview.input-bar">
      <div className="mobile-interview-inputbar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={activeFollowUp ? '请回答延伸问题…' : '请输入您的回答…'}
        />
        <button
          className={`mobile-interview-mic${recordingVoice ? ' recording' : ''}`}
          onClick={recordingVoice ? stopVoiceRecord : startVoiceRecord}
          title={recordingVoice ? '结束录音' : '语音回答'}
        >
          {recordingVoice ? <Square size={16} /> : <Mic size={20} />}
        </button>
        <button
          className="mobile-interview-send"
          onClick={handleSend}
          disabled={!input.trim() || generatingFollowUp}
        >
          <Send size={20} />
        </button>
      </div>
      </Annotate>
      )}
    </div>
  );
}
