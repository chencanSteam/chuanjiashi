import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, Star, Filter, User, CheckCircle } from 'lucide-react';
import { biographerApi } from '../api/biographer';
import { paymentApi } from '../api/payment';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/ui/Avatar';
import BiographerProfile from './BiographerProfile';
import type { Biographer, BiographerService } from '../mocks/types';
import './BiographerList.css';

const SPECIALTIES = ['全部', '家族传记', '企业家传记', '口述历史', '个人回忆录', '家风传承', '实体书制作'];
const CITIES = ['全部', '杭州', '上海', '北京', '广州', '深圳', '南京', '苏州', '成都'];

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

export default function BiographerList() {
  const { addToast } = useToast();
  const [biographers, setBiographers] = useState<Biographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [specialty, setSpecialty] = useState('全部');
  const [city, setCity] = useState('全部');
  const [selected, setSelected] = useState<Biographer | null>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    setLoading(true);
    biographerApi
      .list()
      .then(setBiographers)
      .catch(() => setBiographers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = biographers;
    if (city !== '全部') {
      list = list.filter((b) => b.city?.includes(city) || b.serviceAreas?.includes(city));
    }
    if (specialty !== '全部') {
      list = list.filter(
        (b) => b.specialties?.includes(specialty) || b.tags?.includes(specialty)
      );
    }
    if (keyword.trim()) {
      const lower = keyword.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(lower) ||
          b.title?.toLowerCase().includes(lower) ||
          b.city?.toLowerCase().includes(lower) ||
          b.specialties?.some((s) => s.toLowerCase().includes(lower)) ||
          b.tags?.some((t) => t.toLowerCase().includes(lower))
      );
    }
    return list;
  }, [biographers, city, specialty, keyword]);

  const handleBook = async (service: BiographerService) => {
    if (!selected) return;
    try {
      setBooking(true);
      const { order } = await biographerApi.createOrder(selected.id, service.id);
      await paymentApi.pay((order as any).id, 'wechat');
      addToast(`已成功预约 ${selected.name} 的「${service.name}」`, 'success');
      setSelected(null);
    } catch (err: any) {
      addToast(err.message || '预约失败', 'error');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="biographer-list-page">
      <div className="biographer-list-hero">
        <h1 className="biographer-list-title">找到合适的传记师</h1>
        <p className="biographer-list-subtitle">
          专业传记师为您和家人记录珍贵记忆，整理家族故事，传承家风精神
        </p>
      </div>

      <div className="card biographer-list-filters">
        <div className="biographer-list-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="搜索姓名、城市、专长…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="biographer-list-filter-groups">
          <div className="biographer-list-filter-group">
            <Filter size={14} />
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="biographer-list-filter-group">
            <MapPin size={14} />
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="biographer-list-results">
        {loading ? (
          <div className="biographer-list-empty">加载中…</div>
        ) : filtered.length === 0 ? (
          <div className="biographer-list-empty">
            <User size={48} color="#d1d5db" />
            <p>未找到符合条件的传记师</p>
            <span>试试调整筛选条件</span>
          </div>
        ) : (
          <>
            <div className="biographer-list-count">共 {filtered.length} 位传记师</div>
            <div className="biographer-list-grid">
              {filtered.map((b) => {
                const minPrice = b.services?.length
                  ? Math.min(...b.services.map((s) => s.price))
                  : 0;
                return (
                  <div className="biographer-list-card" key={b.id} onClick={() => setSelected(b)}>
                    <div className="biographer-list-card-header">
                      <Avatar name={b.name.charAt(0)} size={64} />
                      <div className="biographer-list-card-meta">
                        <div className="biographer-list-card-name-row">
                          <span className="biographer-list-card-name">{b.name}</span>
                          <span className="biographer-list-card-rating">
                            <Star size={12} fill="currentColor" /> 5.0
                          </span>
                        </div>
                        <div className="biographer-list-card-title">
                          {b.title || '专业传记师'} · {b.city || '全国'}
                        </div>
                        <div className="biographer-list-card-tags">
                          {b.tags?.slice(0, 3).map((tag) => (
                            <span key={tag} className="biographer-list-card-tag">{tag}</span>
                          ))}
                          {!b.tags?.length && b.specialties?.slice(0, 3).map((s) => (
                            <span key={s} className="biographer-list-card-tag">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="biographer-list-card-intro">{b.intro}</p>
                    <div className="biographer-list-card-footer">
                      <div className="biographer-list-card-price">
                        {minPrice > 0 ? (
                          <>
                            <strong>{formatPrice(minPrice)}</strong>
                            <span> 起</span>
                          </>
                        ) : (
                          <span>价格面议</span>
                        )}
                      </div>
                      <button
                        className="biographer-list-card-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(b);
                        }}
                      >
                        查看详情
                      </button>
                    </div>
                    {b.status === 'approved' && (
                      <div className="biographer-list-card-verified">
                        <CheckCircle size={12} /> 平台认证
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {selected && (
        <div className="modal-overlay biographer-list-modal-overlay" onClick={() => setSelected(null)}>
          <div className="biographer-list-modal" onClick={(e) => e.stopPropagation()}>
            <BiographerProfile
              biographerId={selected.id}
              embedded
              onClose={() => setSelected(null)}
              onBookService={booking ? undefined : handleBook}
            />
            {booking && (
              <div className="biographer-list-booking-mask">
                <div className="biographer-list-booking-spinner" />
                <p>正在创建订单…</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
