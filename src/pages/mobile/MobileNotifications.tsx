import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bell, Check, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './MobileCommerce.css';

type Notice = { id: number; type: string; title: string; desc: string; time: string };
const notices: Notice[] = [
  { id: 1, type: '审核结果', title: '传记《我的父亲》审核通过', desc: '您的传记内容已通过平台审核，可前往「我的传记」查看。', time: '10 分钟前' },
  { id: 2, type: '订单提醒', title: '实体书订单已发货', desc: '订单已由物流发出，请注意查收。', time: '2 小时前' },
  { id: 3, type: '服务提醒', title: '传记师服务预约成功', desc: '传记师已确认您的采访预约，请保持电话畅通。', time: '昨天 18:30' },
  { id: 4, type: '系统公告', title: '平台功能更新公告', desc: '数字博物馆分享功能已上线。', time: '3 天前' },
];
export default function MobileNotifications() {
  const navigate = useNavigate(); const { user } = useAuth(); const key = `cj_mobile_notifications_read_${user?.phone || 'guest'}`;
  const [read, setRead] = useState<number[]>(() => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }); const [unreadOnly, setUnreadOnly] = useState(false);
  useEffect(() => { localStorage.setItem(key, JSON.stringify(read)); }, [key, read]);
  const list = useMemo(() => unreadOnly ? notices.filter((item) => !read.includes(item.id)) : notices, [read, unreadOnly]);
  const mark = (id: number) => setRead((items) => items.includes(id) ? items : [...items, id]);
  return <div className="mobile-commerce"><div className="mobile-subpage-bar"><button type="button" onClick={() => navigate('/m/profile')}><ArrowLeft size={18} /></button><strong>消息通知</strong><button type="button" onClick={() => setRead(notices.map((item) => item.id))}><CheckCheck size={16} /></button></div><div className="mobile-order-tabs"><button type="button" className={!unreadOnly ? 'active' : ''} onClick={() => setUnreadOnly(false)}>全部</button><button type="button" className={unreadOnly ? 'active' : ''} onClick={() => setUnreadOnly(true)}>未读 {notices.filter((item) => !read.includes(item.id)).length || ''}</button></div>{list.length === 0 ? <div className="mobile-commerce-state"><Bell size={38} /><p>暂无新消息</p></div> : <div className="mobile-notice-list">{list.map((item) => <button className={`mobile-notice-card${read.includes(item.id) ? ' read' : ''}`} type="button" key={item.id} onClick={() => mark(item.id)}><span className="mobile-notice-icon"><Bell size={17} /></span><span className="mobile-notice-main"><strong>{item.title}</strong><small>{item.type} · {item.time}</small><p>{item.desc}</p></span>{read.includes(item.id) ? <Check size={15} /> : <i />}</button>)}</div>}</div>;
}
