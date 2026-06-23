import { useState } from 'react';
import { ArrowLeft, Image, Download, Share2, Plus, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import './AlbumDetail.css';

const albumMeta: Record<string, { count: string; date: string; desc: string }> = {
  '2024春游记': { count: '128张', date: '2024-03-15 至 2024-03-18', desc: '记录张氏家庭2024年春季踏青旅行，途经苏州、杭州两地。' },
  '春节团圆': { count: '96张', date: '2024-02-09 至 2024-02-15', desc: '2024年春节全家团聚影像，包含年夜饭、拜年、祭祖等珍贵瞬间。' },
  '成长记录': { count: '312张', date: '2003-05-12 至今', desc: '张子涵从出生到成长的点滴记录，见证家族新一代的成长足迹。' },
  '家族聚会': { count: '85张', date: '2023-12-30', desc: '家族年度聚会合影与活动记录。' },
  '旅行足迹': { count: '156张', date: '2018-01-01 至今', desc: '家庭历年旅行照片合集。' },
  '全部相册': { count: '800+张', date: '2018 至今', desc: '汇总全部家庭相册影像。' },
};

export default function AlbumDetail() {
  const navigate = useNavigate();
  const { title } = useParams<{ title: string }>();
  const { addToast } = useToast();
  const decodedTitle = decodeURIComponent(title ?? '');
  const meta = albumMeta[decodedTitle] ?? { count: '若干张', date: '-', desc: '家庭相册精选。' };
  const [showShare, setShowShare] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  return (
    <div className="detail-page album-detail-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">{decodedTitle}</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">{decodedTitle}</h3>
            <div className="album-meta">{meta.count} · {meta.date}</div>
          </div>
          <div className="album-actions">
            <button className="btn btn-outline" onClick={() => setShowShare(true)}><Share2 size={14} /> 分享</button>
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}><Plus size={14} /> 上传</button>
          </div>
        </div>
        <div className="card-body">
          <p className="album-desc">{meta.desc}</p>
          <div className="album-photo-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div className="album-photo-card" key={i} onClick={() => setPreviewIndex(i)}>
                <div className="album-photo-thumb"><Image size={24} /></div>
                <div className="album-photo-title">{decodedTitle} {i + 1}</div>
                <div className="album-photo-date">2024-0{(i % 6) + 1}-{(i % 28) + 1}</div>
                <button className="album-download" onClick={(e) => { e.stopPropagation(); addToast('开始下载照片', 'success'); }}><Download size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showShare && (
        <div className="modal-overlay" onClick={() => setShowShare(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>分享相册</h4><button className="modal-close" onClick={() => setShowShare(false)}><X size={16} /></button></div>
            <div className="modal-body">
              <input className="modal-input" readOnly value={`https://chuanjiashi.cn/album/${encodeURIComponent(decodedTitle)}`} />
              <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(`https://chuanjiashi.cn/album/${encodeURIComponent(decodedTitle)}`); addToast('链接已复制', 'success'); }}>复制链接</button>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>上传照片</h4><button className="modal-close" onClick={() => setShowUpload(false)}><X size={16} /></button></div>
            <div className="modal-body">
              <input type="file" className="modal-file" accept="image/*" onChange={() => addToast('已选择文件', 'info')} />
              <button className="btn btn-primary" onClick={() => { setShowUpload(false); addToast('照片上传成功', 'success'); }}>开始上传</button>
            </div>
          </div>
        </div>
      )}

      {previewIndex !== null && (
        <div className="modal-overlay preview-overlay" onClick={() => setPreviewIndex(null)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close preview-close" onClick={() => setPreviewIndex(null)}><X size={20} /></button>
            <div className="preview-image"><Image size={64} /></div>
            <div className="preview-title">{decodedTitle} {previewIndex + 1}</div>
          </div>
        </div>
      )}
    </div>
  );
}
