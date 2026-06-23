import { useState } from 'react';
import { ArrowLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import './FamilyCalendar.css';

const calTypes = ['聚会', '节日', '生日', '纪念日', '其他'];

const initialEvents = [
  { day: 5, title: '家族会议', type: '聚会' },
  { day: 12, title: '母亲节', type: '节日' },
  { day: 15, title: '爷爷生日', type: '生日' },
  { day: 20, title: '家族聚会', type: '聚会' },
  { day: 25, title: '结婚纪念日', type: '纪念日' },
];

export default function FamilyCalendar() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [events, setEvents] = useState(initialEvents);
  const [selectedDay, setSelectedDay] = useState(15);
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 4, 1));
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [day, setDay] = useState('');
  const [type, setType] = useState('聚会');

  const monthLabel = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startOffset = (() => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    return d === 0 ? 6 : d - 1;
  })();
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDay(1);
    addToast('上个月', 'info');
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDay(1);
    addToast('下个月', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = parseInt(day, 10);
    if (!title.trim() || Number.isNaN(d) || d < 1 || d > 31) {
      addToast('请填写有效日期与标题', 'error');
      return;
    }
    setEvents((prev) => [...prev, { day: d, title: title.trim(), type }].sort((a, b) => a.day - b.day));
    setTitle('');
    setDay('');
    setType('聚会');
    setShowForm(false);
    addToast('日程已添加', 'success');
  };

  return (
    <div className="detail-page family-calendar-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">家庭日历</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{monthLabel}</h3>
          <div className="calendar-nav">
            <button className="btn btn-ghost" onClick={prevMonth}>
              <ChevronRight size={14} className="cal-nav-arrow left" />
            </button>
            <button className="btn btn-ghost" onClick={nextMonth}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="fcal-grid">
            {['一','二','三','四','五','六','日'].map((d) => (
              <div className="fcal-weekday" key={d}>{d}</div>
            ))}
            {Array.from({ length: startOffset }).map((_, i) => <div className="fcal-day empty" key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const ev = events.find((e) => e.day === d);
              return (
                <div
                  key={i}
                  className={`fcal-day ${selectedDay === d ? 'active' : ''} ${ev ? 'has-event' : ''}`}
                  onClick={() => {
                    setSelectedDay(d);
                    if (ev) addToast(`${d}日：${ev.title}`, 'info');
                  }}
                >
                  <span>{d}</span>
                  {ev && <span className="fcal-dot" title={ev.title} />}
                </div>
              );
            })}
          </div>

          <div className="fcal-events">
            {events.map((e, i) => (
              <div className={`fcal-event ${selectedDay === e.day ? 'active' : ''}`} key={i} onClick={() => setSelectedDay(e.day)}>
                <span className="fcal-event-dot" />
                <span className="fcal-event-day">{e.day}日</span>
                <span className="fcal-event-title">{e.title}</span>
                <span className="fcal-event-type">{e.type}</span>
                <button
                  className="fcal-event-del"
                  onClick={(evt) => {
                    evt.stopPropagation();
                    setEvents((prev) => prev.filter((_, idx) => idx !== i));
                    addToast('已删除日程', 'info');
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {!showForm ? (
            <button className="btn btn-outline fcal-add-btn" onClick={() => setShowForm(true)}>
              <Plus size={14} /> 添加日程
            </button>
          ) : (
            <form className="fcal-form" onSubmit={handleSubmit}>
              <input
                type="number"
                min={1}
                max={31}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder="日期"
                className="fcal-input fcal-input-day"
                required
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="日程标题"
                className="fcal-input"
                required
              />
              <select value={type} onChange={(e) => setType(e.target.value)} className="fcal-input">
                {calTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="fcal-form-actions">
                <button type="submit" className="btn btn-primary">保存</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>取消</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
