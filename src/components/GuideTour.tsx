import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Mic, CalendarDays, Layers, BookOpen, Sparkles } from 'lucide-react';
import './GuideTour.css';

interface GuideStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: GuideStep[] = [
  {
    icon: <Sparkles size={48} color="#1B5E4B" />,
    title: '欢迎使用传家世',
    description: '这里是 AI 数字人生与家风传承平台。我们会一步步带您了解如何记录人生故事、整理家庭记忆。',
  },
  {
    icon: <CalendarDays size={48} color="#1B5E4B" />,
    title: '人生大事件',
    description: '从求学、工作到家庭生活，记录人生中的重要时刻，按时间梳理您或家人的经历，建立人生故事的脉络。',
  },
  {
    icon: <Layers size={48} color="#1B5E4B" />,
    title: '多维增补',
    description: '补充时代背景、家乡风貌、难忘的人和事，以及一生坚守的价值观与家风，让人生故事更丰富、更有温度。',
  },
  {
    icon: <Mic size={48} color="#1B5E4B" />,
    title: '开始智能采访',
    description: '点击首页的「开始智能采访」，AI 会循序渐进地提问，帮您或家人轻松回忆人生经历。',
  },
  {
    icon: <BookOpen size={48} color="#1B5E4B" />,
    title: '生成传记作品',
    description: '采访和档案素材整理好后，进入「AI传记生成」，AI 会自动帮您写成章节传记。',
  },
];

const STORAGE_KEY = 'cj_has_seen_guide';
const OPEN_EVENT = 'open-guide';

export function markGuideSeen() {
  localStorage.setItem(STORAGE_KEY, '1');
}

export function openGuide() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function shouldShowGuide(): boolean {
  return !localStorage.getItem(STORAGE_KEY);
}

export default function GuideTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const handleOpen = () => {
      setStep(0);
      setIsOpen(true);
    };
    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_EVENT, handleOpen);
  }, []);

  const close = () => {
    setIsOpen(false);
    markGuideSeen();
  };

  const finish = () => {
    setIsOpen(false);
    markGuideSeen();
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  if (!isOpen) return null;

  const current = steps[step];

  return (
    <div className="guide-overlay" onClick={close}>
      <div className="guide-card" onClick={(e) => e.stopPropagation()}>
        <button className="guide-close" onClick={close} aria-label="关闭引导">
          <X size={24} />
        </button>

        <div className="guide-icon">{current.icon}</div>
        <h2 className="guide-title">{current.title}</h2>
        <p className="guide-description">{current.description}</p>

        <div className="guide-dots">
          {steps.map((_, i) => (
            <span key={i} className={`guide-dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="guide-actions">
          {step > 0 ? (
            <button className="guide-btn guide-btn-outline" onClick={prev}>
              <ChevronLeft size={20} /> 上一步
            </button>
          ) : (
            <button className="guide-btn guide-btn-ghost" onClick={close}>
              跳过
            </button>
          )}

          <button className="guide-btn guide-btn-primary" onClick={next}>
            {step === steps.length - 1 ? '完成' : '下一步'}
            {step < steps.length - 1 && <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
