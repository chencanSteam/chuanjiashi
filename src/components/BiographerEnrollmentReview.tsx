import { useEffect, useState } from 'react';
import { ENROLLMENT_EVENT, cityLabel, readEnrollments, statusLabels, transitionEnrollment, type Enrollment, type EnrollmentStatus } from '../data/biographerEnrollment';
import { EnrollmentSummary } from '../pages/BiographerApply';
import { useToast } from '../hooks/useToast';
import Modal from './ui/Modal';

export default function BiographerEnrollmentReview() {
  const [records, setRecords] = useState(readEnrollments);
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [showFullId, setShowFullId] = useState(false);
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
    if (status === 'rejected' && !reason.trim()) { addToast('请填写不通过原因或需要补充的资料', 'error'); return; }
    const latest = readEnrollments().find(x => x.owner === selected);
    if (!latest || latest.status !== 'pending') { setRecords(readEnrollments()); addToast('该申请已处理，请查看最新状态', 'error'); return; }
    try {
      transitionEnrollment(latest, status, status === 'approved' ? '平台审核通过（演示），等待申请人确认合作' : reason.trim());
      setSelected(null); setReason(''); setRejecting(false); addToast('审核结果已保存', 'success');
    } catch { addToast('保存失败，请稍后重试', 'error'); }
  };
  const select = (item: Enrollment) => { setSelected(item.owner); setReason(''); setRejecting(false); setShowFullId(false); };
  return <><section className="enroll-admin enroll-card" aria-label="入驻申请审核">
    <header className="enroll-admin-head"><div><h2>入驻申请审核</h2><p className="enroll-muted">独立入驻页提交的申请 · 待审核 {visible.filter(x => x.status === 'pending').length} 条</p></div><button className="btn btn-outline" onClick={() => setRecords(readEnrollments())}>刷新申请</button></header>
    {visible.length === 0 ? <p className="enroll-muted">暂无入驻申请。申请人在“传记师入驻”页面提交后，会显示在这里。</p> : <div className="admin-table-wrap">
      <table className="admin-table enroll-review-table">
        <thead><tr><th>申请人</th><th>联系电话</th><th>服务城市</th><th>从业年限</th><th>申请时间</th><th>审核状态</th><th>操作</th></tr></thead>
        <tbody>{visible.map(item => <tr key={item.owner}>
          <td><strong>{item.name || '未填写姓名'}</strong></td>
          <td>{item.phone || '未填写手机号'}</td>
          <td className="admin-table-text-left">{item.cities.map(cityLabel).join('、') || '未选择城市'}</td>
          <td>{item.experience ? `${item.experience} 年` : '未填写'}</td>
          <td>{new Date(item.submittedAt).toLocaleString('zh-CN', { hour12: false })}</td>
          <td><span className={`enroll-review-status ${item.status}`}>{statusLabels[item.status]}</span></td>
          <td><button className="admin-table-link" onClick={() => select(item)}>{item.status === 'pending' ? '审核申请' : '查看申请'}</button></td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>
  <Modal open={!!record} title={`${record?.name || '传记师'}的入驻申请`} onClose={() => setSelected(null)} className="enroll-admin enroll-review-modal" footer={record?.status === 'pending' ? rejecting ? <div className="enroll-review-actions"><button className="btn btn-outline" onClick={() => { setRejecting(false); setReason(''); }}>返回审核</button><button className="btn btn-primary" onClick={() => review('rejected')}>确认审核不通过</button></div> : <div className="enroll-review-actions"><button className="btn btn-primary" onClick={() => review('approved')}>通过审核</button><button className="btn btn-outline" onClick={() => setRejecting(true)}>审核不通过</button></div> : undefined}>
    {record && <>
      {record.avatar && <div className="enroll-avatar"><img src={record.avatar} alt={`${record.name}的头像`} /></div>}
      {record.idCard && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowFullId(value => !value)}>{showFullId ? '隐藏完整证件号' : '查看完整证件号'}</button>}
      <EnrollmentSummary record={record} audit showFullId={showFullId} />
      {record.reason && <div className="enroll-notice">不通过原因 / 需补充资料：{record.reason}</div>}
      {record.status === 'pending' && rejecting && <label>不通过原因 / 需补充资料（必填）<textarea autoFocus aria-label="不通过原因或需要补充的资料" value={reason} rows={3} maxLength={500} onChange={e => setReason(e.target.value)} placeholder="例如：请上传代表作品完整样稿，并补充作品授权说明" /></label>}
      <h3>处理记录</h3><ol className="enroll-history">{record.history.map((item, index) => <li key={`${item.at}-${index}`}><p>{item.text}</p><small>{new Date(item.at).toLocaleString('zh-CN')}</small></li>)}</ol>
    </>}
  </Modal></>;
}
