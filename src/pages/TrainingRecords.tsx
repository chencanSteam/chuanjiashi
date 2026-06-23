import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { ArrowLeft, Plus, Clock, Calendar, CheckCircle2, Loader2, Trash2, Play, Filter } from 'lucide-react';
import './TrainingRecords.css';

const initialRecords = [
  { id: 1, name: '爷爷数字分身 - 语言风格训练', date: '2024-06-18 14:32', duration: '12 分钟', progress: 100, status: '已完成', params: ['语言风格学习', '情感记忆'] },
  { id: 2, name: '奶奶数字分身 - 情感记忆强化', date: '2024-06-17 09:15', duration: '8 分钟', progress: 100, status: '已完成', params: ['情感记忆', '价值观建模'] },
  { id: 3, name: '父亲数字分身 - 一致性测试', date: '2024-06-16 20:45', duration: '15 分钟', progress: 100, status: '已完成', params: ['一致性测试', '安全边界'] },
  { id: 4, name: '母亲数字分身 - 价值观建模', date: '2024-06-15 11:20', duration: '10 分钟', progress: 68, status: '训练中', params: ['价值观建模'] },
  { id: 5, name: '爷爷数字分身 - 安全边界校准', date: '2024-06-14 16:50', duration: '6 分钟', progress: 100, status: '已完成', params: ['安全边界'] },
];

const filters = ['全部', '已完成', '训练中'];

export default function TrainingRecords() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [records, setRecords] = useState(initialRecords);
  const [filter, setFilter] = useState('全部');
  const [running, setRunning] = useState<number | null>(null);

  const filtered = filter === '全部' ? records : records.filter((r) => r.status === filter);

  const startTraining = () => {
    const id = Date.now();
    setRecords((prev) => [{ id, name: '新一轮人格综合训练', date: new Date().toLocaleString('zh-CN', { hour12: false }), duration: '0 分钟', progress: 0, status: '训练中', params: ['语言风格学习', '情感记忆', '价值观建模'] }, ...prev]);
    setRunning(id);
    addToast('训练已开始', 'success');
    setTimeout(() => {
      setRecords((prev) => prev.map((r) => r.id === id ? { ...r, progress: 100, status: '已完成', duration: '10 分钟' } : r));
      setRunning(null);
      addToast('训练完成', 'success');
    }, 2000);
  };

  const removeRecord = (id: number) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    addToast('训练记录已删除', 'info');
  };

  const completed = records.filter((r) => r.status === '已完成').length;
  const totalDuration = records.reduce((sum, r) => sum + (parseInt(r.duration, 10) || 0), 0);

  return (
    <div className="detail-page training-records-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/digital-person')}><ArrowLeft size={16} /> 返回</button>
        <h1 className="page-title">训练记录</h1>
      </header>

      <div className="training-records-summary">
        <div className="card">
          <div className="card-body training-summary-body">
            <div><Calendar size={18} /> 总训练次数 <strong>{records.length}</strong></div>
            <div><Clock size={18} /> 累计时长 <strong>{totalDuration} 分钟</strong></div>
            <div><CheckCircle2 size={18} /> 已完成 <strong>{completed}</strong></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">训练记录列表</h3>
          <div className="training-records-filter">
            <Filter size={14} />
            {filters.map((f) => (
              <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={startTraining} disabled={running !== null}><Plus size={14} /> {running !== null ? '训练中…' : '新建训练'}</button>
        </div>
        <div className="card-body training-records-body">
          {filtered.map((r) => (
            <div className="training-record-card" key={r.id}>
              <div className="training-record-main">
                <div className="training-record-name">{r.name}</div>
                <div className="training-record-meta">
                  <span><Calendar size={12} /> {r.date}</span>
                  <span><Clock size={12} /> {r.duration}</span>
                  <span className={`training-record-status ${r.status === '已完成' ? 'done' : 'running'}`}>{r.status === '已完成' ? <CheckCircle2 size={12} /> : <Loader2 size={12} className="spin" />} {r.status}</span>
                </div>
                <div className="training-record-params">
                  {r.params.map((p) => <span key={p} className="training-record-tag">{p}</span>)}
                </div>
                <div className="training-record-bar"><div style={{ width: `${r.progress}%`, transition: 'width 0.3s' }} /></div>
              </div>
              <div className="training-record-actions">
                {r.status === '训练中' && (
                  <button className="btn btn-primary" disabled={running === r.id} onClick={() => {
                    setRunning(r.id);
                    addToast('继续训练中…', 'info');
                    setTimeout(() => {
                      setRecords((prev) => prev.map((x) => x.id === r.id ? { ...x, progress: 100, status: '已完成', duration: `${(parseInt(x.duration, 10) || 0) + 5} 分钟` } : x));
                      setRunning(null);
                      addToast('训练已完成', 'success');
                    }, 2000);
                  }}>
                    {running === r.id ? <Loader2 size={13} className="spin" /> : <Play size={13} />} 继续
                  </button>
                )}
                <button className="hall-item-delete" onClick={() => removeRecord(r.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="training-records-empty">该分类下暂无训练记录</div>}
        </div>
      </div>
    </div>
  );
}
