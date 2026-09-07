import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Annotate from '../components/annotation/Annotate';
import './GovernmentDashboard.css';

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
        <Annotate id="government-dashboard.back" inline>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        </Annotate>
        <h1 className="page-title">政务数据看板</h1>
      </header>

      <Annotate id="government-dashboard.tasks">
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
      </Annotate>
    </div>
  );
}
