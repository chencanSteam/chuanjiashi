import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Search,
  FileCheck,
  BadgeCheck,
  Link,
  Printer,
  Download,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import './GovernmentService.css';

const tabs = [
  { key: 'overview', label: '服务概览' },
  { key: 'certificate', label: '电子证明办理' },
  { key: 'inherit', label: '档案继承' },
  { key: 'audit', label: '信息核验' },
  { key: 'guide', label: '政策指引' },
];

const stats = [
  { icon: FileText, label: '本月办理业务', value: '128', trend: '23' },
  { icon: Clock, label: '平均办理时长', value: '2.3天', trend: '' },
  { icon: CheckCircle, label: '已办结', value: '96', trend: '18' },
  { icon: AlertCircle, label: '待补充材料', value: '12', trend: '5' },
];

const services = [
  { icon: FileCheck, title: '亲属关系证明', desc: '用于公证、落户、入学等场景', code: 'ZJ-20260618-001' },
  { icon: BadgeCheck, title: '家风荣誉认证', desc: '申报优秀家庭、文明家庭等荣誉', code: 'RY-20260618-002' },
  { icon: FileText, title: '档案调阅申请', desc: '向档案馆申请调阅历史资料', code: 'DY-20260618-003' },
  { icon: Link, title: '政务数据同步', desc: '与公安、民政等部门数据互通', code: 'TB-20260618-004' },
];

const tasks = [
  { id: '20260618001', name: '张伟', type: '亲属关系证明', status: '审核中', date: '2026-06-18' },
  { id: '20260617002', name: '李秀英', type: '档案调阅申请', status: '待补充', date: '2026-06-17' },
  { id: '20260615003', name: '王建国', type: '家风荣誉认证', status: '已办结', date: '2026-06-15' },
];

const initialCertificates = [
  { title: '亲属关系证明', status: '已生成', date: '2026-06-18', code: 'ZJ-20260618-001' },
  { title: '家风荣誉证书', status: '已认证', date: '2026-06-10', code: 'RY-20260610-005' },
];

export default function GovernmentService() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [auditQuery, setAuditQuery] = useState('');
  const [selectedCert, setSelectedCert] = useState(0);
  const [certificates, setCertificates] = useState(initialCertificates);
  const [showApplyInput, setShowApplyInput] = useState(false);
  const [applyName, setApplyName] = useState('');
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [viewHeir, setViewHeir] = useState<string | null>(null);

  const applyCertificate = () => {
    const title = applyName.trim();
    if (!title) {
      addToast('请输入证明名称', 'error');
      return;
    }
    const code = `AP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(certificates.length + 1).padStart(3,'0')}`;
    setCertificates((prev) => [{ title, status: '审核中', date: new Date().toISOString().slice(0,10), code }, ...prev]);
    setApplyName('');
    setShowApplyInput(false);
    addToast('证明申请已提交', 'success');
  };

  const startAudit = () => {
    if (!auditQuery.trim()) {
      addToast('请输入核验内容', 'error');
      return;
    }
    setAuditLoading(true);
    setAuditResult(null);
    setTimeout(() => {
      setAuditLoading(false);
      setAuditResult(`核验通过：${auditQuery} 与档案信息一致`);
      addToast('核验完成', 'success');
    }, 1200);
  };

  return (
    <div className="government-page">
      <header className="page-header"><h1 className="page-title">政务客户服务</h1></header>

      <div className="tabs">
        {tabs.map((t) => <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>)}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="gov-stats-row">
            {stats.map((s, i) => (
              <div className="card gov-stat" key={i} onClick={() => navigate('/government/dashboard')}>
                <div className="card-body">
                  <div className="gov-stat-icon"><s.icon size={20} color="#1B5E4B" /></div>
                  <div className="gov-stat-label">{s.label}</div>
                  <div className="gov-stat-value">{s.value}</div>
                  {s.trend && <div className="gov-stat-trend">较上月 <ChevronRight size={10} className="trend-up" /> {s.trend}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="gov-layout">
            <div className="card services-card">
              <div className="card-header"><h3 className="card-title">常用政务服务</h3></div>
              <div className="card-body services-body">
                {services.map((s, i) => (
                  <div className="service-tile" key={i} onClick={() => navigate(`/government/application/${encodeURIComponent(s.code)}`)}>
                    <div className="service-icon"><s.icon size={24} color="#1B5E4B" /></div>
                    <div className="service-main">
                      <div className="service-title">{s.title}</div>
                      <div className="service-desc">{s.desc}</div>
                    </div>
                    <ChevronRight size={16} color="#9ca3af" />
                  </div>
                ))}
              </div>
            </div>

            <div className="card task-card">
              <div className="card-header"><h3 className="card-title">我的办理</h3><button className="btn btn-outline" onClick={() => navigate('/government/application/ZJ-20260618-001')}>查看全部</button></div>
              <div className="card-body task-body">
                {tasks.map((t, i) => (
                  <div className="task-item" key={i} onClick={() => navigate(`/government/application/${t.id}`)}>
                    <div className="task-id">{t.id}</div>
                    <div className="task-main">
                      <div className="task-name">{t.name} · {t.type}</div>
                      <div className="task-date">申请时间：{t.date}</div>
                    </div>
                    <span className={`task-badge ${t.status}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card guide-card">
              <div className="card-header"><h3 className="card-title">办事指南</h3></div>
              <div className="card-body guide-body">
                <div className="guide-step"><div className="guide-num">1</div><div>在线提交申请材料</div></div>
                <div className="guide-step"><div className="guide-num">2</div><div>AI 智能核验信息</div></div>
                <div className="guide-step"><div className="guide-num">3</div><div>政务后台人工复核</div></div>
                <div className="guide-step"><div className="guide-num">4</div><div>电子证明/结果下发</div></div>
                <button className="guide-more" onClick={() => navigate('/government/policies')}>查看全部指南 <ChevronRight size={14} /></button>
              </div>
            </div>
          </div>

          <div className="gov-extra">
            <div className="card policy-card">
              <div className="card-header"><h3 className="card-title">政策指引</h3><button className="btn btn-ghost" onClick={() => navigate('/government/policies')}>查看全部</button></div>
              <div className="card-body policy-list">
                {[
                  { title: '《家庭档案管理办法》', meta: '国家档案局 · 2025-08-12' },
                  { title: '《电子证照互认互通指南》', meta: '国务院办公厅 · 2025-11-03' },
                  { title: '《数字遗产继承指导意见》', meta: '司法部 · 2026-01-20' },
                ].map((p, i) => (
                  <div className="policy-row" key={i} onClick={() => navigate('/government/policies')}>
                    <FileText size={18} color="#1B5E4B" />
                    <div>
                      <div className="policy-title">{p.title}</div>
                      <div className="policy-meta">{p.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card data-card">
              <div className="card-header"><h3 className="card-title">本月服务数据</h3></div>
              <div className="card-body data-body">
                <div className="data-metric" onClick={() => navigate('/government/dashboard')}><div className="data-value">96</div><div className="data-label">已办结</div></div>
                <div className="data-metric" onClick={() => navigate('/government/dashboard')}><div className="data-value">24</div><div className="data-label">办理中</div></div>
                <div className="data-metric" onClick={() => navigate('/government/dashboard')}><div className="data-value">12</div><div className="data-label">待补充</div></div>
                <div className="data-metric" onClick={() => navigate('/government/dashboard')}><div className="data-value">98.2%</div><div className="data-label">满意度</div></div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'certificate' && (
        <div className="cert-layout">
          <div className="card cert-list">
            <div className="card-header">
              <h3 className="card-title">我的证明</h3>
              {!showApplyInput && <button className="btn btn-primary" onClick={() => setShowApplyInput(true)}>申请证明</button>}
            </div>
            <div className="card-body cert-list-body">
              {showApplyInput && (
                <div className="apply-row">
                  <input type="text" placeholder="输入证明名称" value={applyName} onChange={(e) => setApplyName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyCertificate()} autoFocus />
                  <button className="btn btn-primary" onClick={applyCertificate}>提交</button>
                  <button className="btn btn-ghost" onClick={() => { setShowApplyInput(false); setApplyName(''); }}>取消</button>
                </div>
              )}
              {certificates.map((c, i) => (
                <div className={`cert-item ${selectedCert === i ? 'active' : ''}`} key={i} onClick={() => setSelectedCert(i)}>
                  <div className="cert-icon"><FileText size={22} color="#1B5E4B" /></div>
                  <div className="cert-main">
                    <div className="cert-title">{c.title}</div>
                    <div className="cert-meta">编号：{c.code} · {c.date}</div>
                  </div>
                  <span className="cert-status">{c.status}</span>
                  <button className="icon-btn" onClick={(e) => {
                    e.stopPropagation();
                    const blob = new Blob([`${c.title}\n编号：${c.code}\n状态：${c.status}\n生成时间：${c.date}`], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${c.title}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    addToast(`已下载：${c.title}`, 'success');
                  }}><Download size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="card cert-preview">
            <div className="card-header"><h3 className="card-title">证明预览</h3><button className="btn btn-outline" onClick={() => window.print()}><Printer size={14} /> 打印</button></div>
            <div className="card-body cert-preview-body">
              <div className="cert-doc">
                <div className="cert-doc-header">
                  <div className="cert-doc-seal">政务认证</div>
                  <h4>{certificates[selectedCert]?.title || '亲属关系证明'}</h4>
                </div>
                <p>兹证明张一帆（身份证号：310***********1234）与张伟（身份证号：310***********5678）系父子关系。</p>
                <p>本证明由“传家世”平台根据用户授权档案生成，仅供办理相关政务事项使用。</p>
                <div className="cert-doc-footer">编号：{certificates[selectedCert]?.code || 'ZJ-20260618-001'} · 生成时间：2026-06-18 10:30</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inherit' && (
        <div className="card inherit-card">
          <div className="card-header"><h3 className="card-title">档案继承管理</h3><button className="btn btn-primary" onClick={() => { const h = window.prompt('请输入继承人姓名'); if (h) addToast(`已添加继承人：${h}`, 'success'); }}>新增继承人</button></div>
          <div className="card-body inherit-body">
            <div className="inherit-intro">
              <AlertCircle size={24} color="#D4A373" />
              <p>档案继承遵循用户生前遗嘱及法定继承顺序，继承人需完成身份核验后方可接管档案。</p>
            </div>
            <div className="heir-list">
              {['张伟（长子）', '张敏（长女）'].map((h, i) => (
                <div className="heir-item" key={i}>
                  <Avatar name={h} size={40} />
                  <div className="heir-main">
                    <div className="heir-name">{h}</div>
                    <div className="heir-status">已实名核验</div>
                  </div>
                  <button className="btn btn-outline" onClick={() => setViewHeir(h)}>查看权限</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewHeir && (
        <div className="modal-overlay" onClick={() => setViewHeir(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h4>权限详情：{viewHeir}</h4><button className="modal-close" onClick={() => setViewHeir(null)}>关闭</button></div>
            <div className="modal-body">
              <ul className="permission-list">
                <li>查看基本档案</li>
                <li>下载证明文件</li>
                <li>管理继承人权限</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="card audit-card">
          <div className="card-header"><h3 className="card-title">信息核验</h3></div>
          <div className="card-body audit-body">
            <div className="audit-search"><Search size={14} /><input type="text" placeholder="输入姓名、身份证号或档案编号进行核验" value={auditQuery} onChange={(e) => setAuditQuery(e.target.value)} /><button className="btn btn-primary" onClick={startAudit} disabled={auditLoading}>{auditLoading ? '核验中…' : '开始核验'}</button></div>
            {auditResult && <div className="audit-result">{auditResult}</div>}
            <div className="audit-steps">
              <div className="audit-step"><CheckCircle size={18} color="#1B5E4B" /><div>身份信息比对</div></div>
              <div className="audit-step"><CheckCircle size={18} color="#1B5E4B" /><div>档案数据一致性校验</div></div>
              <div className="audit-step"><Clock size={18} color={auditResult ? '#1B5E4B' : '#D4A373'} /><div>政务接口结果返回</div></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'guide' && (
        <div className="card guide-page-card">
          <div className="card-header"><h3 className="card-title">政策指引</h3></div>
          <div className="card-body guide-page-body">
            {[
              { title: '《家庭档案管理办法》', meta: '国家档案局 · 2025-08-12' },
              { title: '《电子证照互认互通指南》', meta: '国务院办公厅 · 2025-11-03' },
              { title: '《数字遗产继承指导意见》', meta: '司法部 · 2026-01-20' },
            ].map((p, i) => (
              <div className="policy-item" key={i} onClick={() => navigate('/government/policies')}>
                <FileText size={18} color="#1B5E4B" />
                <div>
                  <div className="policy-title">{p.title}</div>
                  <div className="policy-meta">{p.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
