import { useEffect, useMemo, useState } from 'react';
import { Search, TrendingUp, Calendar, User } from 'lucide-react';
import { loadCommissionRecords, loadPartners, getCommissionStatusLabel } from '../data/partnerData';
import type { CommissionRecord, Partner } from '../types/partner';
import './CommissionRecords.css';

export default function CommissionRecords() {
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');

  useEffect(() => {
    setRecords(loadCommissionRecords());
    setPartners(loadPartners());
  }, []);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchKeyword =
        !keyword ||
        r.orderId.includes(keyword) ||
        r.userId.includes(keyword);
      const matchPartner = !selectedPartner || r.partnerId === selectedPartner;
      return matchKeyword && matchPartner;
    });
  }, [records, keyword, selectedPartner]);

  const totalCommission = useMemo(() => filtered.reduce((sum, r) => sum + r.commission, 0), [filtered]);
  const totalAmount = useMemo(() => filtered.reduce((sum, r) => sum + r.amount, 0), [filtered]);

  const getPartner = (id: string) => partners.find((p) => p.id === id);

  return (
    <div className="commission-records-page">
      <header className="page-header">
        <h1 className="page-title">分润流水</h1>
      </header>

      <div className="commission-stats">
        <div className="card commission-stat">
          <TrendingUp size={20} color="#1B5E4B" />
          <div>
            <div className="commission-stat-value">¥{totalCommission.toFixed(2)}</div>
            <div className="commission-stat-label">分佣总额</div>
          </div>
        </div>
        <div className="card commission-stat">
          <Calendar size={20} color="#2563eb" />
          <div>
            <div className="commission-stat-value">¥{totalAmount.toFixed(2)}</div>
            <div className="commission-stat-label">订单总额</div>
          </div>
        </div>
        <div className="card commission-stat">
          <User size={20} color="#7c3aed" />
          <div>
            <div className="commission-stat-value">{filtered.length}</div>
            <div className="commission-stat-label">流水笔数</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header commission-header">
          <div className="commission-filters">
            <div className="commission-search">
              <Search size={14} />
              <input type="text" placeholder="搜索订单号、客户ID" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <select value={selectedPartner} onChange={(e) => setSelectedPartner(e.target.value)}>
              <option value="">全部合伙人</option>
              {partners.map((p) => (
                <option value={p.id} key={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="card-body commission-body">
          {filtered.length === 0 ? (
            <div className="commission-empty">暂无分润流水</div>
          ) : (
            <div className="commission-table">
              <div className="commission-row commission-header-row">
                <div className="commission-cell">订单号</div>
                <div className="commission-cell">合伙人</div>
                <div className="commission-cell">客户</div>
                <div className="commission-cell">服务类型</div>
                <div className="commission-cell">订单金额</div>
                <div className="commission-cell">佣金</div>
                <div className="commission-cell">状态</div>
                <div className="commission-cell">时间</div>
              </div>
              {filtered.map((r) => {
                const p = getPartner(r.partnerId);
                return (
                  <div className="commission-row" key={r.id}>
                    <div className="commission-cell">{r.orderId}</div>
                    <div className="commission-cell">{p?.name || '未知'}</div>
                    <div className="commission-cell">{r.userId}</div>
                    <div className="commission-cell">{getTypeLabel(r.type)}</div>
                    <div className="commission-cell">¥{r.amount.toFixed(2)}</div>
                    <div className="commission-cell commission-money">¥{r.commission.toFixed(2)}</div>
                    <div className="commission-cell">
                      <span className={`commission-status ${r.status}`}>{getCommissionStatusLabel(r.status)}</span>
                    </div>
                    <div className="commission-cell">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getTypeLabel(type: CommissionRecord['type']): string {
  const map: Record<CommissionRecord['type'], string> = {
    interview: 'AI 采访',
    biography: '传记生成',
    digital_person: '数字人',
    subscription: '会员订阅',
    print: '实体书印刷',
    other: '其他',
  };
  return map[type];
}
