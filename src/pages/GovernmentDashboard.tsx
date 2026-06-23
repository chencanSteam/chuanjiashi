import { ArrowLeft, FileCheck, Clock, AlertCircle, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './GovernmentDashboard.css';

const stats = [
  { label: '已办结', value: 12, Icon: FileCheck, color: '#1B5E4B' },
  { label: '办理中', value: 3, Icon: Clock, color: '#d97706' },
  { label: '待补充', value: 1, Icon: AlertCircle, color: '#ef4444' },
  { label: '满意度', value: '98%', Icon: Smile, color: '#4CA88E' },
];

const tasks = [
  { title: '亲属关系证明', status: '已办结', date: '2024-05-10' },
  { title: '档案查阅申请', status: '办理中', date: '2024-05-15' },
  { title: '家风馆入驻申请', status: '待补充', date: '2024-05-16' },
];

export default function GovernmentDashboard() {
  const navigate = useNavigate();

  return (
    <div className="detail-page government-dashboard-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">政务数据看板</h1>
      </header>

      <div className="gov-stats">
        {stats.map((s, i) => (
          <div className="card gov-stat-card" key={i}>
            <div className="card-body">
              <div className="gov-stat-icon" style={{ color: s.color, background: `${s.color}14` }}>
                <s.Icon size={22} />
              </div>
              <div className="gov-stat-value">{s.value}</div>
              <div className="gov-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">办理进度</h3>
        </div>
        <div className="card-body">
          {tasks.map((t, i) => (
            <div className="gov-task-row" key={i} onClick={() => navigate(`/government/application/${encodeURIComponent(t.title)}`)}>
              <div className="gov-task-main">
                <div className="gov-task-title">{t.title}</div>
                <div className="gov-task-date">{t.date}</div>
              </div>
              <span className={`gov-task-status ${t.status === '已办结' ? 'done' : t.status === '办理中' ? 'progress' : 'warn'}`}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
