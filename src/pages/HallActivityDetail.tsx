import { useState } from 'react';
import { ArrowLeft, Trophy, Vote, Calendar, Share2, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/ui/Avatar';
import Annotate from '../components/annotation/Annotate';
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
  const [showWechat, setShowWechat] = useState(false);
  const [showAllRank, setShowAllRank] = useState(false);

  const activityUrl = `${window.location.origin}/family-hall/activity`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(activityUrl);
      addToast('链接已复制', 'success');
    } catch {
      addToast('复制失败，请手动复制', 'error');
    }
    setShowShare(false);
  };

  const generatePoster = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      addToast('海报生成失败', 'error');
      return;
    }
    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 0, 800);
    gradient.addColorStop(0, '#1B5E4B');
    gradient.addColorStop(1, '#2e7d63');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 800);
    // 标题
    ctx.fillStyle = '#D4A373';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('2024年度最美家庭评选', 300, 120);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText('活动时间：2024.04.20 - 2024.06.30', 300, 170);
    // 数据
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('126 个参评家庭 · 8,563 票', 300, 230);
    ctx.font = '16px sans-serif';
    ctx.fillText('扫码参与投票，为你心中的最美家庭助力', 300, 275);
    // 二维码占位
    const qrSize = 200;
    const qrX = (600 - qrSize) / 2;
    const qrY = 380;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);
    ctx.fillStyle = '#1B5E4B';
    const cells = 21;
    const cell = qrSize / cells;
    // 三个定位角
    const drawFinder = (cx: number, cy: number) => {
      ctx.fillRect(qrX + cx * cell, qrY + cy * cell, cell * 7, cell * 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX + (cx + 1) * cell, qrY + (cy + 1) * cell, cell * 5, cell * 5);
      ctx.fillStyle = '#1B5E4B';
      ctx.fillRect(qrX + (cx + 2) * cell, qrY + (cy + 2) * cell, cell * 3, cell * 3);
    };
    drawFinder(0, 0);
    drawFinder(cells - 7, 0);
    drawFinder(0, cells - 7);
    // 伪随机数据点（基于链接字符，保证同一链接图案稳定）
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const inFinder = (x < 8 && y < 8) || (x >= cells - 8 && y < 8) || (x < 8 && y >= cells - 8);
        if (inFinder) continue;
        const code = activityUrl.charCodeAt((x * cells + y) % activityUrl.length);
        if ((code + x * y) % 3 === 0) ctx.fillRect(qrX + x * cell, qrY + y * cell, cell, cell);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '14px sans-serif';
    ctx.fillText('传家世 · AI家风馆', 300, 680);
    ctx.fillText(activityUrl, 300, 710);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = '最美家庭评选海报.png';
    a.click();
    addToast('海报已生成并下载', 'success');
    setShowShare(false);
  };

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
          <Annotate id="hall-activity.stages">
          <div className="activity-stages">
            <span>报名阶段<br />04.20-05.10</span>
            <span className="active">投票阶段<br />05.11-06.10</span>
            <span>评审阶段<br />06.11-06.25</span>
            <span>结果公示<br />06.26-06.30</span>
          </div>
          </Annotate>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">投票榜单</h3>
          <Annotate id="hall-activity.share" inline>
          <button className="btn btn-outline" onClick={() => setShowShare(true)}><Share2 size={14} /> 分享</button>
          </Annotate>
        </div>
        <Annotate id="hall-activity.rank">
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
              <Annotate id="hall-activity.vote" inline>
              <button className={`btn ${voted.has(c.name) ? 'btn-outline' : 'btn-primary'}`} disabled={voted.has(c.name)} onClick={(e) => {
                e.stopPropagation();
                setVoteList((prev) => prev.map((x) => x.name === c.name ? { ...x, votes: x.votes + 1 } : x).sort((a, b) => b.votes - a.votes));
                setVoted((prev) => new Set(prev).add(c.name));
                addToast(`已投票给 ${c.name}`, 'success');
              }}>{voted.has(c.name) ? '已投票' : '投票'}</button>
              </Annotate>
            </div>
          ))}
          <button className="view-all-rank" onClick={() => setShowAllRank((v) => !v)}>{showAllRank ? '收起榜单' : '查看完整榜单'} <ChevronRight size={14} className={showAllRank ? 'rotate' : ''} /></button>
        </div>
        </Annotate>
      </div>
      {showShare && (
        <div className="modal-overlay" onClick={() => setShowShare(false)}>
          <Annotate id="hall-activity.share-modal">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>分享活动</h4><button className="modal-close" onClick={() => setShowShare(false)}><X size={16} /></button></div>
            <div className="modal-body share-modal-body">
              <button className="share-option" onClick={copyLink}>复制链接</button>
              <button className="share-option" onClick={generatePoster}>生成海报</button>
              <button className="share-option" onClick={() => { setShowShare(false); setShowWechat(true); }}>微信分享</button>
            </div>
          </div>
          </Annotate>
        </div>
      )}
      {showWechat && (
        <div className="modal-overlay" onClick={() => setShowWechat(false)}>
          <Annotate id="hall-activity.wechat-modal">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>微信分享</h4><button className="modal-close" onClick={() => setShowWechat(false)}><X size={16} /></button></div>
            <div className="modal-body share-modal-body">
              <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 12px' }}>请复制以下链接，粘贴到微信聊天或朋友圈分享本次活动：</p>
              <input className="modal-input" readOnly value={activityUrl} onFocus={(e) => e.target.select()} />
              <button className="btn btn-primary" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(activityUrl);
                  addToast('链接已复制，去微信粘贴分享吧', 'success');
                } catch {
                  addToast('复制失败，请长按链接手动复制', 'error');
                }
              }}>复制链接</button>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '12px 0 0' }}>提示：小程序/公众号内可直接调起微信分享面板，当前为 Web 版手动分享。</p>
            </div>
          </div>
          </Annotate>
        </div>
      )}
    </div>
  );
}
