import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { ArrowLeft, Sparkles, User, BookOpen, FileText, RefreshCw, Copy, Download, Save } from 'lucide-react';
import Annotate from '../components/annotation/Annotate';
import './AIRefine.css';

const sources = [
  { id: 'archive', label: '人生档案', icon: User },
  { id: 'stories', label: '家风故事', icon: BookOpen },
  { id: 'manual', label: '手动输入', icon: FileText },
];

/* 非手动来源的示例素材，用于关键词提炼 */
const sourceMaterial: Record<string, string> = {
  archive: '张明远1958年出生于苏州教师家庭，1992年创业创办明远机械，一生勤俭诚信，重视教育，退休后坚持读书练字，教导子孙孝老爱亲。',
  stories: '祖父的木工箱装着手艺的敬畏；母亲每年除夕提前三天准备年夜饭；父亲三十年做生意从不缺斤短两，诚信账簿至今仍在。',
};

const HISTORY_KEY = 'cj_ai_refine_history';
const SAVED_KEY = 'cj_ai_refine_saved';

interface SavedItem {
  id: string;
  text: string;
  source: string;
  time: string;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

/* 从素材中提取关键词：年份 + 中文词组 */
function extractKeywords(text: string): { years: string[]; words: string[] } {
  const years = Array.from(new Set(text.match(/\d{4}\s*年/g) ?? [])).map((y) => y.replace(/\s/g, ''));
  const words = Array.from(
    new Set(
      text
        .replace(/\d{4}\s*年/g, ' ')
        .split(/[,，。；;、！!？?\s]+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 2 && w.length <= 8),
    ),
  );
  return { years, words };
}

function pick<T>(arr: T[], seed: number, count: number): T[] {
  if (arr.length === 0) return [];
  const result: T[] = [];
  for (let i = 0; i < Math.min(count, arr.length); i++) {
    result.push(arr[(seed + i) % arr.length]);
  }
  return result;
}

/* 基于关键词的模板拼接，每次轮换模板与关键词顺序 */
const templates = [
  (kws: string[], year: string | null) =>
    `${kws[0] ?? '忠厚'}传家：以${kws[1] ?? '诚信'}为本，以${kws[2] ?? '勤俭'}立身${year ? `，自${year}以来代代相传` : ''}，待人以宽，律己以严。`,
  (kws: string[], year: string | null) =>
    `家风关键词：${kws.slice(0, 3).join('、') || '勤勉、诚信'}。${year ? `${year}的家族记忆告诉我们，` : ''}把“${kws[0] ?? '本分'}”二字刻进日常，便是最好的传承。`,
  (kws: string[], year: string | null) =>
    `${year ? `回望${year}，` : ''}家族最珍视的品质是「${kws[0] ?? '厚道'}」与「${kws[1] ?? '勤学'}」——前者立身处世，后者继世绵长${kws[2] ? `，而「${kws[2]}」则让家风有了温度` : ''}。`,
  (kws: string[], year: string | null) =>
    `一则家训：${kws[0] ?? '孝悌'}为先，${kws[1] ?? '诚信'}为基${kws[2] ? `，${kws[2]}为常` : ''}${year ? `。${year}的故事，是这条家训最好的注脚` : ''}。`,
];

export default function AIRefine() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [source, setSource] = useState('archive');
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<string[]>(() => loadJson(HISTORY_KEY, []));
  const [saved, setSaved] = useState<SavedItem[]>(() => loadJson(SAVED_KEY, []));

  const generate = () => {
    if (source === 'manual' && !input.trim()) {
      addToast('请输入家风素材', 'error');
      return;
    }
    setGenerating(true);
    addToast('AI 正在提炼家风内涵…', 'info');
    setTimeout(() => {
      const material = source === 'manual' ? input.trim() : sourceMaterial[source];
      const { years, words } = extractKeywords(material);
      const seed = history.length;
      const kws = pick(words, seed, 3);
      const year = years.length > 0 ? years[seed % years.length] : null;
      const output = templates[seed % templates.length](kws, year);
      setResult(output);
      setHistory((prev) => {
        const next = [output, ...prev].slice(0, 20);
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
      setGenerating(false);
      addToast('提炼完成', 'success');
    }, 1500);
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    addToast('已复制到剪贴板', 'success');
  };

  const downloadResult = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '家风提炼.txt';
    a.click();
    URL.revokeObjectURL(url);
    addToast('已下载', 'success');
  };

  const saveResult = () => {
    if (!result.trim()) {
      addToast('提炼结果为空，无法保存', 'error');
      return;
    }
    const item: SavedItem = {
      id: `${Date.now()}`,
      text: result.trim(),
      source: sources.find((s) => s.id === source)?.label ?? source,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
    };
    setSaved((prev) => {
      const next = [item, ...prev].slice(0, 50);
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    addToast('已保存到我的提炼', 'success');
  };

  const removeSaved = (id: string) => {
    setSaved((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    addToast('已删除', 'info');
  };

  return (
    <div className="detail-page ai-refine-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/family-hall')}><ArrowLeft size={16} /> 返回</button>
        <h1 className="page-title"><Sparkles size={20} /> AI家风提炼</h1>
      </header>

      <Annotate id="ai-refine.source-select">
      <div className="card">
        <div className="card-header"><h3 className="card-title">选择素材来源</h3></div>
        <div className="card-body ai-refine-sources">
          {sources.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className={`ai-refine-source ${source === s.id ? 'active' : ''}`} onClick={() => setSource(s.id)}>
                <Icon size={22} />
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      </Annotate>

      {source === 'manual' && (
        <Annotate id="ai-refine.manual-input">
        <div className="card">
          <div className="card-header"><h3 className="card-title">输入家风素材</h3></div>
          <div className="card-body">
            <textarea className="ai-refine-input" rows={5} placeholder="输入人物故事、家训、家族经历等素材…" value={input} onChange={(e) => setInput(e.target.value)} />
          </div>
        </div>
        </Annotate>
      )}

      <Annotate id="ai-refine.generate">
      <div className="card">
        <div className="card-header"><h3 className="card-title">提炼结果（可直接编辑）</h3></div>
        <div className="card-body ai-refine-result">
          {result ? (
            <>
              <textarea className="ai-refine-input ai-refine-output" rows={4} value={result} onChange={(e) => setResult(e.target.value)} />
              <Annotate id="ai-refine.result-actions">
              <div className="ai-refine-actions">
                <button className="btn btn-outline" onClick={copyResult}><Copy size={14} /> 复制</button>
                <button className="btn btn-outline" onClick={downloadResult}><Download size={14} /> 下载</button>
                <button className="btn btn-outline" onClick={saveResult}><Save size={14} /> 保存</button>
                <button className="btn btn-primary" onClick={generate} disabled={generating}><RefreshCw size={14} className={generating ? 'spin' : ''} /> 重新提炼</button>
              </div>
              </Annotate>
            </>
          ) : (
            <div className="ai-refine-placeholder">
              <Sparkles size={32} />
              <p>点击“开始提炼”生成家风内涵</p>
              <button className="btn btn-primary" onClick={generate} disabled={generating}><Sparkles size={14} /> {generating ? '提炼中…' : '开始提炼'}</button>
            </div>
          )}
        </div>
      </div>
      </Annotate>

      {saved.length > 0 && (
        <Annotate id="ai-refine.saved-list">
        <div className="card">
          <div className="card-header"><h3 className="card-title">我的提炼（已保存 {saved.length} 条）</h3></div>
          <div className="card-body ai-refine-history">
            {saved.map((s) => (
              <div key={s.id} className="ai-refine-history-item">
                <div>{s.text}</div>
                <div className="ai-refine-history-meta">
                  <span>{s.source} · {s.time}</span>
                  <button className="btn btn-ghost" onClick={() => { setResult(s.text); addToast('已载入编辑区', 'info'); }}>载入</button>
                  <button className="btn btn-ghost" onClick={() => removeSaved(s.id)}>删除</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        </Annotate>
      )}

      {history.length > 0 && (
        <Annotate id="ai-refine.history">
        <div className="card">
          <div className="card-header"><h3 className="card-title">历史提炼</h3></div>
          <div className="card-body ai-refine-history">
            {history.map((h, i) => <div key={i} className="ai-refine-history-item">{h}</div>)}
          </div>
        </div>
        </Annotate>
      )}
    </div>
  );
}
