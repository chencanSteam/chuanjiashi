import { useState } from 'react';
import { ArrowLeft, Trophy, Vote, Calendar, Share2, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/ui/Avatar';
import './HallActivityDetail.css';

const candidates = [
  { name: '张明远家庭', votes: 2156 },
  { name: '李秀英家庭', votes: 1890 },
  { name: '王建国家庭', votes: 1654 },
  { name: '张一帆家庭', votes: 1423 },
  { name: '陈静家庭', votes: 1105 },
  { name: '刘强家庭', votes: 986 },
  { name: '赵敏家庭', votes: 754 },
  { name: '孙伟家庭', votes: 621 },
];

export default function HallActivityDetail() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [voteList, setVoteList] = useState(candidates);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [showShare, setShowShare] = useState(false);
  const [showAllRank, setShowAllRank] = useState(false);

  return (
    <div className="detail-page hall-activity-detail-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">最美家庭评选</h1>
      </header>

      <div className="card hall-activity-hero">
        <div className="card-body">
          <div className="activity-hero-title"><Trophy size={28} color="#D4A373" /> 2024年度最美家庭评选活动</div>
          <div className="activity-hero-date"><Calendar size={14} /> 活动时间：2024.04.20 - 2024.06.30</div>
          <div className="activity-hero-stats">
            <div><strong>126</strong><span>参评家庭</span></div>
            <div><strong>8,563</strong><span>累计投票</span></div>
            <div><strong>32,158</strong><span>访问量</span></div>
            <div><strong>20</strong><span>入围家庭</span></div>
          </div>
          <div className="activity-progress-bar"><div className="activity-progress-fill" /></div>
          <div className="activity-stages">
            <span>报名阶段<br />04.20-05.10</span>
            <span className="active">投票阶段<br />05.11-06.10</span>
            <span>评审阶段<br />06.11-06.25</span>
            <span>结果公示<br />06.26-06.30</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">投票榜单</h3>
          <button className="btn btn-outline" onClick={() => setShowShare(true)}><Share2 size={14} /> 分享</button>
        </div>
        <div className="card-body activity-rank-body">
          {(showAllRank ? voteList : voteList.slice(0, 5)).map((c, i) => (
            <div className="activity-rank-item" key={i}>
              <div className="rank-num">{i + 1}</div>
              <Avatar name={c.name} size={44} />
              <div className="rank-main">
                <div className="rank-name">{c.name}</div>
                <div className="rank-bar"><div className="rank-fill" style={{ width: `${(c.votes / Math.max(...voteList.map((x) => x.votes))) * 100}%` }} /></div>
              </div>
              <div className="rank-votes"><Vote size={14} /> {c.votes}</div>
              <button className={`btn ${voted.has(c.name) ? 'btn-outline' : 'btn-primary'}`} disabled={voted.has(c.name)} onClick={(e) => {
                e.stopPropagation();
                setVoteList((prev) => prev.map((x) => x.name === c.name ? { ...x, votes: x.votes + 1 } : x).sort((a, b) => b.votes - a.votes));
                setVoted((prev) => new Set(prev).add(c.name));
                addToast(`已投票给 ${c.name}`, 'success');
              }}>{voted.has(c.name) ? '已投票' : '投票'}</button>
            </div>
          ))}
          <button className="view-all-rank" onClick={() => setShowAllRank((v) => !v)}>{showAllRank ? '收起榜单' : '查看完整榜单'} <ChevronRight size={14} className={showAllRank ? 'rotate' : ''} /></button>
        </div>
      </div>
      {showShare && (
        <div className="modal-overlay" onClick={() => setShowShare(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>分享活动</h4><button className="modal-close" onClick={() => setShowShare(false)}><X size={16} /></button></div>
            <div className="modal-body share-modal-body">
              <button className="share-option" onClick={() => { addToast('链接已复制', 'success'); setShowShare(false); }}>复制链接</button>
              <button className="share-option" onClick={() => { addToast('海报已生成', 'success'); setShowShare(false); }}>生成海报</button>
              <button className="share-option" onClick={() => { addToast('已分享到微信', 'success'); setShowShare(false); }}>微信分享</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
