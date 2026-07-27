import { useEffect, useState } from 'react';
import { FileSignature, FileText, AlertTriangle, ShieldCheck, Eye, X } from 'lucide-react';
import { complianceApi } from '../api/compliance';
import type {
  ComplianceRecord,
  ComplianceRecordType,
  AgreementConfig,
  ComplianceAlert,
} from '../mocks/types';
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

      {activeTab === 'records' && (
        <div className="card">
          <div className="card-header compliance-header">
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
          </div>
          <div className="card-body compliance-body">
            {records.length === 0 ? (
              <div className="compliance-empty">暂无授权记录</div>
            ) : (
              <div className="compliance-table">
                <div className="compliance-row compliance-header-row">
                  <div className="compliance-cell">授权类型</div>
                  <div className="compliance-cell">对象</div>
                  <div className="compliance-cell">授权人</div>
                  <div className="compliance-cell">授权时间</div>
                  <div className="compliance-cell">状态</div>
                </div>
                {records.map((r) => (
                  <div className="compliance-row" key={r.id}>
                    <div className="compliance-cell">
                      <span className="compliance-type-tag">
                        <FileSignature size={12} /> {recordTypeLabels[r.type]}
                      </span>
                    </div>
                    <div className="compliance-cell">{r.targetName}</div>
                    <div className="compliance-cell">{r.authorizedBy}</div>
                    <div className="compliance-cell">{new Date(r.authorizedAt).toLocaleString()}</div>
                    <div className="compliance-cell">
                      <span className={`compliance-status ${r.status}`}>{recordStatusLabels[r.status]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'agreements' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><FileText size={16} /> 协议版本列表</h3>
          </div>
          <div className="card-body compliance-body">
            {agreements.length === 0 ? (
              <div className="compliance-empty">暂无协议配置</div>
            ) : (
              <div className="compliance-table">
                <div className="compliance-row compliance-header-row">
                  <div className="compliance-cell">协议名称</div>
                  <div className="compliance-cell">版本号</div>
                  <div className="compliance-cell">更新时间</div>
                  <div className="compliance-cell">操作</div>
                </div>
                {agreements.map((a) => (
                  <div className="compliance-row" key={a.id}>
                    <div className="compliance-cell">{a.name}</div>
                    <div className="compliance-cell">
                      <span className="compliance-version">{a.version}</span>
                    </div>
                    <div className="compliance-cell">{new Date(a.updatedAt).toLocaleString()}</div>
                    <div className="compliance-cell">
                      <button
                        className="btn btn-outline compliance-view-btn"
                        onClick={() => setViewingAgreement(a)}
                      >
                        <Eye size={12} /> 查看
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
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
                <div className="compliance-table">
                  <div className="compliance-row compliance-header-row">
                    <div className="compliance-cell">传记师</div>
                    <div className="compliance-cell">涉及客户</div>
                    <div className="compliance-cell">预警原因</div>
                    <div className="compliance-cell">风险等级</div>
                    <div className="compliance-cell">状态</div>
                    <div className="compliance-cell">时间</div>
                  </div>
                  {alerts.map((a) => (
                    <div className="compliance-row" key={a.id}>
                      <div className="compliance-cell">{a.biographerName}</div>
                      <div className="compliance-cell">{a.userNickname}</div>
                      <div className="compliance-cell compliance-reason">{a.reason}</div>
                      <div className="compliance-cell">
                        <span className={`compliance-risk ${a.riskLevel}`}>{riskLevelLabels[a.riskLevel]}</span>
                      </div>
                      <div className="compliance-cell">
                        <span className={`compliance-status ${a.status === 'resolved' ? 'valid' : 'expired'}`}>
                          {a.status === 'resolved' ? '已处理' : '待处理'}
                        </span>
                      </div>
                      <div className="compliance-cell">{new Date(a.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
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
