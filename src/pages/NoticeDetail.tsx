import { useState } from 'react';
import { ArrowLeft, Bell, Clock, Share2, CheckCircle2, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import './NoticeDetail.css';

const notices = [
  { title: '关于家族聚会的通知', time: '2小时前', content: '各位家人：定于5月20日（周一）上午10:00在苏州市中心公园举行家族春季聚会，届时将有亲子游戏、家族故事分享及聚餐环节，请大家准时参加。' },
  { title: '更新了家谱资料：张志远', time: '昨天', content: '家谱管理员已更新张志远祖父的生平资料与影像记录，欢迎家人查阅并补充相关信息。' },
  { title: '新增相册《2024春游记》', time: '2天前', content: '李婉如上传了128张2024年春游照片，已归档至家庭相册，欢迎大家浏览、点赞与评论。' },
];

export default function NoticeDetail() {
  const navigate = useNavigate();
  const { index } = useParams<{ index: string }>();
  const { addToast } = useToast();
  const [read, setRead] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const idx = Number(index ?? '0');
  const notice = notices[idx] ?? notices[0];

  return (
    <div className="detail-page notice-detail-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">通知详情</h1>
      </header>

      <div className="card">
        <div className="card-body notice-detail-body">
          <div className="notice-detail-header">
            <Bell size={24} color="#1B5E4B" />
            <div>
              <h2 className="notice-detail-title">{notice.title}</h2>
              <div className="notice-detail-time"><Clock size={12} /> {notice.time}</div>
            </div>
          </div>
          <div className="notice-detail-content">{notice.content}</div>
          <div className="notice-detail-actions">
            <button className="btn btn-primary" onClick={() => { setRead(true); addToast('已标记为已读', 'success'); }} disabled={read}>
              <CheckCircle2 size={14} /> {read ? '已读' : '标记为已读'}
            </button>
            <button className="btn btn-outline" onClick={() => setShowShare(true)}><Share2 size={14} /> 分享</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">更多通知</h3></div>
        <div className="card-body">
          {notices.map((n, i) => (
            <div key={i} className="notice-detail-row" onClick={() => navigate(`/family/notice/${i}`)}>
              <Bell size={14} color="#9ca3af" />
              <div className="notice-row-main">
                <div className="notice-row-title">{n.title}</div>
                <div className="notice-row-time">{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showShare && (
        <div className="modal-overlay" onClick={() => setShowShare(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>分享通知</h4><button className="modal-close" onClick={() => setShowShare(false)}><X size={16} /></button></div>
            <div className="modal-body">
              <input className="modal-input" readOnly value={`https://chuanjiashi.cn/notice/${idx}`} />
              <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(`https://chuanjiashi.cn/notice/${idx}`); addToast('链接已复制', 'success'); }}>复制链接</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
