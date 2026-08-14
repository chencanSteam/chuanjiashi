import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Sparkles, CheckCircle2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateInterviewTopics } from '../../utils/interviewTopics';
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

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  category?: string;
  topicId?: string;
}

// 与 Web 端一致：进度/回答共用同一组 key（本人视角），转写记录移动端独立存储
interface InterviewSessionState {
  currentTopicIndex: number;
  currentQuestionIndex: number;
  answeredIds: string[];
  skippedIds: string[];
  followUps: Record<string, { question: string; userAnswer?: string; answered: boolean }[]>;
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

function loadArchives(): Archive[] {
  return loadJson<Archive[]>('cj_archives', []);
}

function loadCurrentArchive(): Archive | null {
  const currentId = localStorage.getItem('cj_current_archive_id');
  const archives = loadArchives();
  return archives.find((a) => a.id === currentId) || null;
}

export default function MobileInterview() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  const [archive] = useState<Archive | null>(() => loadCurrentArchive());
  const archiveId = archive?.id || '';
  const allArchives = useMemo(() => loadArchives(), []);

  // 主题与 Web 端一致：同一套 generateInterviewTopics（含后台配置、标签主题、自定义主题）
  const topics = useMemo(
    () => (archive ? generateInterviewTopics(archive, archiveId) : []),
    [archive, archiveId]
  );

  const answersKey = `cj_interview_answers_${archiveId}`;
  const sessionKey = `cj_interview_session_${archiveId}`;
  const transcriptKey = `cj_interview_transcript_mobile_${archiveId}`;

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
    const stored = loadJson<ChatMessage[]>(transcriptKey, []);
    // 兼容旧数据：没有 topicId 的消息按 category（主题名）补挂到对应主题
    return stored.map((m) =>
      m.topicId ? m : { ...m, topicId: topics.find((t) => t.title === m.category)?.id || topics[0]?.id }
    );
  });
  const [input, setInput] = useState('');

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

  // 对话内容按主题隔离：只显示当前主题的问答
  const visibleMessages = currentTopic
    ? messages.filter((m) => m.topicId === currentTopic.id)
    : messages;

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
        topicId: currentTopic?.id || topics[0]?.id,
      },
    ];
    if (isCompleted) {
      seed.push({
        id: 'done',
        role: 'ai',
        text: '本次采访的全部主题都已完成！您可以在“人生档案”中查看整理好的内容，或去生成 AI 传记。',
        topicId: currentTopic?.id || topics[0]?.id,
      });
    } else if (currentTopic && currentQuestion) {
      seed.push({
        id: currentQuestion.id,
        role: 'ai',
        text: currentQuestion.text,
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

  useEffect(() => {
    if (archiveId) saveJson(transcriptKey, messages);
  }, [messages, transcriptKey, archiveId]);

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
    setSession((prev) => ({ ...prev, currentTopicIndex: ti, currentQuestionIndex: qi }));
    if (!hasHistory && q) {
      setMessages((prev) => [
        ...prev,
        {
          id: `t_${Date.now()}`,
          role: 'ai',
          category: topic.title,
          topicId: topic.id,
          text: q.text,
        },
      ]);
    }
  };

  const handleSend = () => {
    const answerText = input.trim();
    if (!answerText || !archive || !currentTopic || !currentQuestion || isCompleted) return;

    const qid = currentQuestion.id;
    const newAnsweredIds = session.answeredIds.includes(qid)
      ? session.answeredIds
      : [...session.answeredIds, qid];

    const next: ChatMessage[] = [
      ...messages,
      { id: `u_${Date.now()}`, role: 'user', text: answerText, topicId: currentTopic.id },
    ];

    // 回答写入与 Web 端共用的 key，Web 端传记生成可直接使用
    saveJson(answersKey, { ...loadJson<Record<string, string>>(answersKey, {}), [qid]: answerText });
    setInput('');

    // 找下一道未回答的问题（按主题顺序往后）
    const curFlatIndex = flatQuestions.findIndex((f) => f.id === qid);
    const nextQ = flatQuestions
      .slice(curFlatIndex + 1)
      .find((f) => !newAnsweredIds.includes(f.id));

    if (nextQ) {
      setSession((prev) => ({
        ...prev,
        answeredIds: newAnsweredIds,
        currentTopicIndex: nextQ.ti,
        currentQuestionIndex: nextQ.qi,
      }));
      next.push({
        id: nextQ.id,
        role: 'ai',
        text: nextQ.text,
        category: nextQ.topicTitle,
        topicId: nextQ.topicId,
      });
    } else {
      setSession((prev) => ({ ...prev, answeredIds: newAnsweredIds }));
      next.push({
        id: `done_${Date.now()}`,
        role: 'ai',
        text: '感谢您完成本次采访！您可以在“人生档案”中查看整理好的内容，或去生成 AI 传记。',
        topicId: currentTopic.id,
      });
    }
    setMessages(next);
  };

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
      </div>
      </Annotate>

      <Annotate id="mobile-interview.input-bar">
      <div className="mobile-interview-inputbar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isCompleted ? '采访已完成' : '请输入您的回答…'}
          disabled={isCompleted}
        />
        <button
          className="mobile-interview-send"
          onClick={handleSend}
          disabled={!input.trim() || isCompleted}
        >
          <Send size={20} />
        </button>
      </div>
      </Annotate>
    </div>
  );
}
