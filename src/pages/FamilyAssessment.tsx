import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { ArrowLeft, Plus, ClipboardList, Send, BarChart3, Users, Trash2, X } from 'lucide-react';
import './FamilyAssessment.css';

const initialAssessments = [
  { id: 1, title: '张氏家风传承测评', questions: 12, responses: 86, avgScore: 82 },
  { id: 2, title: '孝道文化认知测评', questions: 8, responses: 124, avgScore: 78 },
  { id: 3, title: '家庭和睦度评估', questions: 10, responses: 56, avgScore: 85 },
];

export default function FamilyAssessment() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [assessments, setAssessments] = useState(initialAssessments);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [published, setPublished] = useState<Set<number>>(new Set());
  const [statsId, setStatsId] = useState<number | null>(null);

  const addAssessment = () => {
    if (!title.trim()) {
      addToast('请输入测评名称', 'error');
      return;
    }
    setAssessments((prev) => [{ id: Date.now(), title: title.trim(), questions: 0, responses: 0, avgScore: 0 }, ...prev]);
    setTitle('');
    setShowAdd(false);
    addToast('测评已创建', 'success');
  };

  const removeAssessment = (id: number) => {
    setAssessments((prev) => prev.filter((a) => a.id !== id));
    addToast('已删除', 'info');
  };

  return (
    <div className="detail-page family-assessment-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/family-hall')}><ArrowLeft size={16} /> 返回</button>
        <h1 className="page-title"><ClipboardList size={20} /> 家风测评</h1>
      </header>

      <div className="card">
        <div className="card-header family-assessment-header">
          <h3 className="card-title">测评列表</h3>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> 创建测评</button>
        </div>
        <div className="card-body family-assessment-body">
          {showAdd && (
            <div className="family-assessment-add">
              <input type="text" placeholder="测评名称" value={title} onChange={(e) => setTitle(e.target.value)} />
              <button className="btn btn-primary" onClick={addAssessment}>创建</button>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>取消</button>
            </div>
          )}
          {assessments.map((a) => (
            <div className="family-assessment-item" key={a.id}>
              <div className="family-assessment-info">
                <div className="family-assessment-title">{a.title}</div>
                <div className="family-assessment-meta">
                  <span><ClipboardList size={12} /> {a.questions} 题</span>
                  <span><Users size={12} /> {a.responses} 人参与</span>
                  <span><BarChart3 size={12} /> 平均分 {a.avgScore}</span>
                </div>
              </div>
              <div className="family-assessment-actions">
                <button className="btn btn-primary" onClick={() => { setPublished((prev) => new Set(prev).add(a.id)); addToast('测评已发布', 'success'); }} disabled={published.has(a.id)}><Send size={13} /> {published.has(a.id) ? '已发布' : '发布'}</button>
                <button className="btn btn-outline" onClick={() => setStatsId(a.id)}><BarChart3 size={13} /> 统计</button>
                <button className="hall-item-delete" onClick={() => removeAssessment(a.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {statsId !== null && (
        <div className="modal-overlay" onClick={() => setStatsId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>测评统计</h4><button className="modal-close" onClick={() => setStatsId(null)}><X size={16} /></button></div>
            <div className="modal-body">
              {(() => {
                const a = assessments.find((x) => x.id === statsId);
                return a ? (
                  <div className="assessment-stats">
                    <div><strong>{a.questions}</strong><span>题目数</span></div>
                    <div><strong>{a.responses}</strong><span>参与人数</span></div>
                    <div><strong>{a.avgScore}</strong><span>平均分</span></div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
