import { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle2, Clock, Bell } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/ui/Avatar';
import './EventDetail.css';

const eventData: Record<string, { date: string; loc: string; status: string; desc: string; attendees: string[] }> = {
  '家族聚会': {
    date: '5月20日（周一）10:00',
    loc: '苏州市中心公园',
    status: '进行中',
    desc: '2024年度家族春季聚会，包含户外野餐、亲子游戏、家族故事分享等环节。',
    attendees: ['张明远', '李婉如', '张子涵', '张若曦', '张浩然'],
  },
  '清明祭祖': {
    date: '4月4日（周四）09:00',
    loc: '家族祠堂',
    status: '已结束',
    desc: '清明时节，张氏族人齐聚一堂，缅怀先祖，传承家风。',
    attendees: ['张明远', '张建国', '李秀英', '张子涵'],
  },
};

export default function EventDetail() {
  const navigate = useNavigate();
  const { title } = useParams<{ title: string }>();
  const { addToast } = useToast();
  const [joined, setJoined] = useState(false);
  const [reminded, setReminded] = useState(false);
  const decodedTitle = decodeURIComponent(title ?? '');
  const event = eventData[decodedTitle] ?? { date: '-', loc: '-', status: '筹备中', desc: '暂无活动描述。', attendees: [] };

  return (
    <div className="detail-page event-detail-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">活动详情</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">{decodedTitle}</h3>
            <div className="event-detail-meta">
              <span><Calendar size={12} /> {event.date}</span>
              <span><MapPin size={12} /> {event.loc}</span>
            </div>
          </div>
          <span className={`event-detail-status ${event.status === '进行中' ? 'active' : event.status === '已结束' ? 'ended' : ''}`}>{event.status}</span>
        </div>
        <div className="card-body event-detail-body">
          <div className="event-detail-desc">{event.desc}</div>

          <div className="event-detail-section">
            <h4><Users size={14} /> 参与成员</h4>
            <div className="event-attendees">
              {event.attendees.map((name) => (
                <div className="event-attendee" key={name} onClick={() => navigate(`/family/members/${encodeURIComponent(name)}`)}>
                  <Avatar name={name} size={40} />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="event-detail-section">
            <h4><CheckCircle2 size={14} /> 活动议程</h4>
            <div className="event-agenda">
              <div className="agenda-item"><Clock size={12} /> 09:30 签到集合</div>
              <div className="agenda-item"><Clock size={12} /> 10:00 开场致辞</div>
              <div className="agenda-item"><Clock size={12} /> 11:00 家族故事分享</div>
              <div className="agenda-item"><Clock size={12} /> 12:00 聚餐交流</div>
            </div>
          </div>

          <div className="event-detail-actions">
            <button className="btn btn-primary" onClick={() => { setJoined(true); addToast('报名成功', 'success'); }} disabled={joined}>
              <CheckCircle2 size={14} /> {joined ? '已报名' : '报名参加'}
            </button>
            <button className="btn btn-outline" onClick={() => { setReminded(true); addToast('提醒已设置', 'success'); }} disabled={reminded}>
              <Bell size={14} /> {reminded ? '已设置提醒' : '设置提醒'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
