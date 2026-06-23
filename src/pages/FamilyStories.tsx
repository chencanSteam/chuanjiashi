import { ArrowLeft, Heart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FamilyStories.css';

const stories = [
  { title: '爷爷的记忆：从教40年', tag: '家庭教育', author: '张明远', date: '2 天前', views: 128, likes: 18 },
  { title: '我的大学时光', tag: '成长故事', author: '张子涵', date: '3 天前', views: 96, likes: 12 },
  { title: '奶奶的拿手菜', tag: '生活故事', author: '李婉如', date: '5 天前', views: 156, likes: 23 },
  { title: '父亲的创业之路', tag: '创业历程', author: '张建国', date: '1 周前', views: 210, likes: 34 },
  { title: '家谱里的家风家训', tag: '家风家训', author: '张明远', date: '2 周前', views: 178, likes: 29 },
];

const filters = ['全部', '家风家训', '创业历程', '家庭教育', '成长故事', '生活故事'];

export default function FamilyStories() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('全部');
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const filtered = activeFilter === '全部'
    ? stories
    : stories.filter((s) => s.tag === activeFilter);

  return (
    <div className="detail-page family-stories-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">家庭故事共创</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <div className="story-filters">
            {filters.map((f) => (
              <button
                key={f}
                className={`story-filter-btn ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body">
          {filtered.map((s, i) => (
            <div
              className="story-list-row"
              key={i}
              onClick={() => navigate(`/family/story/${encodeURIComponent(s.title)}`)}
            >
              <div className="story-list-main">
                <div className="story-list-title">{s.title} <span className="story-tag">{s.tag}</span></div>
                <div className="story-list-meta">{s.author} · {s.date} · 👁 {s.views}</div>
              </div>
              <button
                className={`story-like ${liked.has(s.title) ? 'liked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLiked((prev) => {
                    const next = new Set(prev);
                    if (next.has(s.title)) next.delete(s.title);
                    else next.add(s.title);
                    return next;
                  });
                }}
              >
                <Heart size={14} /> {s.likes + (liked.has(s.title) ? 1 : 0)}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
