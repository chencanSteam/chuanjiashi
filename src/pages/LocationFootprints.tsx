import { useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import './LocationFootprints.css';

const initialPlaces = [
  { id: 1, place: '江苏苏州', year: '1958', event: '出生、成长', left: 72, top: 58 },
  { id: 2, place: '南京', year: '1984', event: '进修企业管理', left: 68, top: 56 },
  { id: 3, place: '上海', year: '1992', event: '拓展业务', left: 76, top: 60 },
  { id: 4, place: '广东深圳', year: '2008', event: '分公司成立', left: 66, top: 78 },
];

export default function LocationFootprints() {
  const { addToast } = useToast();
  const [places, setPlaces] = useState(initialPlaces);
  const [place, setPlace] = useState('');
  const [year, setYear] = useState('');
  const [event, setEvent] = useState('');

  const addPlace = () => {
    if (!place.trim() || !year.trim()) {
      addToast('请填写地点与年份', 'error');
      return;
    }
    const left = 40 + Math.round(Math.random() * 40);
    const top = 30 + Math.round(Math.random() * 45);
    setPlaces((prev) => [{ id: Date.now(), place: place.trim(), year: year.trim(), event: event.trim() || '事件', left, top }, ...prev]);
    setPlace('');
    setYear('');
    setEvent('');
    addToast('地点足迹已添加', 'success');
  };

  const removePlace = (id: number) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    addToast('已删除', 'info');
  };

  return (
    <div className="location-footprints">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><MapPin size={16} /> 地点足迹</h3>
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
            <button className="btn btn-primary" onClick={addPlace}><Plus size={14} /> 添加足迹</button>
          </div>
          <div className="lf-list">
            {places.map((p) => (
              <div className="lf-item" key={p.id}>
                <div className="lf-year">{p.year}</div>
                <div className="lf-main">
                  <div className="lf-place">{p.place}</div>
                  <div className="lf-event">{p.event}</div>
                </div>
                <button className="hall-item-delete" onClick={() => removePlace(p.id)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
