import { useEffect, useState } from 'react';
import { ENROLLMENT_EVENT, cityLabel, readEnrollments, statusLabels, transitionEnrollment, type Enrollment, type EnrollmentStatus } from '../data/biographerEnrollment';
import { EnrollmentSummary } from '../pages/BiographerApply';
import { useToast } from '../hooks/useToast';

export default function BiographerEnrollmentReview() {
  const [records, setRecords] = useState(readEnrollments);
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [verified, setVerified] = useState(false);
  const { addToast } = useToast();
  const record = records.find(x => x.owner === selected);
  const visible = records.filter(x => x.status !== 'draft').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  useEffect(() => {
    const sync = () => setRecords(readEnrollments());
    window.addEventListener('storage', sync);
    window.addEventListener(ENROLLMENT_EVENT, sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(ENROLLMENT_EVENT, sync); };
  }, []);
  const review = (status: EnrollmentStatus) => {
    if (!record) return;
    const latest = readEnrollments().find(x => x.owner === selected);
    if (!latest || latest.status !== 'pending') { setRecords(readEnrollments()); addToast('该申请已处理，请查看最新状态', 'error'); return; }
    try {
      transitionEnrollment(latest, status, status === 'approved' ? '平台审核通过（演示），等待申请人确认合作' : reason.trim() || (status === 'supplement' ? '请补充个人经历或代表作品后重新提交。' : '本次申请未通过，可调整资料后重新申请。'));
      setSelected(null); setReason(''); setVerified(false); addToast('审核结果已保存', 'success');
    } catch { addToast('保存失败，请稍后重试', 'error'); }
  };
  const select = (item: Enrollment) => { setSelected(item.owner); setReason(''); setVerified(false); };
  return <section className="enroll-admin enroll-card" aria-label="入驻申请审核">
    <header className="enroll-admin-head"><div><h2>入驻申请审核</h2><p className="enroll-muted">独立入驻页提交的申请 · 待审核 {visible.filter(x => x.status === 'pending').length} 条</p></div><button className="btn btn-outline" onClick={() => setRecords(readEnrollments())}>刷新申请</button></header>
    {visible.length === 0 ? <p className="enroll-muted">暂无入驻申请。申请人在“传记师入驻”页面提交后，会显示在这里。</p> : visible.map(item => <div className="enroll-admin-row" key={item.owner}><div><strong>{item.name || '未填写姓名'}</strong><small>{item.cities.map(cityLabel).join('、') || '未选择城市'} · {item.phone || '未填写手机号'} · {new Date(item.submittedAt).toLocaleDateString('zh-CN')}</small></div><span>{statusLabels[item.status]}</span><button className="btn btn-outline" onClick={() => select(item)}>{item.status === 'pending' ? '审核申请' : '查看申请'}</button></div>)}
    {record && <div className="enroll-admin-preview enroll-card"><header className="enroll-admin-head"><h2>{record.name}的入驻申请</h2><button className="btn btn-ghost" onClick={() => setSelected(null)}>收起详情</button></header>
      {record.avatar && <div className="enroll-avatar"><img src={record.avatar} alt={`${record.name}的头像`} /></div>}
      <EnrollmentSummary record={record} />
      {record.reason && <div className="enroll-notice">审核意见：{record.reason}</div>}
      {record.status === 'pending' && <><label>审核意见（选填）<textarea aria-label="审核意见（选填）" value={reason} rows={3} maxLength={500} onChange={e => setReason(e.target.value)} placeholder="填写处理意见，留空则使用演示意见" /></label><label className="enroll-check"><input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} /><span>已人工核验申请人身份，并确认收款安排（原型演示确认）</span></label><div className="enroll-actions"><button className="btn btn-primary" onClick={() => review('approved')}>通过审核</button><button className="btn btn-outline" onClick={() => review('supplement')}>要求补充资料</button><button className="btn btn-outline" onClick={() => review('rejected')}>审核不通过</button></div></>}
      <h3>处理记录</h3><ol className="enroll-history">{record.history.map((item, index) => <li key={`${item.at}-${index}`}><p>{item.text}</p><small>{new Date(item.at).toLocaleString('zh-CN')}</small></li>)}</ol>
    </div>}
  </section>;
}
