import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './ui/Modal';
import { ENROLLMENT_EVENT, cityLabel, readEnrollments, enrollmentStatusLabel, transitionEnrollment, type Enrollment, type EnrollmentStatus } from '../data/biographerEnrollment';
import { EnrollmentSummary } from '../pages/BiographerApply';
import { useToast } from '../hooks/useToast';

export default function BiographerEnrollmentReview() {
  const [records, setRecords] = useState(readEnrollments);
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState('');
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
    if (!record || record.status !== 'pending') return;
    const text = status === 'approved' ? '平台审核通过，等待缴纳押金，账号尚未生成' : reason.trim() || '本次申请未通过，可调整资料后重新申请。';
    transitionEnrollment(record, status, text);
    setRecords(readEnrollments());
    setReason('');
    addToast(status === 'approved' ? '审核通过，待付押金' : '审核结果已保存', 'success');
  };
  const select = (item: Enrollment) => { setSelected(item.owner); setReason(''); };
  return <section className="enroll-admin enroll-card" aria-label="入驻申请审核">
    <header className="enroll-admin-head"><div><h2>入驻申请审核</h2><p className="enroll-muted">独立入驻页提交的申请 · 待审核 {visible.filter(x => x.status === 'pending').length} 条</p></div><button className="btn btn-outline" onClick={() => setRecords(readEnrollments())}>刷新申请</button></header>
    {visible.length === 0 ? <p className="enroll-muted">暂无入驻申请。申请人在“传记师入驻”页面提交后，会显示在这里。</p> : visible.map(item => <div className="enroll-admin-row" key={item.owner}><div><strong>{item.name || '未填写姓名'}</strong><small>{item.cities.map(cityLabel).join('、') || '未选择城市'} · {item.phone || '未填写手机号'} · {new Date(item.submittedAt).toLocaleDateString('zh-CN')}</small></div><span>{enrollmentStatusLabel(item)}</span><button className="btn btn-outline" onClick={() => select(item)}>{item.status === 'pending' ? '审核申请' : '查看申请'}</button></div>)}
    <Modal open={!!record} title={`${record?.name || ''}的入驻申请`} onClose={() => setSelected(null)} className="enroll-admin enroll-review-modal">
      {record && <>
        {record.status === 'pending' && <div className="enroll-notice"><strong>演示账号：待生成</strong><p>拟用登录账号：{record.phone} · 待审核通过并缴纳押金</p></div>}
        {record.status === 'approved' && <div className="enroll-notice"><p role="status"><strong>{enrollmentStatusLabel(record)}</strong></p><p>演示账号：尚未生成 · 拟用手机号：{record.phone}</p><p>入驻押金 ¥1,000 {record.depositPaidAt ? '已缴纳（模拟）' : '待缴纳'}，尚未开通接单。</p>{record.depositPaidAt && <Link className="btn btn-primary" to={`/admin/biographers?enrollment=${encodeURIComponent(record.owner)}`} onClick={() => setSelected(null)}>生成账号</Link>}</div>}
        {record.status === 'active' && <div className="enroll-notice"><p role="status"><strong>演示账号已生成</strong> · {record.accountProfile?.status === 'inactive' ? '已停用' : '已启用'}</p><p>登录账号：{record.accountProfile?.phone || record.phone}</p><p>登录方式：手机号 + 验证码（无初始密码）</p><p className="enroll-muted">仅本地演示记录，不开通真实账号。入驻押金 ¥1,000 已缴纳（模拟）。</p><Link className="btn btn-outline" to="/admin/biographers" onClick={() => setSelected(null)}>查看传记师管理</Link></div>}
        {record.avatar && <div className="enroll-avatar"><img src={record.avatar} alt={`${record.name}的头像`} /></div>}
        <EnrollmentSummary record={record} />
        {record.reason && <div className="enroll-notice">审核意见：{record.reason}</div>}
        {record.status === 'pending' && <><label>审核意见（选填）<textarea aria-label="审核意见（选填）" value={reason} rows={3} maxLength={500} onChange={e => setReason(e.target.value)} placeholder="填写处理意见，留空则使用演示意见" /></label><div className="enroll-actions"><button className="btn btn-primary" onClick={() => review('approved')}>通过审核</button><button className="btn btn-outline" onClick={() => review('rejected')}>审核不通过</button></div></>}
        <h3>处理记录</h3><ol className="enroll-history">{record.history.map((item, index) => <li key={`${item.at}-${index}`}><p>{item.text}</p><small>{new Date(item.at).toLocaleString('zh-CN')}</small></li>)}</ol>
      </>}
    </Modal>
  </section>;
}
