import { Fragment, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Modal from './ui/Modal';
import { SERVICE_ORDER_EVENT, money, phoneUnlocked, readServiceOrders, serviceOrderVisible, serviceStatusLabels, updateServiceOrder, type ServiceAction, type ServiceOrder, type ServiceRole, type ServiceStage, type ServiceStatus } from '../data/biographerServiceOrders';
import { parseManuscriptChapters, readWorkChapters, type ManuscriptChapter } from '../utils/biographerWorkChapters';
import './BiographerServiceOrders.css';

const date = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false });
const actionLabels: Record<ServiceAction, string> = { accept: '确认接单', decline: '无法承接', cancel: '取消订单', pay: '模拟全款支付', deliver: '提交稿件', revise: '提交修改意见', approve: '确认验收通过', settle: '确认结算', help: '申请平台介入', refund: '申请退款', resolve: '确认处理完成', reject_request: '驳回申请' };
export default function BiographerServiceOrders({ role, earningsOnly = false, modalOnly = false, controlledId, onControlledClose }: { role: ServiceRole; earningsOnly?: boolean; modalOnly?: boolean; controlledId?: string | null; onControlledClose?: () => void }) {
  const { user } = useAuth(); const { addToast } = useToast(); const navigate = useNavigate(); const [params] = useSearchParams();
  const [orders, setOrders] = useState(readServiceOrders);
  const [selectedId, setSelectedId] = useState<string | null>(() => params.get('serviceOrder'));
  const [keyword, setKeyword] = useState(''); const [status, setStatus] = useState<ServiceStatus | 'all'>('all');
  const [action, setAction] = useState<{ orderId: string; kind: ServiceAction; stageIndex?: number } | null>(null);
  const [reading, setReading] = useState<{ orderId: string; stageIndex: number; versionIndex: number } | null>(null);
  const [chapterId, setChapterId] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'existing' | 'attachment'>('existing');
  const [attachmentData, setAttachmentData] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [readerChapterId, setReaderChapterId] = useState('');
  const [text, setText] = useState(''); const [fileName, setFileName] = useState(''); const [refundAmount, setRefundAmount] = useState('');
  const phone = user?.phone || '';
  const ownOrders = orders.filter(item => serviceOrderVisible(item, role, phone));
  const visible = ownOrders.filter(item => (status === 'all' || item.status === status) && `${item.id} ${item.customerName} ${item.biographerName} ${item.service.name} ${item.requirements.interviewee}`.includes(keyword.trim()));
  const selected = ownOrders.find(item => item.id === (controlledId !== undefined ? controlledId : selectedId));
  const actionOrder = ownOrders.find(item => item.id === action?.orderId);
  const readingOrder = ownOrders.find(item => item.id === reading?.orderId);
  const readingStage = readingOrder?.stages[reading?.stageIndex ?? -1];
  const readingVersion = readingStage?.versions[reading?.versionIndex ?? -1];
  const readerChapters = readingVersion?.chapters?.length ? readingVersion.chapters : parseManuscriptChapters(readingVersion?.content || '');
  const activeReaderChapter = readerChapters.find(chapter => chapter.id === readerChapterId) || readerChapters[0];
  const getActionChapters = (order: ServiceOrder, stageIndex: number, kind: ServiceAction): ManuscriptChapter[] => {
    const stage = order.stages[stageIndex];
    if (kind === 'deliver') {
      const saved = readWorkChapters(order.id);
      if (saved.length) return saved;
    }
    const latest = stage?.versions.at(-1);
    return latest?.chapters?.length ? latest.chapters : parseManuscriptChapters(latest?.content || '');
  };
  const actionChapters = actionOrder && action?.stageIndex !== undefined && ['deliver', 'revise'].includes(action.kind)
    ? getActionChapters(actionOrder, action.stageIndex, action.kind) : [];
  const chosenChapter = actionChapters.find(chapter => chapter.id === chapterId);
  const deliveryChapters = deliveryMode === 'existing' && action?.kind === 'deliver'
    ? chapterId === 'all' ? actionChapters.filter(chapter => chapter.content.trim()) : chosenChapter ? [chosenChapter] : [] : [];
  const deliveryText = deliveryChapters.map(chapter => `${chapter.title}\n\n${chapter.content}`).join('\n\n');
  useEffect(() => {
    const sync = () => setOrders(readServiceOrders());
    window.addEventListener('storage', sync); window.addEventListener(SERVICE_ORDER_EVENT, sync); window.addEventListener('focus', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(SERVICE_ORDER_EVENT, sync); window.removeEventListener('focus', sync); };
  }, []);
  const openAction = (order: ServiceOrder, kind: ServiceAction, stageIndex?: number, preferredChapterId?: string) => {
    const choices = stageIndex === undefined ? [] : getActionChapters(order, stageIndex, kind);
    const chosen = choices.find(chapter => chapter.id === preferredChapterId) || choices[0];
    setAction({ orderId: order.id, kind, stageIndex }); setChapterId(kind === 'deliver' ? 'all' : chosen?.id || '');
    setDeliveryMode(choices.length ? 'existing' : 'attachment'); setDeliveryNote(''); setAttachmentData('');
    setText(''); setFileName(''); setRefundAmount(String(order.amount));
  };
  const selectAttachment = (file?: File) => {
    setFileName(''); setAttachmentData('');
    if (!file) return;
    if (file.size > 1024 * 1024) { addToast('演示附件请小于 1 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => { setFileName(file.name); setAttachmentData(String(reader.result)); };
    reader.onerror = () => addToast('读取附件失败，请重新选择', 'error');
    reader.readAsDataURL(file);
  };
  const execute = () => {
    if (!action) return;
    if (action.kind === 'revise' && !text.trim()) { addToast('请填写具体修改意见', 'error'); return; }
    if (action.kind === 'deliver' && deliveryMode === 'existing' && (!deliveryChapters.length || !deliveryChapters.some(chapter => chapter.content.trim()))) { addToast('请选择有正文的稿件', 'error'); return; }
    if (action.kind === 'deliver' && deliveryMode === 'attachment' && !attachmentData) { addToast('请先选择稿件附件', 'error'); return; }
    try {
      updateServiceOrder(action.orderId, action.kind, { role, phone }, { text: action.kind === 'deliver' ? deliveryText : text, fileName: action.kind === 'deliver' && deliveryMode === 'attachment' ? fileName : '', attachmentData: action.kind === 'deliver' && deliveryMode === 'attachment' ? attachmentData : undefined, note: action.kind === 'deliver' ? deliveryNote : undefined, stageIndex: action.stageIndex, amount: refundAmount === '' ? undefined : Number(refundAmount), chapters: deliveryChapters.length ? deliveryChapters : undefined, focusChapterId: action.kind === 'deliver' && deliveryMode === 'existing' && chapterId !== 'all' ? chapterId : undefined, chapterTitle: action.kind === 'revise' ? chosenChapter?.title : undefined });
      setAction(null); addToast(`${actionLabels[action.kind]}成功`, 'success');
    } catch (error) { addToast(error instanceof Error ? error.message : '操作失败，请重试', 'error'); }
  };
  const renderRevisionRecord = (order: ServiceOrder, stage: ServiceStage, stageIndex: number) => stage.versions.length > 0 && <div className="bs-revision-record">
    <h5>稿件与修改记录 <span>{stage.versions.length} 版 · {stage.feedback.length} 轮意见</span></h5>
    {stage.versions.map((version, versionIndex) => <Fragment key={`${version.at}-${versionIndex}`}>
      <div className="bs-record-entry"><span className="bs-record-dot" /><div><strong>传记师提交第 {versionIndex + 1} 版{version.focusChapterId && version.chapters?.length === 1 ? ` · ${version.chapters[0].title}` : version.chapters?.length && version.chapters.length > 1 ? ' · 全文' : ''}</strong><small>{date(version.at)}</small>{version.note && <p>留言：{version.note}</p>}<button className="btn btn-ghost btn-sm" onClick={() => setReading({ orderId: order.id, stageIndex, versionIndex })}>查看第 {versionIndex + 1} 版稿件</button></div></div>
      {stage.feedback[versionIndex] && <div className="bs-record-entry bs-record-feedback"><span className="bs-record-dot" /><div><strong>客户第 {versionIndex + 1} 轮修改意见{stage.feedback[versionIndex].chapterTitle ? ` · ${stage.feedback[versionIndex].chapterTitle}` : ''}</strong><small>{date(stage.feedback[versionIndex].at)}</small><p>{stage.feedback[versionIndex].text}</p></div></div>}
    </Fragment>)}
    {stage.acceptedAt && <div className="bs-record-entry bs-record-approved"><span className="bs-record-dot" /><div><strong>客户验收通过</strong><small>{date(stage.acceptedAt)}</small></div></div>}
  </div>;
  const renderSettlements = (order: ServiceOrder) => <div className="bs-settlements"><p>订单全款 {money(order.amount)} · 平台服务费 {Math.round(order.commissionRate * 100)}%（{money(order.platformFee)}） · 传记师应得 {money(order.providerAmount)}</p><div className="bs-stage-payments">{order.stages.slice(1).map((stage, index) => <div key={stage.name}><strong>{stage.name} · {[30, 40, 30][index]}%</strong><b>{money(stage.amount)}</b><span>{stage.settledAt ? `已结算 · ${date(stage.settledAt)}` : order.status === 'refunded' ? '订单退款结束，停止结算' : stage.status === 'accepted' ? '待平台结算' : '验收通过后结算'}</span>{role === 'admin' && stage.status === 'accepted' && !stage.settledAt && order.status !== 'refunded' && <button className="btn btn-outline" disabled={order.requests.some(item => item.status === 'pending')} onClick={() => openAction(order, 'settle', index + 1)}>结算{stage.name}</button>}</div>)}</div></div>;
  return <>{!modalOnly && <section className="bs-orders" aria-label={earningsOnly ? '服务订单阶段结算' : '传记师服务订单'}>
    <header className="bs-head"><div><h2>{earningsOnly ? '服务订单阶段结算' : '传记师服务订单'}</h2><p>{earningsOnly ? '初稿 30% · 校审稿 40% · 终稿 30%，用户验收后由平台确认结算' : '查看服务需求、交付进度与订单记录'}</p></div>{role === 'customer' && <button className="btn btn-outline" onClick={() => navigate('/biographers')}>选择传记师</button>}</header>
    <div className="bs-filters"><input aria-label="搜索服务订单" placeholder="搜索订单号、人物或套餐" value={keyword} onChange={e => setKeyword(e.target.value)} /><select aria-label="服务订单状态" value={status} onChange={e => setStatus(e.target.value as ServiceStatus | 'all')}><option value="all">全部服务状态</option>{Object.entries(serviceStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    {visible.length === 0 ? <p className="bs-empty">暂无符合条件的服务订单{role === 'customer' ? '，可先选择传记师提交需求。' : '。'}</p> : earningsOnly ? visible.map(order => <article className="bs-order" key={order.id}>
      <div className="bs-row"><small>{order.id} · {date(order.createdAt)}</small><span className="bs-badge">{serviceStatusLabels[order.status]}{order.requests.some(item => item.status === 'pending') ? ' · 平台处理中' : ''}</span></div>
      <div className="bs-row"><div><h3>{order.biographerName} · {order.service.name}</h3><p>传主：{order.requirements.interviewee || '待补充'} · 客户：{order.customerName}</p></div><strong className="bs-price">{money(order.amount)}</strong></div>
      {renderSettlements(order)}
    </article>) : (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>订单号</th><th>服务</th><th>传主 / 客户</th><th>金额</th><th>交付进度</th><th>状态</th><th>下单时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            {visible.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td className="admin-table-text-left">{order.service.name}<br /><small>{order.biographerName}</small></td>
                <td>{order.requirements.interviewee || '待补充'} / {order.customerName}</td>
                <td>{money(order.amount)}</td>
                <td>{order.paidAt ? `${order.stages.filter(item => item.status === 'accepted').length}/4 个交付阶段已确认` : '待付款'}</td>
                <td><span className="bs-badge">{serviceStatusLabels[order.status]}{order.requests.some(item => item.status === 'pending') ? ' · 平台处理中' : ''}</span></td>
                <td>{date(order.createdAt)}</td>
                <td><button className="btn btn-primary btn-sm" onClick={() => setSelectedId(order.id)}>查看服务订单</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    </section>}
    <Modal open={!!selected} title="传记师服务订单详情" onClose={() => { if (controlledId !== undefined) onControlledClose?.(); else setSelectedId(null); }} className="bs-detail-modal">
      {selected && <div className="bs-detail">
        <div className="bs-row"><strong>{selected.id}</strong><span className="bs-badge">{serviceStatusLabels[selected.status]}</span></div>
        <h3>{selected.biographerName} · {selected.service.name}</h3>
        <section className="bs-section"><h4>服务确认单</h4><p>{selected.service.description}</p><dl className="bs-info">{[['订单全款', money(selected.amount)], ['采访次数', selected.service.interviewCount], ['交付字数', selected.service.wordCount], ['交付周期', selected.service.deliveryPeriod ? `${selected.service.deliveryPeriod}（付款后起算）` : '付款前按套餐确认'], ['修改轮次', selected.service.revisionCount], ['实体书 / 排版', selected.service.physicalBook], ['采访对象', selected.requirements.interviewee], ['与传主关系', selected.requirements.relation], ['需求说明', selected.requirements.remark], ['方便联系时间', selected.requirements.preferredTime], ['访谈方式或地点', selected.requirements.location]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '待补充'}</dd></div>)}</dl></section>
        <section className="bs-contact"><Phone size={20} /><div><strong>传记师联系方式</strong>{role === 'admin' || role === 'biographer' || phoneUnlocked(selected) ? <p><a href={`tel:${selected.biographerPhone}`}>{selected.biographerPhone}</a> · 电话沟通，修改意见和验收请保留在订单内</p> : <p>付款后可查看联系方式。</p>}</div></section>
        {role !== 'customer' && <p className="bs-muted">客户联系电话：{selected.requirements.contactPhone || selected.customerPhone}</p>}
        {selected.closeReason && <p className="bs-notice">关闭原因：{selected.closeReason}</p>}
        {!selected.requests.some(item => item.status === 'pending') && <div className="bs-actions">
          {role === 'biographer' && selected.status === 'pending_accept' && <><button className="btn btn-primary" onClick={() => openAction(selected, 'accept')}>确认接单</button><button className="btn btn-outline" onClick={() => openAction(selected, 'decline')}>无法承接</button></>}
          {role === 'customer' && selected.status === 'pending_pay' && <button className="btn btn-primary" onClick={() => openAction(selected, 'pay')}>支付全款 {money(selected.amount)}</button>}
          {role === 'customer' && ['pending_accept', 'pending_pay'].includes(selected.status) && <button className="btn btn-outline" onClick={() => openAction(selected, 'cancel')}>取消订单</button>}
          {role === 'customer' && selected.paidAt && ['working', 'completed'].includes(selected.status) && <><button className="btn btn-outline" onClick={() => openAction(selected, 'help')}>联系不上 / 平台介入</button><button className="btn btn-outline" onClick={() => openAction(selected, 'refund')}>申请退款</button></>}
        </div>}
        {selected.requests.map((request, index) => <section className="bs-section" key={index}><h4>{request.type === 'refund' ? '退款申请' : '平台介入'} · {request.status === 'pending' ? '待处理' : request.status === 'resolved' ? '已处理' : '已驳回'}</h4><p>{request.reason}</p>{request.result && <p>处理结果：{request.result}{request.amount > 0 ? ` · 已模拟退款 ${money(request.amount)}` : ''}</p>}{request.status === 'pending' && <p className="bs-notice">平台处理期间暂缓交付、验收和未完成的结算。</p>}{role === 'admin' && request.status === 'pending' && <div className="bs-actions"><button className="btn btn-primary" onClick={() => openAction(selected, 'resolve')}>处理申请</button><button className="btn btn-outline" onClick={() => openAction(selected, 'reject_request')}>驳回申请</button></div>}</section>)}
        {selected.paidAt && <><section className="bs-section"><h4>服务交付与验收</h4>{selected.stages.map((stage, index) => {
          const latest = stage.versions.at(-1); const current = selected.stages.findIndex(item => item.status !== 'accepted') === index;
          const enabled = selected.status === 'working' && current && !selected.requests.some(item => item.status === 'pending');
          return <article className="bs-stage" key={stage.name}><div className="bs-row"><h4>{index + 1}. {stage.name}</h4><span>{stage.status === 'accepted' ? '验收通过' : stage.status === 'review' ? '待用户验收' : stage.status === 'revision' ? '待修改重提' : '待提交'}</span></div>
            {latest ? <><p className="bs-muted">当前第 {stage.versions.length} 版 · {date(latest.at)}{latest.fileName ? ` · 附件：${latest.fileName}` : ''}</p><button className="btn btn-outline btn-sm" onClick={() => setReading({ orderId: selected.id, stageIndex: index, versionIndex: stage.versions.length - 1 })}>查看当前稿件</button>{renderRevisionRecord(selected, stage, index)}</> : <p className="bs-muted">{index === 0 ? '前一阶段完成后，传记师提交本阶段稿件。' : '前一阶段验收通过后，提交本阶段稿件。'}</p>}
            <div className="bs-actions">{role === 'biographer' && enabled && ['waiting', 'revision'].includes(stage.status) && <button className="btn btn-primary" onClick={() => openAction(selected, 'deliver', index)}>提交{stage.name}</button>}{role === 'customer' && enabled && stage.status === 'review' && <><button className="btn btn-primary" onClick={() => openAction(selected, 'approve', index)}>验收通过{stage.name}</button><button className="btn btn-outline" onClick={() => openAction(selected, 'revise', index)}>提出修改意见</button></>}</div>
          </article>;
        })}</section>{role !== 'customer' && <section className="bs-section"><h4>阶段结算</h4>{renderSettlements(selected)}</section>}</>}
        <details className="bs-section"><summary>订单操作日志</summary>{[...selected.history].reverse().map((item, index) => <p key={index}><small>{date(item.at)}</small><br />{item.text.replace('（尚未付款）', '')}</p>)}</details>
      </div>}
    </Modal>
    <Modal open={!!readingVersion} title={readingStage ? `${readingStage.name} · 第 ${(reading?.versionIndex ?? 0) + 1} 版` : '查看稿件'} onClose={() => setReading(null)} className="bs-reader-modal">
      {readingVersion && <div className="bs-reader"><p className="bs-muted">提交时间：{date(readingVersion.at)}</p>{readingVersion.note && <p className="bs-delivery-note">传记师留言：{readingVersion.note}</p>}{readingVersion.attachmentData ? <p><a className="btn btn-outline" href={readingVersion.attachmentData} download={readingVersion.fileName}>下载稿件附件：{readingVersion.fileName}</a></p> : readingVersion.fileName && !readingVersion.content ? <p>附件名称：{readingVersion.fileName}</p> : <>{readerChapters.length > 1 && <nav className="bs-chapter-list" aria-label="稿件章节">{readerChapters.map(chapter => <button type="button" key={chapter.id} className={activeReaderChapter?.id === chapter.id ? 'active' : ''} onClick={() => setReaderChapterId(chapter.id)}>{chapter.title}</button>)}</nav>}{activeReaderChapter?.title !== '全文' && <h4>{activeReaderChapter?.title}</h4>}<pre>{activeReaderChapter?.content || readingVersion.content}</pre></>}{role === 'customer' && readingOrder?.status === 'working' && readingStage?.status === 'review' && reading?.versionIndex === readingStage.versions.length - 1 && <button className="btn btn-outline" onClick={() => { openAction(readingOrder, 'revise', reading.stageIndex, activeReaderChapter?.id); setReading(null); }}>提出修改意见</button>}<p className="bs-muted">阅读后可返回订单详情验收，或提出修改意见。</p></div>}
    </Modal>
    <Modal open={!!action && !!actionOrder} title={action ? actionLabels[action.kind] : ''} onClose={() => setAction(null)} footer={<><button className="btn btn-outline" onClick={() => setAction(null)}>返回</button><button className="btn btn-primary" onClick={execute}>{action ? (actionLabels[action.kind].startsWith('确认') ? actionLabels[action.kind] : `确认${actionLabels[action.kind]}`) : '确认'}</button></>}>
      {action && actionOrder && <div className="bs-action-form">
        {action.kind === 'pay' && <><h3>全款 {money(actionOrder.amount)}</h3><p>请确认订单金额与服务内容。本次为模拟支付，不会实际扣款。</p></>}
        {action.kind === 'accept' && <p>确认可按订单约定的套餐、价格、交付周期与修改轮次承接服务。</p>}
        {action.kind === 'approve' && <p>确认{actionOrder.stages[action.stageIndex ?? 0].name}符合约定。{(action.stageIndex ?? 0) > 0 ? '验收通过后将生成该阶段待结算记录。' : '确认后传记师可开始初稿创作。'}</p>}
        {action.kind === 'settle' && <p>将本阶段 {money(actionOrder.stages[action.stageIndex ?? 0].amount)} 标记为已结算，仅演示记录，不实际打款。</p>}
        {action.kind === 'deliver' && <><div className="bs-delivery-modes" role="group" aria-label="稿件交付方式"><button type="button" className={deliveryMode === 'existing' ? 'active' : ''} onClick={() => setDeliveryMode('existing')}>选择已有稿件</button><button type="button" className={deliveryMode === 'attachment' ? 'active' : ''} onClick={() => setDeliveryMode('attachment')}>上传附件</button></div>{deliveryMode === 'existing' ? <>{actionChapters.length > 0 && <label>选择稿件<select value={chapterId} onChange={event => setChapterId(event.target.value)}><option value="all">全文（全部篇章）</option>{actionChapters.map(chapter => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}</select></label>}<label>稿件正文<textarea aria-label="稿件正文" rows={7} readOnly value={deliveryText} placeholder="暂无已保存的稿件正文，请在传记修改中完成篇章，或改用上传附件" /></label></> : <label>稿件附件<input type="file" accept=".pdf,.doc,.docx,.txt,.md" onChange={event => selectAttachment(event.target.files?.[0])} /><small>{fileName ? `已选择：${fileName}` : '支持 PDF、Word、TXT、Markdown；演示附件不超过 1 MB'}</small></label>}<label>传记师留言（选填）<textarea aria-label="传记师留言" rows={3} value={deliveryNote} onChange={event => setDeliveryNote(event.target.value)} placeholder="给客户说明本次稿件的修改重点或需要核对的内容" /></label></>}
        {action.kind === 'revise' && actionChapters.length > 0 && <label>意见对应篇章<select value={chapterId} onChange={event => setChapterId(event.target.value)}>{actionChapters.map(chapter => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}</select></label>}
        {!['pay', 'accept', 'approve', 'settle', 'deliver'].includes(action.kind) && <label>{action.kind === 'revise' ? '具体修改意见' : '说明或处理意见'}<textarea aria-label="服务操作内容" rows={7} value={text} onChange={e => setText(e.target.value)} placeholder={action.kind === 'revise' ? '请写明需要补充、核对或修改的内容' : '可填写具体说明，留空使用演示内容'} /></label>}
        {action.kind === 'resolve' && actionOrder.requests.some(item => item.status === 'pending' && item.type === 'refund') && <><label>协商退款金额<input aria-label="协商退款金额" type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} /></label><p>订单实付 {money(actionOrder.amount)}，请结合已完成工作和既有结算协商处理。退款处理完成后结束该订单。</p></>}
      </div>}
    </Modal>
  </>;
}
