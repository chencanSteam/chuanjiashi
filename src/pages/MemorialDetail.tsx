import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Landmark, Flower2, Image as ImageIcon, BookOpen, Music, X, Pause } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/ui/Avatar';
import './MemorialDetail.css';

const memorialData: Record<string, { years: string; title: string; bio: string }> = {
  '张志远': { years: '1920-1998', title: '家族始祖', bio: '张志远，1920年生于江苏苏州，从教四十年，一生勤勉正直，为家族奠定了重视教育的优良家风。' },
  '王淑兰': { years: '1923-2001', title: '家族始祖配偶', bio: '王淑兰，1923年生于江苏苏州，擅长苏绣与传统烹饪，以勤劳善良哺育后代，是家族温暖的记忆。' },
};

/* 舒缓的五声音阶旋律（Web Audio 合成，无需外部音频） */
const MELODY = [261.63, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0, 329.63, 293.66, 329.63];
const NOTE_GAP_MS = 1400;

function playNote(ctx: AudioContext, freq: number, volume: number) {
  const start = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + 2.4);
}

export default function MemorialDetail() {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const { addToast } = useToast();
  const [flowers, setFlowers] = useState(128);
  const [playing, setPlaying] = useState(false);
  const [preview, setPreview] = useState<{ type: 'photo' | 'article'; title: string } | null>(null);
  const decodedName = decodeURIComponent(name ?? '');
  const data = memorialData[decodedName] ?? { years: '-', title: '家族先辈', bio: '暂无纪念资料。' };

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const noteIndexRef = useRef(0);

  const stopMusic = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    void audioCtxRef.current?.suspend();
  };

  const startMusic = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    void ctx.resume();
    const tick = () => {
      const freq = MELODY[noteIndexRef.current % MELODY.length];
      playNote(ctx, freq, 0.12);
      playNote(ctx, freq / 2, 0.05); // 低八度轻声垫音
      noteIndexRef.current += 1;
      timerRef.current = window.setTimeout(tick, NOTE_GAP_MS);
    };
    tick();
  };

  useEffect(() => stopMusic, []);

  const toggleMusic = () => {
    if (playing) {
      stopMusic();
      setPlaying(false);
      addToast('已暂停纪念音乐', 'info');
    } else {
      startMusic();
      setPlaying(true);
      addToast('开始播放纪念音乐', 'info');
    }
  };

  return (
    <div className="detail-page memorial-detail-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">数字纪念馆</h1>
      </header>

      <div className="card memorial-hero-card">
        <div className="card-body memorial-hero-body">
          <div className="memorial-hero-art"><Landmark size={48} color="#1B5E4B" /></div>
          <div className="memorial-hero-info">
            <Avatar name={decodedName} size={80} />
            <div>
              <div className="memorial-hero-name">{decodedName}</div>
              <div className="memorial-hero-title">{data.title}</div>
              <div className="memorial-hero-years">{data.years}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">生平简介</h3></div>
        <div className="card-body memorial-detail-body">
          <p className="memorial-bio">{data.bio}</p>
          <div className="memorial-section">
            <h4><ImageIcon size={14} /> 纪念影像</h4>
            <div className="memorial-photos">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="memorial-photo" key={i} onClick={() => setPreview({ type: 'photo', title: `纪念影像 ${i + 1}` })}>
                  <ImageIcon size={20} />
                </div>
              ))}
            </div>
          </div>
          <div className="memorial-section">
            <h4><BookOpen size={14} /> 纪念文章</h4>
            <div className="memorial-articles">
              <div className="memorial-article" onClick={() => setPreview({ type: 'article', title: '怀念爷爷' })}>
                <div className="article-title">怀念爷爷</div>
                <div className="article-meta">张明远 · 2024-04-04</div>
              </div>
              <div className="memorial-article" onClick={() => setPreview({ type: 'article', title: '记忆中的奶奶' })}>
                <div className="article-title">记忆中的奶奶</div>
                <div className="article-meta">李婉如 · 2024-04-04</div>
              </div>
            </div>
          </div>
          <div className="memorial-actions">
            <button className="btn btn-primary" onClick={() => { setFlowers((c) => c + 1); addToast(`已向 ${decodedName} 献花`, 'success'); }}><Flower2 size={14} /> 献花缅怀（{flowers}）</button>
            <button className="btn btn-outline" onClick={toggleMusic}>{playing ? <Pause size={14} /> : <Music size={14} />} {playing ? '暂停音乐' : '纪念音乐'}</button>
          </div>
        </div>
      </div>

      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-content memorial-preview" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>{preview.title}</h4><button className="modal-close" onClick={() => setPreview(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {preview.type === 'photo' ? (
                <div className="memorial-preview-photo"><ImageIcon size={64} color="#1B5E4B" /></div>
              ) : (
                <p className="memorial-preview-text">{preview.title} —— 纪念文章正文。此处可展示完整文章，缅怀先辈的音容笑貌与人生故事，让家族记忆代代相传。</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
