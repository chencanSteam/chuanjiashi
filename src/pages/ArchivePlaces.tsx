import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { familyApi } from '../api/family';
import type { Place } from '../mocks/types';
import './ArchivePlaces.css';

function getArchiveId() {
  return localStorage.getItem('cj_current_archive_id') ?? 'default';
}

export default function ArchivePlaces() {
  const navigate = useNavigate();
  const archiveId = useMemo(() => getArchiveId(), []);
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    familyApi
      .places(archiveId)
      .then(setPlaces)
      .catch(() => setPlaces([]));
  }, [archiveId]);

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
              <div className="place-pin" key={p.id} style={{ left: `${18 + (i % 5) * 16}%`, top: `${22 + (i % 3) * 20}%` }}>
                <MapPin size={16} />
                <span>{p.place}</span>
              </div>
            ))}
          </div>
          <div className="places-list">
            {places.map((p) => (
              <div className="place-row" key={p.id}>
                <span className="place-name">{p.place}</span>
                <span className="place-count">{p.count || 1} 条记录</span>
              </div>
            ))}
          </div>
          {places.length === 0 && <div className="places-empty">暂无地点足迹，可去「人生档案 → 地点足迹」添加</div>}
        </div>
      </div>
    </div>
  );
}
