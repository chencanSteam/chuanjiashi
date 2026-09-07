import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { partnerApi } from '../api/partner';
import {
  getApplicationStatusLabel,
  getPartnerTypeLabel,
} from '../data/partnerData';
import type { PartnerApplication, ApplicationStatus } from '../types/partner';
import Annotate from '../components/annotation/Annotate';
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
          <Annotate id="admin-partner-applications.filter" inline>
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
          </Annotate>
        </div>
        <Annotate id="admin-partner-applications.list">
        <div className="card-body partner-app-body">
          {filtered.length === 0 ? (
            <div className="partner-app-empty">暂无申请记录</div>
          ) : (
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>申请人</th>
                  <th>联系方式</th>
                  <th>区域</th>
                  <th>合伙人类型</th>
                  <th>申请理由</th>
                  <th>申请时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td className="admin-table-text-left">
                      <div>{a.phone}</div>
                      {a.email && <div>{a.email}</div>}
                    </td>
                    <td>{a.regionName || '无区域'}</td>
                    <td>{getPartnerTypeLabel(a.type)}</td>
                    <td className="admin-table-text-left">{a.reason || <span className="admin-table-muted">—</span>}</td>
                    <td>{new Date(a.createdAt).toLocaleString()}</td>
                    <td><span className={`partner-app-status ${a.status}`}>{getApplicationStatusLabel(a.status)}</span></td>
                    <td>
                      {a.status === 'pending' ? (
                        <Annotate id="admin-partner-applications.review" inline>
                        <>
                          <button className="admin-table-link" onClick={() => handleProcess(a.id, 'approved')}>通过</button>
                          <button className="admin-table-link danger" onClick={() => handleProcess(a.id, 'rejected')}>拒绝</button>
                        </>
                        </Annotate>
                      ) : (
                        <span className="admin-table-muted">已处理</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
        </Annotate>
      </div>
    </div>
  );
}
