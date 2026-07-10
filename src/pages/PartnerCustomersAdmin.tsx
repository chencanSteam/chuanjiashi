import { useEffect, useMemo, useState } from 'react';
import { Search, Users, Link2, User } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { partnerApi } from '../api/partner';
import {
  getPartnerTypeLabel,
} from '../data/partnerData';
import type { PartnerCustomer, Partner } from '../types/partner';
import './PartnerCustomersAdmin.css';

export default function PartnerCustomersAdmin() {
  const { addToast } = useToast();
  const [customers, setCustomers] = useState<PartnerCustomer[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    partnerApi
      .adminCustomers()
      .then(setCustomers)
      .catch(() => setCustomers([]));
    partnerApi
      .listPartners()
      .then(setPartners)
      .catch(() => setPartners([]));
  }, [refresh]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchKeyword =
        !keyword ||
        c.userId.includes(keyword) ||
        c.userName?.includes(keyword) ||
        c.userPhone?.includes(keyword);
      const matchPartner = !selectedPartner || c.partnerId === selectedPartner;
      return matchKeyword && matchPartner;
    });
  }, [customers, keyword, selectedPartner]);

  const getPartner = (id: string) => partners.find((p) => p.id === id);

  const handleBind = async () => {
    if (!selectedPartner || !newUserId.trim()) {
      addToast('请选择合伙人并填写客户ID', 'error');
      return;
    }
    try {
      await partnerApi.bindCustomer({
        partnerId: selectedPartner,
        userId: newUserId.trim(),
        userName: newUserName.trim() || undefined,
      });
      setRefresh((v) => v + 1);
      setNewUserId('');
      setNewUserName('');
      addToast('客户绑定成功', 'success');
    } catch (err: any) {
      addToast(err.message || '绑定失败', 'error');
    }
  };

  return (
    <div className="partner-customers-admin-page">
      <header className="page-header">
        <h1 className="page-title">客户归属管理</h1>
      </header>

      <div className="card partner-bind-card">
        <div className="card-header"><h3 className="card-title"><Link2 size={16} /> 手动绑定客户</h3></div>
        <div className="card-body">
          <div className="partner-bind-form">
            <select value={selectedPartner} onChange={(e) => setSelectedPartner(e.target.value)}>
              <option value="">选择合伙人</option>
              {partners.map((p) => (
                <option value={p.id} key={p.id}>{p.name}（{getPartnerTypeLabel(p.type)}）</option>
              ))}
            </select>
            <input type="text" placeholder="客户ID/手机号" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} />
            <input type="text" placeholder="客户姓名（选填）" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
            <button className="btn btn-primary" onClick={handleBind}>绑定</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header partner-customers-admin-header">
          <h3 className="card-title"><Users size={16} /> 客户归属列表</h3>
          <div className="partner-customers-admin-filters">
            <div className="partner-customers-admin-search">
              <Search size={14} />
              <input type="text" placeholder="搜索客户" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <select value={selectedPartner} onChange={(e) => setSelectedPartner(e.target.value)}>
              <option value="">全部合伙人</option>
              {partners.map((p) => (
                <option value={p.id} key={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="card-body partner-customers-admin-body">
          {filtered.length === 0 ? (
            <div className="partner-customers-admin-empty">暂无客户归属记录</div>
          ) : (
            <div className="partner-customers-admin-table">
              <div className="partner-customers-admin-row partner-customers-admin-header-row">
                <div className="partner-customers-admin-cell">客户</div>
                <div className="partner-customers-admin-cell">归属合伙人</div>
                <div className="partner-customers-admin-cell">绑定方式</div>
                <div className="partner-customers-admin-cell">付费状态</div>
                <div className="partner-customers-admin-cell">累计订单</div>
                <div className="partner-customers-admin-cell">绑定时间</div>
              </div>
              {filtered.map((c) => {
                const p = getPartner(c.partnerId);
                return (
                  <div className="partner-customers-admin-row" key={c.id}>
                    <div className="partner-customers-admin-cell">
                      <div className="partner-customers-admin-user">
                        <User size={12} /> {c.userName || c.userId}
                      </div>
                      <div className="partner-customers-admin-phone">{c.userPhone || c.userId}</div>
                    </div>
                    <div className="partner-customers-admin-cell">
                      <div>{p?.name || '未知'}</div>
                      <div className="partner-customers-admin-type">{p ? getPartnerTypeLabel(p.type) : '-'}</div>
                    </div>
                    <div className="partner-customers-admin-cell">
                      <span className={`partner-customers-admin-bind ${c.bindType}`}>
                        {c.bindType === 'invite_code' ? '邀请码' : c.bindType === 'region_auto' ? '区域自动' : '手动'}
                      </span>
                    </div>
                    <div className="partner-customers-admin-cell">
                      <span className={`partner-customers-admin-paid ${c.hasPaid ? 'yes' : 'no'}`}>
                        {c.hasPaid ? '已付费' : '未付费'}
                      </span>
                    </div>
                    <div className="partner-customers-admin-cell">¥{c.totalOrderAmount.toFixed(2)}</div>
                    <div className="partner-customers-admin-cell">{new Date(c.createdAt).toLocaleDateString()}</div>
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
