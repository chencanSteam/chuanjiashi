import { useState } from 'react';
import { Bell, Send, Megaphone } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import './AdminNotifications.css';

interface NoticeRecord {
  id: number;
  title: string;
  type: string;
  target: string;
  content: string;
  time: string;
  status: '已发布' | '草稿';
}

const initialNotices: NoticeRecord[] = [
  { id: 1, title: '平台功能更新公告', type: '系统公告', target: '全部用户', content: 'AI 采访题库已更新，新增「职业生涯」主题 20 个问题。', time: '2026-07-28 10:00', status: '已发布' },
  { id: 2, title: '暑期传记创作活动', type: '活动通知', target: '全部用户', content: '7 月完成采访并生成传记，可获实体书制作 8 折优惠券。', time: '2026-07-20 09:30', status: '已发布' },
  { id: 3, title: '档案数据备份提醒', type: '系统公告', target: '全部用户', content: '建议定期在「设置 - 存储与备份」中导出数据备份。', time: '2026-07-15 14:00', status: '已发布' },
];

export default function AdminNotifications() {
  const { addToast } = useToast();
  const [notices, setNotices] = useState(initialNotices);
  const [form, setForm] = useState({ title: '', type: '系统公告', target: '全部用户', content: '' });
  const [publishing, setPublishing] = useState(false);

  const handlePublish = () => {
    if (!form.title.trim() || !form.content.trim()) {
      addToast('请填写通知标题和内容', 'error');
      return;
    }
    if (publishing) return;
    setPublishing(true);
    setTimeout(() => {
      setNotices((prev) => [
        {
          id: Date.now(),
          title: form.title.trim(),
          type: form.type,
          target: form.target,
          content: form.content.trim(),
          time: new Date().toLocaleString('zh-CN', { hour12: false }),
          status: '已发布',
        },
        ...prev,
      ]);
      setForm({ title: '', type: '系统公告', target: '全部用户', content: '' });
      setPublishing(false);
      addToast('通知已发布', 'success');
    }, 600);
  };

  return (
    <div className="admin-notice-page">
      <header className="page-header">
        <h2><Bell size={20} /> 消息通知</h2>
        <p>向用户端发布系统公告与活动通知</p>
      </header>

      <div className="card an-compose-card">
        <div className="card-header">
          <h3 className="card-title"><Megaphone size={16} /> 发布新通知</h3>
        </div>
        <div className="card-body">
          <div className="an-form-row">
            <label>标题</label>
            <input
              type="text"
              value={form.title}
              placeholder="请输入通知标题"
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="an-form-row an-form-inline">
            <div>
              <label>类型</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option>系统公告</option>
                <option>活动通知</option>
                <option>维护通知</option>
              </select>
            </div>
            <div>
              <label>发送对象</label>
              <select value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}>
                <option>全部用户</option>
                <option>近 30 天活跃用户</option>
                <option>付费用户</option>
              </select>
            </div>
          </div>
          <div className="an-form-row">
            <label>内容</label>
            <textarea
              rows={3}
              value={form.content}
              placeholder="请输入通知内容"
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
          </div>
          <button className="btn btn-primary" disabled={publishing} onClick={handlePublish}>
            <Send size={14} /> {publishing ? '发布中…' : '发布通知'}
          </button>
        </div>
      </div>

      <div className="card an-list-card">
        <div className="card-header">
          <h3 className="card-title">历史通知</h3>
        </div>
        <div className="card-body">
          {notices.map((n) => (
            <div className="an-notice-row" key={n.id}>
              <div className="an-notice-main">
                <div className="an-notice-title">
                  {n.title}
                  <span className="an-notice-tag">{n.type}</span>
                  <span className="an-notice-target">{n.target}</span>
                </div>
                <div className="an-notice-content">{n.content}</div>
              </div>
              <div className="an-notice-meta">
                <span className={`an-notice-status ${n.status === '已发布' ? 'published' : ''}`}>{n.status}</span>
                <span className="an-notice-time">{n.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
