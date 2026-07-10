import { useEffect, useMemo, useState } from 'react';
import { MapPin, Plus, Trash2, Map } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { familyApi } from '../api/family';
import type { Place } from '../mocks/types';
import './LocationFootprints.css';

function getArchiveId() {
  return localStorage.getItem('cj_current_archive_id') ?? 'default';
}

export default function LocationFootprints() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const archiveId = useMemo(() => getArchiveId(), []);
  const [places, setPlaces] = useState<Place[]>([]);
  const [place, setPlace] = useState('');
  const [year, setYear] = useState('');
  const [event, setEvent] = useState('');

  useEffect(() => {
    familyApi
      .places(archiveId)
      .then(setPlaces)
      .catch(() => setPlaces([]));
  }, [archiveId]);

  const addPlaceLocal = async () => {
    if (!place.trim() || !year.trim()) {
      addToast('请填写地点与年份', 'error');
      return;
    }
    try {
      const added = await familyApi.addPlace(archiveId, {
        place: place.trim(),
        year: year.trim(),
        event: event.trim() || '事件',
        left: 40 + Math.round(Math.random() * 40),
        top: 30 + Math.round(Math.random() * 45),
      });
      setPlaces((prev) => {
        const existing = prev.find((p) => p.place === added.place);
        if (existing) {
          return prev.map((p) => (p.id === existing.id ? added : p));
        }
        return [added, ...prev];
      });
      setPlace('');
      setYear('');
      setEvent('');
      addToast('地点足迹已添加', 'success');
    } catch (err: any) {
      addToast(err.message || '添加失败', 'error');
    }
  };

  const removePlaceLocal = async (id: string) => {
    try {
      await familyApi.removePlace(archiveId, id);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      addToast('已删除', 'info');
    } catch (err: any) {
      addToast(err.message || '删除失败', 'error');
    }
  };

  return (
    <div className="location-footprints">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><MapPin size={16} /> 地点足迹</h3>
          <button className="btn btn-ghost" onClick={() => navigate('/archive/places')}>
            <Map size={14} /> 查看地图
          </button>
        </div>
        <div className="card-body">
          <div className="lf-map">
            <svg className="lf-map-bg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <rect x="0" y="0" width="100" height="100" fill="#f8f9f9" />
              <path d="M18,28 Q22,18 28,16 T38,20 T45,28 T55,24 T65,30 T75,22 T85,28" fill="none" stroke="#e8ecea" strokeWidth="0.5" />
              <path d="M12,55 Q20,45 30,48 T45,50 T58,46 T72,52 T88,48" fill="none" stroke="#e8ecea" strokeWidth="0.5" />
              <path d="M22,80 Q30,72 40,76 T55,74 T70,80 T85,76" fill="none" stroke="#e8ecea" strokeWidth="0.5" />
            </svg>
            {places.map((p) => (
              <div className="lf-map-marker" key={p.id} style={{ left: `${p.left}%`, top: `${p.top}%` }}>
                <MapPin size={24} />
                <div className="lf-marker-tooltip">{p.place}</div>
              </div>
            ))}
          </div>
          <div className="lf-add-row">
            <input type="text" placeholder="地点" value={place} onChange={(e) => setPlace(e.target.value)} />
            <input type="text" placeholder="年份" value={year} onChange={(e) => setYear(e.target.value)} />
            <input type="text" placeholder="事件" value={event} onChange={(e) => setEvent(e.target.value)} />
            <button className="btn btn-primary" onClick={addPlaceLocal}><Plus size={14} /> 添加足迹</button>
          </div>
          <div className="lf-list">
            {places.map((p) => (
              <div className="lf-item" key={p.id}>
                <div className="lf-year">{p.year}</div>
                <div className="lf-main">
                  <div className="lf-place">{p.place}</div>
                  <div className="lf-event">{p.event}</div>
                </div>
                <button className="hall-item-delete" onClick={() => removePlaceLocal(p.id)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
