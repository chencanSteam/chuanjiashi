import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './FamilyEvents.css';

const events = [
  { title: '家族聚会', date: '5月20日（周一）10:00', loc: '苏州市中心公园', status: '进行中' },
  { title: '清明祭祖', date: '4月4日（周四）09:00', loc: '家族祠堂', status: '已结束' },
  { title: '端午家宴', date: '6月10日（周一）18:00', loc: '家中', status: '未开始' },
];

export default function FamilyEvents() {
  const navigate = useNavigate();

  return (
    <div className="detail-page family-events-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">活动提醒</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">全部活动</h3>
        </div>
        <div className="card-body">
          {events.map((e, i) => (
            <div className="family-event-row" key={i} onClick={() => navigate(`/family/event/${encodeURIComponent(e.title)}`)}>
              <div className="family-event-icon"><Calendar size={18} /></div>
              <div className="family-event-main">
                <div className="family-event-title">{e.title}</div>
                <div className="family-event-meta"><MapPin size={12} /> {e.loc}<br />{e.date}</div>
              </div>
              <span className={`family-event-status ${e.status === '进行中' ? 'active' : e.status === '已结束' ? 'ended' : ''}`}>{e.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
