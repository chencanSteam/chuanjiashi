import { ArrowLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ArchivePlaces.css';

const places = [
  { name: '江苏省苏州市', count: 28 },
  { name: '浙江省杭州市', count: 12 },
  { name: '上海市', count: 9 },
  { name: '安徽省黄山市', count: 5 },
  { name: '北京市', count: 3 },
];

export default function ArchivePlaces() {
  const navigate = useNavigate();

  return (
    <div className="detail-page archive-places-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">地点足迹</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><MapPin size={16} /> 人生足迹地图</h3>
        </div>
        <div className="card-body">
          <div className="places-map">
            {places.map((p, i) => (
              <div className="place-pin" key={i} style={{ left: `${18 + i * 16}%`, top: `${22 + (i % 3) * 20}%` }}>
                <MapPin size={16} />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
          <div className="places-list">
            {places.map((p, i) => (
              <div className="place-row" key={i}>
                <span className="place-name">{p.name}</span>
                <span className="place-count">{p.count} 条记录</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
