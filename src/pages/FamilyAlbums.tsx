import { ArrowLeft, Image, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import './FamilyAlbums.css';

const albums = [
  { title: '2024春游记', count: '128张' },
  { title: '春节团圆', count: '96张' },
  { title: '成长记录', count: '312张' },
  { title: '家族聚会', count: '85张' },
  { title: '旅行足迹', count: '156张' },
  { title: '老照片', count: '45张' },
];

export default function FamilyAlbums() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  return (
    <div className="detail-page family-albums-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">家庭相册</h1>
        <button className="btn btn-primary" onClick={() => addToast('上传照片', 'success')}>
          <Plus size={14} /> 上传照片
        </button>
      </header>

      <div className="card">
        <div className="card-body">
          <div className="albums-grid">
            {albums.map((a, i) => (
              <div className="albums-item" key={i} onClick={() => navigate(`/family/album/${encodeURIComponent(a.title)}`)}>
                <div className="albums-thumb"><Image size={32} /></div>
                <div className="albums-info">
                  <div className="albums-title">{a.title}</div>
                  <div className="albums-count">{a.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
