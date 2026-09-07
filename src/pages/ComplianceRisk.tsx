import { useEffect, useState } from 'react';
import { FileSignature, FileText, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { complianceApi } from '../api/compliance';
import type {
  ComplianceRecord,
  ComplianceRecordType,
  AgreementConfig,
  ComplianceAlert,
} from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './ComplianceRisk.css';

const tabs = [
  { key: 'records', label: '授权记录' },
  { key: 'agreements', label: '协议配置' },
  { key: 'alerts', label: '风险预警' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const recordTypeLabels: Record<ComplianceRecordType, string> = {
  biography_public: '传记公开授权',
  portrait: '肖像授权',
  voice: '声音授权',
};

const recordStatusLabels: Record<ComplianceRecord['status'], string> = {
  valid: '有效',
  expired: '已过期',
  revoked: '已撤销',
};

const riskLevelLabels: Record<ComplianceAlert['riskLevel'], string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

export default function ComplianceRisk() {
  const [activeTab, setActiveTab] = useState<TabKey>('records');
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [typeFilter, setTypeFilter] = useState<ComplianceRecordType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ComplianceRecord['status'] | 'all'>('all');
  const [agreements, setAgreements] = useState<AgreementConfig[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [viewingAgreement, setViewingAgreement] = useState<AgreementConfig | null>(null);

  useEffect(() => {
    if (activeTab === 'records') {
      complianceApi
        .records({ type: typeFilter, status: statusFilter })
        .then(setRecords)
        .catch(() => setRecords([]));
    }
  }, [activeTab, typeFilter, statusFilter]);

  useEffect(() => {
    if (activeTab === 'agreements') {
      complianceApi.agreements().then(setAgreements).catch(() => setAgreements([]));
    }
    if (activeTab === 'alerts') {
      complianceApi.alerts().then(setAlerts).catch(() => setAlerts([]));
    }
  }, [activeTab]);

  return (
    <div className="compliance-page">
      <header className="page-header">
        <h1 className="page-title">合规风控</h1>
      </header>

      <Annotate id="compliance-risk.tabs">
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      </Annotate>

      {activeTab === 'records' && (
        <div className="card">
          <div className="card-header compliance-header">
            <Annotate id="compliance-risk.record-filters" inline>
            <div className="compliance-filters">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ComplianceRecordType | 'all')}>
                <option value="all">全部类型</option>
                <option value="biography_public">传记公开授权</option>
                <option value="portrait">肖像授权</option>
                <option value="voice">声音授权</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ComplianceRecord['status'] | 'all')}
              >
                <option value="all">全部状态</option>
                <option value="valid">有效</option>
                <option value="expired">已过期</option>
                <option value="revoked">已撤销</option>
              </select>
            </div>
            </Annotate>
          </div>
          <Annotate id="compliance-risk.record-list">
          <div className="card-body compliance-body">
            {records.length === 0 ? (
              <div className="compliance-empty">暂无授权记录</div>
            ) : (
              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>授权类型</th>
                    <th>对象</th>
                    <th>授权人</th>
                    <th>授权时间</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="compliance-type-tag">
                        <FileSignature size={12} /> {recordTypeLabels[r.type]}
                      </span>
                    </td>
                    <td>{r.targetName}</td>
                    <td>{r.authorizedBy}</td>
                    <td>{new Date(r.authorizedAt).toLocaleString()}</td>
                    <td>
                      <span className={`compliance-status ${r.status}`}>{recordStatusLabels[r.status]}</span>
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
      )}

      {activeTab === 'agreements' && (
        <Annotate id="compliance-risk.agreements">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><FileText size={16} /> 协议版本列表</h3>
          </div>
          <div className="card-body compliance-body">
            {agreements.length === 0 ? (
              <div className="compliance-empty">暂无协议配置</div>
            ) : (
              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>协议名称</th>
                    <th>版本号</th>
                    <th>更新时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                {agreements.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>
                      <span className="compliance-version">{a.version}</span>
                    </td>
                    <td>{new Date(a.updatedAt).toLocaleString()}</td>
                    <td>
                      <button
                        className="admin-table-link"
                        onClick={() => setViewingAgreement(a)}
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'alerts' && (
        <Annotate id="compliance-risk.alerts">
        <>
          <div className="card compliance-tip-card">
            <div className="card-body compliance-tip-body">
              <ShieldCheck size={20} color="#1B5E4B" />
              <div>
                <div className="compliance-tip-title">分销合规提示</div>
                <div className="compliance-tip-text">
                  平台分销仅支持一级直推佣金，禁止多层级计酬与团队计酬；传记师服务订单须通过平台签约付款，
                  任何引导线下私下交易的行为将冻结佣金并终止合作。请运营人员定期核查预警记录。
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><AlertTriangle size={16} /> 私单预警</h3>
            </div>
            <div className="card-body compliance-body">
              {alerts.length === 0 ? (
                <div className="compliance-empty">暂无风险预警</div>
              ) : (
                <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>传记师</th>
                      <th>涉及客户</th>
                      <th>预警原因</th>
                      <th>风险等级</th>
                      <th>状态</th>
                      <th>时间</th>
                    </tr>
                  </thead>
                  <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id}>
                      <td>{a.biographerName}</td>
                      <td>{a.userNickname}</td>
                      <td className="compliance-reason">{a.reason}</td>
                      <td>
                        <span className={`compliance-risk ${a.riskLevel}`}>{riskLevelLabels[a.riskLevel]}</span>
                      </td>
                      <td>
                        <span className={`compliance-status ${a.status === 'resolved' ? 'valid' : 'expired'}`}>
                          {a.status === 'resolved' ? '已处理' : '待处理'}
                        </span>
                      </td>
                      <td>{new Date(a.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>
        </>
        </Annotate>
      )}

      {viewingAgreement && (
        <div className="modal-overlay" onClick={() => setViewingAgreement(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{viewingAgreement.name}（{viewingAgreement.version}）</h4>
              <button className="modal-close" onClick={() => setViewingAgreement(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>
                更新于 {new Date(viewingAgreement.updatedAt).toLocaleString()}
              </p>
              <div style={{ maxHeight: '60vh', overflowY: 'auto', fontSize: 13, lineHeight: 1.8, color: '#374151' }}>
                {viewingAgreement.content.split('\n\n').map((paragraph, i) => (
                  <p key={i} style={{ marginBottom: 12 }}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
