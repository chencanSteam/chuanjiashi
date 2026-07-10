import { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, Phone, MapPin, FileText } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { partnerApi } from '../api/partner';
import {
  getApplicationStatusLabel,
  getPartnerTypeLabel,
} from '../data/partnerData';
import type { PartnerApplication, ApplicationStatus } from '../types/partner';
import './PartnerApplications.css';

export default function PartnerApplications() {
  const { addToast } = useToast();
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    partnerApi
      .adminApplications()
      .then(setApplications)
      .catch(() => setApplications([]));
  }, [refresh]);

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      const matchKeyword =
        !keyword ||
        a.name.includes(keyword) ||
        a.phone.includes(keyword) ||
        a.regionName?.includes(keyword);
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchKeyword && matchStatus;
    });
  }, [applications, keyword, statusFilter]);

  const handleProcess = async (id: string, status: ApplicationStatus) => {
    try {
      await partnerApi.processApplication(id, status);
      setRefresh((v) => v + 1);
      addToast(status === 'approved' ? '申请已通过' : '申请已拒绝', status === 'approved' ? 'success' : 'error');
    } catch (err: any) {
      addToast(err.message || '操作失败', 'error');
    }
  };

  return (
    <div className="partner-applications-page">
      <header className="page-header">
        <h1 className="page-title">合伙人申请审核</h1>
      </header>

      <div className="card">
        <div className="card-header partner-app-header">
          <div className="partner-app-filters">
            <div className="partner-app-search">
              <Search size={14} />
              <input type="text" placeholder="搜索姓名、手机号" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}>
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>
        <div className="card-body partner-app-body">
          {filtered.length === 0 ? (
            <div className="partner-app-empty">暂无申请记录</div>
          ) : (
            <div className="partner-app-list">
              {filtered.map((a) => (
                <div className="partner-app-card" key={a.id}>
                  <div className="partner-app-main">
                    <div className="partner-app-title">
                      <span>{a.name}</span>
                      <span className={`partner-app-status ${a.status}`}>{getApplicationStatusLabel(a.status)}</span>
                    </div>
                    <div className="partner-app-meta">
                      <span><Phone size={12} /> {a.phone}</span>
                      {a.email && <span>{a.email}</span>}
                      <span><MapPin size={12} /> {a.regionName || '无区域'}</span>
                      <span>{getPartnerTypeLabel(a.type)}</span>
                    </div>
                    {a.reason && (
                      <div className="partner-app-reason">
                        <FileText size={12} /> {a.reason}
                      </div>
                    )}
                    <div className="partner-app-time">
                      <Clock size={12} /> 申请时间：{new Date(a.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {a.status === 'pending' && (
                    <div className="partner-app-actions">
                      <button className="btn btn-primary" onClick={() => handleProcess(a.id, 'approved')}>
                        <CheckCircle size={14} /> 通过
                      </button>
                      <button className="btn btn-outline" onClick={() => handleProcess(a.id, 'rejected')}>
                        <XCircle size={14} /> 拒绝
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
