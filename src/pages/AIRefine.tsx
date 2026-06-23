import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { ArrowLeft, Sparkles, User, BookOpen, FileText, RefreshCw, Copy, Download } from 'lucide-react';
import './AIRefine.css';

const sources = [
  { id: 'archive', label: '人生档案', icon: User },
  { id: 'stories', label: '家风故事', icon: BookOpen },
  { id: 'manual', label: '手动输入', icon: FileText },
];

const sampleOutputs = [
  '忠厚传家：以诚信为本，以勤俭立身，待人以宽，律己以严。',
  '诗书继世：重视教育，崇尚知识，以读书明理、以文化育人。',
  '孝老爱亲：孝敬父母，尊老爱幼，家庭和睦，邻里相亲。',
];

export default function AIRefine() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [source, setSource] = useState('archive');
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const generate = () => {
    if (source === 'manual' && !input.trim()) {
      addToast('请输入家风素材', 'error');
      return;
    }
    setGenerating(true);
    addToast('AI 正在提炼家风内涵…', 'info');
    setTimeout(() => {
      const idx = history.length % sampleOutputs.length;
      const output = sampleOutputs[idx];
      setResult(output);
      setHistory((prev) => [output, ...prev]);
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

  return (
    <div className="detail-page ai-refine-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/family-hall')}><ArrowLeft size={16} /> 返回</button>
        <h1 className="page-title"><Sparkles size={20} /> AI家风提炼</h1>
      </header>

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

      {source === 'manual' && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">输入家风素材</h3></div>
          <div className="card-body">
            <textarea className="ai-refine-input" rows={5} placeholder="输入人物故事、家训、家族经历等素材…" value={input} onChange={(e) => setInput(e.target.value)} />
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h3 className="card-title">提炼结果</h3></div>
        <div className="card-body ai-refine-result">
          {result ? (
            <>
              <div className="ai-refine-output">{result}</div>
              <div className="ai-refine-actions">
                <button className="btn btn-outline" onClick={copyResult}><Copy size={14} /> 复制</button>
                <button className="btn btn-outline" onClick={downloadResult}><Download size={14} /> 下载</button>
                <button className="btn btn-primary" onClick={generate} disabled={generating}><RefreshCw size={14} className={generating ? 'spin' : ''} /> 重新提炼</button>
              </div>
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

      {history.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">历史提炼</h3></div>
          <div className="card-body ai-refine-history">
            {history.map((h, i) => <div key={i} className="ai-refine-history-item">{h}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
