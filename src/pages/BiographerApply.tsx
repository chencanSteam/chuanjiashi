import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, PenLine, UploadCloud } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { emptyEnrollment, ENROLLMENT_EVENT, ENROLLMENT_DEPOSIT, cityLabel, readEnrollments, saveEnrollment, statusLabels, transitionEnrollment, validWorkUrl, type Enrollment } from '../data/biographerEnrollment';
import { regions } from '../data/regions';
import Modal from '../components/ui/Modal';
import './BiographerApply.css';

const time = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false });
const rules = [
  ['服务与交付', '按订单约定完成访谈、初稿、校审稿和终稿。按时沟通，修改范围与轮次以用户购买的套餐为准。'],
  ['隐私与作品授权', '仅将委托人资料用于约定服务；未经授权，不公开家庭信息、访谈素材或作品。作品使用与交付权利以双方确认的订单约定为准。'],
  ['阶段结算', '用户全款支付后，初稿、校审稿、终稿验收通过，分别按传记师应结算总额的 30%、40%、30% 结算。平台服务费及实际金额在接单前确认。'],
  ['变更与争议', '超出约定的需求先协商确认；退款、逾期或验收争议由平台人工跟进。不得私自将委托人资料交给他人。'],
  ['入驻押金', '申请时不收取押金；审批通过、确认合作后缴纳 1,000 元押金，再开通服务。押金与服务报酬分开记录。退出时可向平台申请退还，具体处理由平台确认。'],
];

export default function BiographerApply({ standalone }: { standalone?: boolean } = {}) {
  const { user } = useAuth();
  if (!user) return <div className="app-loading">正在进入入驻页面…</div>;
  return <EnrollmentPage key={user.phone} standalone={standalone} />;
}

function EnrollmentPage({ standalone }: { standalone?: boolean }) {
  const { user, addRole } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const owner = user?.phone || '';
  const [form, setForm] = useState<Enrollment>(() => readEnrollments().find(x => x.owner === owner) || emptyEnrollment(owner));
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooperation, setCooperation] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [province, setProvince] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [tagHint, setTagHint] = useState('');
  const [payment, setPayment] = useState(false);
  const canEdit = form.status === 'draft' || editing;
  useEffect(() => {
    const sync = () => {
      const latest = readEnrollments().find(x => x.owner === owner);
      if (latest && !editing && form.status !== 'draft') setForm(latest);
    };
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    window.addEventListener(ENROLLMENT_EVENT, sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('focus', sync); window.removeEventListener(ENROLLMENT_EVENT, sync); };
  }, [owner, editing, form.status]);
  const change = <K extends keyof Enrollment,>(key: K, value: Enrollment[K]) => { setForm(prev => ({ ...prev, [key]: value, ...((key === 'name' || key === 'idCard') ? { identityVerifiedAt: '' } : {}) })); setError(''); };
  const fail = (message: string) => { setError(message); addToast(message, 'error'); };
  const verifyIdentity = () => {
    try {
      setForm(saveEnrollment({ ...form, identityVerifiedAt: new Date().toISOString() }));
      addToast('实名认证模拟通过', 'success');
    } catch { fail('认证状态保存失败，请稍后重试'); }
  };
  const addCity = (city: string) => {
    if (!city) return;
    if (!form.cities.some(item => item.province === province && item.city === city)) change('cities', [...form.cities, { province, city }]);
  };
  const addSpecialty = () => {
    const value = specialtyInput.trim();
    if (Array.from(value).length < 3 || Array.from(value).length > 6) { setTagHint('每个标签填写 3～6 字，调整后即可添加'); return; }
    if (form.specialties.includes(value)) { setTagHint('这个标签已添加'); return; }
    change('specialties', [...form.specialties, value]); setSpecialtyInput(''); setTagHint('');
  };
  const persist = () => {
    try { setForm(saveEnrollment(form)); addToast('草稿已保存，下次可继续填写', 'success'); }
    catch { fail('本地存储空间不足，请减少附件后重试'); }
  };
  const submit = () => {
    try {
      setForm(transitionEnrollment(form, 'pending', '提交入驻申请，等待平台审核'));
      setEditing(false); setError(''); addToast('申请已提交，可在本页查看审核进度', 'success');
    } catch { fail('保存失败，请减少附件后重试'); }
  };
  const upload = async (event: ChangeEvent<HTMLInputElement>, avatar = false) => {
    const files = Array.from(event.target.files || []); event.target.value = '';
    if (!files.length) return;
    if (!avatar && form.files.length + files.length > 3) { fail('作品最多上传 3 个文件'); return; }
    if (files.some(file => file.size > 1024 * 1024 || !(avatar ? /\.(png|jpe?g|webp)$/i : /\.(png|jpe?g|webp|pdf)$/i).test(file.name))) {
      fail(avatar ? '头像支持 JPG、PNG、WebP，大小不超过 1MB' : '作品支持 JPG、PNG、WebP、PDF，单个不超过 1MB'); return;
    }
    setBusy(true);
    try {
      const attachments = await Promise.all(files.map(file => new Promise<{name: string; data: string; type: string}>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, data: String(reader.result), type: file.type }); reader.onerror = reject; reader.readAsDataURL(file);
      })));
      if (avatar) change('avatar', attachments[0].data);
      else change('files', [...form.files, ...attachments]);
    } catch { fail('文件读取失败，请重新选择'); } finally { setBusy(false); }
  };
  const openWorkbench = () => { addRole('biographer'); navigate('/biographer/orders'); };
  const activate = () => {
    if (form.status !== 'approved') return;
    if (!form.depositPaidAt) { setPayment(true); return; }
    try { setForm(transitionEnrollment(form, 'active', '已确认合作规则，传记师服务已开通')); addRole('biographer'); addToast('已开通传记师服务', 'success'); }
    catch { fail('开通状态保存失败，请重试'); }
  };
  const payDeposit = () => {
    const latest = readEnrollments().find(item => item.owner === owner);
    if (!latest || latest.status !== 'approved') { setPayment(false); return; }
    try {
      const paid = latest.depositPaidAt ? latest : { ...latest, depositAmount: ENROLLMENT_DEPOSIT, depositPaidAt: new Date().toISOString(), history: [...latest.history, { at: new Date().toISOString(), text: '审核通过后已模拟缴纳入驻押金 ¥1,000' }] };
      setForm(transitionEnrollment(paid, 'active', '已确认合作规则并缴纳押金，传记师服务已开通'));
      setError(''); addRole('biographer'); setPayment(false);
      addToast('押金模拟缴纳成功，已开通服务', 'success');
    } catch { fail('本地保存失败，请稍后重试'); }
  };
  const activeStep = form.status === 'draft' ? 0 : ['pending', 'supplement', 'rejected'].includes(form.status) ? 1 : form.status === 'approved' ? 2 : 3;
  return <main className={`enroll-page ${standalone ? 'enroll-standalone' : ''}`}>
    <nav className="enroll-nav"><button className="btn btn-ghost" onClick={() => navigate('/home')}><ArrowLeft size={16} /> 返回首页</button><span>传家世 · 传记师入驻</span></nav>
    <header className="enroll-hero"><div><span className="enroll-eyebrow">以文字留住人生，以故事传承家风</span><h1>成为传家世传记师</h1><p>提交经历与作品，开启为家庭记录人生的旅程。</p></div><PenLine size={48} strokeWidth={1.2} /></header>
    <ol className="enroll-progress">{['填写申请', '平台审核', '合作与押金', '开通接单'].map((label, index) => <li key={label} className={index <= activeStep ? 'current' : ''} aria-current={index === activeStep ? 'step' : undefined}><span>{index < activeStep ? <CheckCircle2 size={18} /> : index + 1}</span>{label}</li>)}</ol>
    <div className="enroll-layout"><div>
      {canEdit ? <section className="enroll-card">
        <div className="enroll-tabs">{['基本资料', '作品案例', '确认提交'].map((label, index) => <button key={label} type="button" className={step === index ? 'selected' : ''} onClick={() => { setStep(index); setError(''); }}>{index + 1}. {label}</button>)}</div>
        {form.reason && <div className="enroll-notice"><strong>审核意见</strong><p>{form.reason}</p></div>}
        <form noValidate onSubmit={e => { e.preventDefault(); if(step < 2) { setStep(step + 1); setError(''); } else submit(); }}>
          {step === 0 && <div className="enroll-fields">
            <div className="enroll-section-heading"><h2>实名认证</h2><p>填写与身份证一致的真实姓名和身份证号，申请资料与对外服务统一使用真实姓名。</p></div>
            <div className="enroll-grid">
              <label>真实姓名<input value={form.name} maxLength={30} onChange={e => change('name', e.target.value)} placeholder="请输入身份证上的姓名" /></label>
              <label>身份证号<input value={form.idCard} maxLength={18} autoComplete="off" onChange={e => change('idCard', e.target.value)} placeholder="请输入身份证号" /></label>
            </div>
            <div className="enroll-identity"><div><strong>{form.identityVerifiedAt ? '已实名认证（模拟）' : '待实名认证'}</strong><p>当前为演示认证，无需填写真实证件信息；修改姓名或身份证号后可重新认证。</p></div><button type="button" className="btn btn-outline" disabled={!!form.identityVerifiedAt} onClick={verifyIdentity}>{form.identityVerifiedAt ? '认证已完成' : '模拟实名认证'}</button></div>
            <div className="enroll-section-heading"><h2>个人资料</h2></div>
            <div className="enroll-avatar">{form.avatar ? <img src={form.avatar} alt="申请头像" /> : <span><PenLine size={24} /></span>}<label className="btn btn-outline">{form.avatar ? '更换头像' : '上传头像（选填）'}<input type="file" accept=".png,.jpg,.jpeg,.webp" disabled={busy} onChange={e => upload(e, true)} hidden /></label>{form.avatar && <button type="button" className="btn btn-ghost" onClick={() => change('avatar', '')}>移除头像</button>}</div>
            <div className="enroll-grid">
              <label>联系手机号<input inputMode="tel" value={form.phone} maxLength={11} onChange={e => change('phone', e.target.value)} /></label>
              <label>从业年限<input type="text" inputMode="numeric" value={form.experience} onChange={e => change('experience', e.target.value)} placeholder="没有相关经验可填 0" /></label>
            </div>
            <label>个人介绍<textarea aria-label="个人介绍" rows={4} maxLength={500} value={form.intro} onChange={e => change('intro', e.target.value)} placeholder="介绍采访、写作或编辑经历，以及擅长的人物故事" /><small>{form.intro.length}/500</small></label>
            <fieldset><legend>服务城市（可多选）</legend>
              <div className="enroll-city-selects"><label>省份<select aria-label="服务省份" value={province} onChange={e => setProvince(e.target.value)}><option value="">请选择省份</option>{regions.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label><label>城市<select aria-label="服务城市" value="" disabled={!province} onChange={e => addCity(e.target.value)}><option value="">{province ? '选择城市后添加' : '请先选择省份'}</option>{regions.find(item => item.name === province)?.cities.map(item => <option key={item.name} value={item.name} disabled={form.cities.some(city => city.province === province && city.city === item.name)}>{item.name}</option>)}</select></label></div>
              <div className="enroll-tags enroll-chosen">{form.cities.map((item, index) => <button className="selected" type="button" key={`${item.province}-${item.city}`} aria-label={`移除城市 ${cityLabel(item)}`} onClick={() => change('cities', form.cities.filter((_, i) => i !== index))}>{cityLabel(item)} ×</button>)}</div>
              <p className="enroll-muted">可跨省选择多个服务城市，点击已选城市可移除。</p>
            </fieldset>
            <fieldset><legend>擅长领域（自定义标签，每个 3～6 字）</legend><div className="enroll-tag-editor"><input aria-label="擅长领域标签" value={specialtyInput} onChange={e => { setSpecialtyInput(e.target.value); setTagHint(''); }} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); addSpecialty(); } }} placeholder="例如：口述历史" /><button className="btn btn-outline" type="button" onClick={addSpecialty}>添加标签</button></div>
              {tagHint && <p className="enroll-muted" role="status">{tagHint}</p>}
              <div className="enroll-tags enroll-chosen">{form.specialties.map(item => <button className="selected" type="button" key={item} aria-label={`移除标签 ${item}`} onClick={() => change('specialties', form.specialties.filter(x => x !== item))}>{item} ×</button>)}</div>
            </fieldset>
          </div>}
          {step === 1 && <div className="enroll-fields"><div className="enroll-section-heading"><h2>展示一份代表作品</h2><p>请提供已获授权或脱敏的案例，可上传文件或填写作品链接。</p></div>
            <label>作品名称<input maxLength={80} value={form.workTitle} onChange={e => change('workTitle', e.target.value)} placeholder="例如：《父亲的手艺》口述访谈节选" /></label>
            <label>作品说明<textarea aria-label="作品说明" rows={4} maxLength={800} value={form.workDescription} onChange={e => change('workDescription', e.target.value)} placeholder="说明作品背景、本人承担的工作与创作成果" /></label>
            <label>作品链接<input type="text" value={form.workUrl} maxLength={500} onChange={e => change('workUrl', e.target.value)} placeholder="https://…" /></label>
            <label className="enroll-upload"><UploadCloud size={26} /><strong>{busy ? '正在读取文件…' : '点击选择作品文件'}</strong><span>PDF / JPG / PNG / WebP，最多 3 个，单个不超过 1MB</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple disabled={busy} onChange={e => upload(e)} /></label>
            <div className="enroll-files">{form.files.map((file, index) => <div key={`${file.name}-${index}`}><FileText size={18} /><span>{file.name}</span><button type="button" className="btn btn-ghost" aria-label={`移除 ${file.name}`} onClick={() => change('files', form.files.filter((_, i) => i !== index))}>移除</button></div>)}</div>
          </div>}
          {step === 2 && <div className="enroll-fields"><div className="enroll-section-heading"><h2>确认申请资料</h2><p>提交后由平台审核，可在本页查看进度和修改意见。</p></div><EnrollmentSummary record={form} /><label className="enroll-check"><input type="checkbox" checked={form.consent} onChange={e => change('consent', e.target.checked)} /><span>我确认资料真实、案例已获授权或脱敏，并同意资料用于入驻审核。</span></label><button type="button" className="btn btn-ghost" onClick={() => setShowRules(!showRules)}>查看合作规则</button></div>}
          {error && <p className="enroll-error" role="alert">{error}</p>}
          <footer className="enroll-actions"><button type="button" className="btn btn-outline" disabled={busy} onClick={persist}>保存草稿</button><div>{step > 0 && <button type="button" className="btn btn-ghost" onClick={() => { setStep(step - 1); setError(''); }}>上一步</button>}<button type="submit" className="btn btn-primary" disabled={busy}>{step === 2 ? '提交入驻申请' : '下一步'}<ArrowRight size={16} /></button></div></footer>
        </form>
      </section> : <section className="enroll-card">
        <div className={`enroll-status enroll-status-${form.status}`}><CheckCircle2 size={28} /><div><h2>{statusLabels[form.status]}</h2><p>{form.status === 'pending' ? '资料已收到，预计 1～3 个工作日完成审核。请留意本页进度。' : form.status === 'approved' ? '平台已完成审核，确认合作并缴纳 1,000 元押金后即可开通。' : form.status === 'active' ? '您已完成入驻，可进入传记师工作台。' : form.reason}</p></div></div>
        <EnrollmentSummary record={form} />
        {['supplement', 'rejected'].includes(form.status) && <button className="btn btn-primary" onClick={() => { setEditing(true); setStep(0); }}>修改资料重新提交</button>}
        {form.status === 'pending' && <p className="enroll-muted">资料审核期间暂不可修改；如需补充，平台将在审核意见中说明。</p>}
        {form.status === 'approved' && <div className="enroll-cooperation"><h3>确认合作并缴纳押金</h3><p>身份与收款安排已由平台人工确认，具体订单报酬在接单前确认。</p><CooperationRules /><section className="enroll-deposit"><div><h3>入驻押金</h3><strong>¥1,000</strong><p>{form.depositPaidAt ? `已模拟缴纳 · ${time(form.depositPaidAt)}` : '审核已通过，缴纳押金后开通接单；申请与审核阶段不收费。'}</p></div></section><label className="enroll-check"><input type="checkbox" checked={cooperation} onChange={e => setCooperation(e.target.checked)} /><span>我已阅读并同意以上合作规则（版本 V1.0）</span></label><button className="btn btn-primary" onClick={activate}>{form.depositPaidAt ? '确认合作并开通' : '确认合作并缴纳押金'}</button></div>}
        {form.status === 'active' && <button className="btn btn-primary" onClick={openWorkbench}>进入传记师工作台 <ArrowRight size={16} /></button>}
        {error && <p className="enroll-error" role="alert">{error}</p>}
      </section>}
      {showRules && <section className="enroll-card enroll-rule-panel"><h2>合作规则 · V1.0</h2><CooperationRules /></section>}
    </div><aside className="enroll-aside"><section className="enroll-card"><h3>申请前，请准备</h3><ul><li>一段个人经历与写作介绍</li><li>一份可查看的代表作品</li><li>可联系到您的手机号</li></ul><div className="enroll-note">申请与审核阶段不收押金。审批通过后，最后模拟缴纳 ¥1,000 再开通服务。请填写姓名与身份证号完成模拟实名认证，收款安排由平台人工确认。</div><h3>审核与开通</h3><p>审核通过后确认合作规则，缴纳押金后开通服务。需补充资料时，原有填写内容会保留。</p></section>{form.history.length > 0 && <section className="enroll-card"><h3>申请进度</h3><ol className="enroll-history">{[...form.history].reverse().map((item, index) => <li key={`${item.at}-${index}`}><p>{item.text}</p><small>{time(item.at)}</small></li>)}</ol></section>}</aside></div>
    <Modal open={payment} title="缴纳入驻押金" onClose={() => setPayment(false)} footer={<><button className="btn btn-outline" onClick={() => setPayment(false)}>取消</button><button className="btn btn-primary" onClick={payDeposit}>模拟支付并开通</button></>}>
      <div className="enroll-payment"><p>传记师入驻押金</p><strong>¥1,000</strong><p>本次为演示支付，不会产生真实扣款。</p></div>
    </Modal>
  </main>;
}
function CooperationRules() { return <div className="enroll-rules">{rules.map(([title, text]) => <div key={title}><strong>{title}</strong><p>{text}</p></div>)}</div>; }
export function EnrollmentSummary({ record }: { record: Enrollment }) {
  return <div className="enroll-summary"><dl>{[['真实姓名', record.name], ['身份证号', record.idCard ? (record.idCard.length > 8 ? `${record.idCard.slice(0, 3)}${'*'.repeat(record.idCard.length - 7)}${record.idCard.slice(-4)}` : '*'.repeat(record.idCard.length)) : ''], ['实名认证', record.identityVerifiedAt ? '已实名认证（模拟）' : '待实名认证'], ['联系方式', record.phone], ['服务城市', record.cities.map(cityLabel).join('、')], ['从业年限', record.experience ? `${record.experience} 年` : ''], ['入驻押金', record.depositPaidAt ? `¥1,000 · 已模拟缴纳` : record.status === 'approved' ? '¥1,000 · 待缴纳' : '审核通过后缴纳，当前无需缴纳'], ['擅长领域', record.specialties.join('、')], ['个人介绍', record.intro], ['作品名称', record.workTitle], ['作品说明', record.workDescription]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '未填写'}</dd></div>)}</dl>{record.workUrl && validWorkUrl(record.workUrl) && <p><a href={record.workUrl} target="_blank" rel="noopener noreferrer">查看作品链接 ↗</a></p>}{record.files.map((file, index) => <p key={`${file.name}-${index}`}><a href={file.data} download={file.name}>下载查看：{file.name}</a></p>)}</div>;
}
