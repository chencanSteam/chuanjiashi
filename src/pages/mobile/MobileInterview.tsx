import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { interviewApi } from '../../api/interview';
import { useToast } from '../../hooks/useToast';
import './MobileInterview.css';

interface Archive {
  id: string;
  name: string;
  birthYear: string;
  origin: string;
  occupation: string;
}

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  category?: string;
}

interface CurrentQuestion {
  id: string;
  category: string;
  title: string;
  question: string;
  order: number;
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

export default function MobileInterview() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [archive, setArchive] = useState<Archive | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const a = loadCurrentArchive();
    if (!a) {
      addToast('请先创建或选择一个人物档案', 'info');
      return;
    }
    setArchive(a);
    startSession(a.id);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startSession = async (archiveId: string) => {
    setLoading(true);
    try {
      const res = await interviewApi.session(archiveId);
      const question = res.question;
      setCurrentQuestion(question);
      setMessages([
        {
          id: 'welcome',
          role: 'ai',
          text: `您好，我是您的 AI 采访助手。接下来我会和您聊聊人生故事，您可以像聊天一样回答。准备好了吗？`,
        },
        {
          id: question.id,
          role: 'ai',
          text: question.question,
          category: question.category,
        },
      ]);
    } catch (err) {
      addToast('采访会话加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !archive || !currentQuestion || loading) return;

    const answerText = input.trim();
    const questionId = currentQuestion.id;

    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: 'user', text: answerText },
    ]);
    setInput('');
    setLoading(true);

    try {
      const res = await interviewApi.answer(archive.id, questionId, answerText);
      const { followUp, nextQuestion, session } = res;

      if (followUp && nextQuestion) {
        setCurrentQuestion(nextQuestion);
        setMessages((prev) => [
          ...prev,
          {
            id: `f_${Date.now()}`,
            role: 'ai',
            text: followUp,
            category: nextQuestion.category,
          },
        ]);
      } else if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        if (session.status === 'completed') {
          setIsCompleted(true);
          setMessages((prev) => [
            ...prev,
            {
              id: `done_${Date.now()}`,
              role: 'ai',
              text: '感谢您完成本次采访！您可以在“人生档案”中查看整理好的内容，或去生成 AI 传记。',
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: nextQuestion.id,
              role: 'ai',
              text: nextQuestion.question,
              category: nextQuestion.category,
            },
          ]);
        }
      }
    } catch (err) {
      addToast('发送失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!archive) {
    return (
      <div className="mobile-interview-empty">
        <p>暂无档案</p>
        <button onClick={() => navigate('/m')}>返回首页</button>
      </div>
    );
  }

  return (
    <div className="mobile-interview">
      <div className="mobile-interview-info">
        <span>{archive.name} · {archive.birthYear}年生</span>
        <span className="mobile-interview-status">
          {isCompleted ? <CheckCircle2 size={18} color="#2da44e" /> : <Sparkles size={18} />}
        </span>
      </div>

      <div className="mobile-interview-chat" ref={scrollRef}>
        {messages.map((msg) => (
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
        {loading && (
          <div className="mobile-interview-message ai">
            <div className="mobile-interview-avatar">AI</div>
            <div className="mobile-interview-bubble loading">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
      </div>

      <div className="mobile-interview-inputbar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isCompleted ? '采访已完成' : '请输入您的回答…'}
          disabled={isCompleted || loading}
        />
        <button
          className="mobile-interview-send"
          onClick={handleSend}
          disabled={!input.trim() || isCompleted || loading}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
