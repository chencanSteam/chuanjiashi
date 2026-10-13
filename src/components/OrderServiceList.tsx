import { Fragment, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Phone, RotateCcw, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Modal from './ui/Modal';
import { SERVICE_ORDER_EVENT, money, phoneUnlocked, readServiceOrders, serviceOrderVisible, serviceStatusLabels, updateServiceOrder, type ServiceAction, type ServiceOrder, type ServiceRole, type ServiceStatus } from '../data/biographerServiceOrders';
import './BiographerServiceOrders.css';
import './OrderServiceList.css';

const date = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false });
const actionLabels: Record<ServiceAction, string> = { accept: '确认接单', decline: '无法承接', cancel: '取消订单', pay: '模拟全款支付', deliver: '提交稿件', revise: '提交修改意见', approve: '确认验收通过', settle: '确认结算', help: '申请平台介入', refund: '申请退款', resolve: '确认处理完成', reject_request: '驳回申请' };
export default function OrderServiceList({ role, earningsOnly = false, detailOnly = false, selectedOrderId, onCloseDetail }: { role: ServiceRole; earningsOnly?: boolean; detailOnly?: boolean; selectedOrderId?: string | null; onCloseDetail?: () => void }) {
  const { user } = useAuth(); const { addToast } = useToast(); const navigate = useNavigate(); const [params] = useSearchParams();
  const [orders, setOrders] = useState(readServiceOrders);
  const [selectedId, setSelectedId] = useState<string | null>(() => params.get('serviceOrder'));
  const [keyword, setKeyword] = useState(''); const [status, setStatus] = useState<ServiceStatus | 'all'>('all');
  const [draftKeyword, setDraftKeyword] = useState(''); const [draftStatus, setDraftStatus] = useState<ServiceStatus | 'all'>('all');
  const [action, setAction] = useState<{ orderId: string; kind: ServiceAction; stageIndex?: number } | null>(null);
  const [page, setPage] = useState(1);
  const [text, setText] = useState(''); const [fileName, setFileName] = useState(''); const [refundAmount, setRefundAmount] = useState('');
  const phone = user?.phone || '';
  const ownOrders = orders.filter(item => serviceOrderVisible(item, role, phone));
  const visible = ownOrders.filter(item => (status === 'all' || item.status === status) && `${item.id} ${item.customerName} ${item.biographerName} ${item.service.name}`.includes(keyword.trim()));
  const pageSize = 10; const totalPages = Math.max(1, Math.ceil(visible.length / pageSize)); const current = Math.min(page, totalPages);
  const paged = visible.slice((current - 1) * pageSize, current * pageSize);
  const pageNumbers = totalPages > 7
    ? [...new Set([1, current - 1, current, current + 1, totalPages].filter(number => number >= 1 && number <= totalPages))].sort((a, b) => a - b)
    : Array.from({ length: totalPages }, (_, index) => index + 1);
  const selected = ownOrders.find(item => item.id === (selectedOrderId === undefined ? selectedId : selectedOrderId));
  const actionOrder = ownOrders.find(item => item.id === action?.orderId);
  useEffect(() => {
    const sync = () => setOrders(readServiceOrders());
    window.addEventListener('storage', sync); window.addEventListener(SERVICE_ORDER_EVENT, sync); window.addEventListener('focus', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(SERVICE_ORDER_EVENT, sync); window.removeEventListener('focus', sync); };
  }, []);
  const openAction = (order: ServiceOrder, kind: ServiceAction, stageIndex?: number) => {
    setAction({ orderId: order.id, kind, stageIndex }); setText(''); setFileName(''); setRefundAmount(String(order.amount));
  };
  const execute = () => {
    if (!action) return;
    try {
      updateServiceOrder(action.orderId, action.kind, { role, phone }, { text, fileName, stageIndex: action.stageIndex, amount: refundAmount === '' ? undefined : Number(refundAmount) });
      setAction(null); addToast(`${actionLabels[action.kind]}成功`, 'success');
    } catch (error) { addToast(error instanceof Error ? error.message : '操作失败，请重试', 'error'); }
  };
  const applyFilters = () => { setKeyword(draftKeyword); setStatus(draftStatus); setPage(1); };
  const resetFilters = () => { setDraftKeyword(''); setDraftStatus('all'); setKeyword(''); setStatus('all'); setPage(1); };
  const renderSettlements = (order: ServiceOrder) => <div className="bs-settlements"><p>订单全款 {money(order.amount)} · 平台服务费 {Math.round(order.commissionRate * 100)}%（{money(order.platformFee)}） · 传记师应得 {money(order.providerAmount)}</p><div className="bs-stage-payments">{order.stages.slice(1).map((stage, index) => <div key={stage.name}><strong>{stage.name} · {[30, 40, 30][index]}%</strong><b>{money(stage.amount)}</b><span>{stage.settledAt ? `已结算 · ${date(stage.settledAt)}` : order.status === 'refunded' ? '订单退款结束，停止结算' : stage.status === 'accepted' ? '待平台结算' : '验收通过后结算'}</span>{role === 'admin' && stage.status === 'accepted' && !stage.settledAt && order.status !== 'refunded' && <button className="btn btn-outline" disabled={order.requests.some(item => item.status === 'pending')} onClick={() => openAction(order, 'settle', index + 1)}>结算{stage.name}</button>}</div>)}</div></div>;
  return <section className={`bs-orders order-service-view${detailOnly ? ' bs-orders-detail-only' : ''}`} aria-label={earningsOnly ? '服务订单阶段结算' : '传记师服务订单'}>
    {!detailOnly && <>
    <header className="bs-head"><div><h2>{earningsOnly ? '服务订单阶段结算' : '传记师服务订单'}</h2><p>{earningsOnly ? '初稿 30% · 校审稿 40% · 终稿 30%，用户验收后由平台确认结算' : '查看服务需求、交付进度与订单记录'}</p></div>{role === 'customer' && <button className="btn btn-outline" onClick={() => navigate('/biographers')}>选择传记师</button>}</header>
    <div className="bs-filters">
      <div className="bs-search"><Search size={14} /><input aria-label="搜索服务订单" placeholder="搜索订单号、客户或套餐" value={draftKeyword} onChange={e => setDraftKeyword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') applyFilters(); }} /></div>
      <select aria-label="服务订单状态" value={draftStatus} onChange={e => setDraftStatus(e.target.value as ServiceStatus | 'all')}><option value="all">全部服务状态</option>{Object.entries(serviceStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <button className="btn btn-primary btn-sm" onClick={applyFilters}><Search size={13} /> 查询</button>
      <button className="btn btn-ghost btn-sm" onClick={resetFilters}><RotateCcw size={13} /> 重置</button>
    </div>
    {visible.length === 0 ? <p className="bs-empty">暂无符合条件的服务订单{role === 'customer' ? '，可先选择传记师提交需求。' : '。'}</p> : earningsOnly ? <div className="admin-table-wrap">
      <table className="admin-table bs-earnings-table">
        <thead><tr><th>订单号 / 下单时间</th><th>客户</th><th>服务套餐</th><th>订单全款</th><th>传记师应得</th><th>阶段结算</th><th>订单状态</th><th>操作</th></tr></thead>
        <tbody>{paged.map(order => {
          const payableStages = order.stages.slice(1);
          const settledCount = payableStages.filter(stage => !!stage.settledAt).length;
          const pendingCount = payableStages.filter(stage => stage.status === 'accepted' && !stage.settledAt).length;
          return <tr key={order.id}>
            <td><strong>{order.id}</strong><small>{date(order.createdAt)}</small></td>
            <td>{order.customerName}</td>
            <td>{order.service.name}</td>
            <td>{money(order.amount)}</td>
            <td className="bs-earnings-net">{money(order.providerAmount)}<small>平台服务费 {money(order.platformFee)}</small></td>
            <td>已结算 {settledCount}/{payableStages.length}{pendingCount > 0 && <small>待结算 {pendingCount} 阶段</small>}</td>
            <td><span className="bs-badge">{serviceStatusLabels[order.status]}</span>{order.requests.some(item => item.status === 'pending') && <small>平台处理中</small>}</td>
            <td><button className="admin-table-link" onClick={() => setSelectedId(order.id)}>查看详情</button></td>
          </tr>;
        })}</tbody>
      </table>
    </div> : <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>订单号</th><th>下单时间</th>{role !== 'biographer' && <th>传记师</th>}<th>服务套餐</th>{role !== 'customer' && <th>客户</th>}<th>金额</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>{paged.map(order => <tr key={order.id}>
          <td>{order.id}</td>
          <td>{date(order.createdAt)}</td>
          {role !== 'biographer' && <td>{order.biographerName}</td>}
          <td>{order.service.name}</td>
          {role !== 'customer' && <td>{order.customerName}</td>}
          <td>{money(order.amount)}</td>
          <td><span className="bs-badge">{serviceStatusLabels[order.status]}{order.requests.some(item => item.status === 'pending') ? ' · 平台处理中' : ''}</span>{order.paidAt && <div className="admin-table-muted">{order.stages.filter(item => item.status === 'accepted').length}/4 个交付阶段已确认</div>}</td>
          <td><button className="admin-table-link" onClick={() => setSelectedId(order.id)}>查看详情</button></td>
        </tr>)}</tbody>
      </table>
    </div>}
    {visible.length > 0 && <div className="bs-pagination">
      <span className="bs-pagination-total">共 {visible.length} 条</span>
      <div className="bs-pagination-pages">
        <button className="bs-page-btn" disabled={current === 1} onClick={() => setPage(current - 1)}>上一页</button>
        {pageNumbers.map((number, index) => <Fragment key={number}>{index > 0 && number - pageNumbers[index - 1] > 1 && <span className="bs-page-gap">…</span>}<button className={`bs-page-btn${current === number ? ' active' : ''}`} onClick={() => setPage(number)}>{number}</button></Fragment>)}
        <button className="bs-page-btn" disabled={current === totalPages} onClick={() => setPage(current + 1)}>下一页</button>
      </div>
    </div>}
    </>}
    <Modal open={!!selected} title="传记师服务订单详情" onClose={() => selectedOrderId === undefined ? setSelectedId(null) : onCloseDetail?.()} className="bs-detail-modal">
      {selected && <div className="bs-detail">
        <div className="bs-row"><strong>{selected.id}</strong><span className="bs-badge">{serviceStatusLabels[selected.status]}</span></div>
        <h3>{selected.biographerName} · {selected.service.name}</h3>
        <section className="bs-section"><h4>服务确认单</h4><p>{selected.service.description}</p><dl className="bs-info">{[['订单全款', money(selected.amount)], ['采访次数', selected.service.interviewCount], ['交付字数', selected.service.wordCount], ['交付周期', selected.service.deliveryPeriod ? `${selected.service.deliveryPeriod}（付款后起算）` : '付款前按套餐确认'], ['修改轮次', selected.service.revisionCount], ['实体书 / 排版', selected.service.physicalBook], ['采访对象', selected.requirements.interviewee], ['与采访对象关系', selected.requirements.relation], ['需求说明', selected.requirements.remark], ['方便联系时间', selected.requirements.preferredTime], ['访谈方式或地点', selected.requirements.location]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '待补充'}</dd></div>)}</dl></section>
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
            {latest ? <><p className="bs-muted">第 {stage.versions.length} 版 · {date(latest.at)}{latest.fileName ? ` · 附件：${latest.fileName}` : ''}</p><pre>{latest.content}</pre>{stage.versions.length > 1 && <details><summary>查看历史版本</summary>{stage.versions.slice(0, -1).map((version, number) => <div key={number}><p>第 {number + 1} 版 · {date(version.at)}</p><pre>{version.content}</pre></div>)}</details>}</> : <p className="bs-muted">{index === 0 ? '电话约定访谈后，传记师提交访谈安排及写作大纲。' : '前一阶段验收通过后，提交本阶段稿件。'}</p>}
            {stage.feedback.map((feedback, number) => <div className="bs-feedback" key={number}><strong>客户修改意见 {number + 1} · {stage.status === 'revision' && number === stage.feedback.length - 1 ? '待处理' : '已重提稿件'}</strong><p>{feedback.text}</p><small>{date(feedback.at)}</small></div>)}
            <div className="bs-actions">{role === 'biographer' && enabled && ['waiting', 'revision'].includes(stage.status) && <button className="btn btn-primary" onClick={() => openAction(selected, 'deliver', index)}>提交{stage.name}</button>}{role === 'customer' && enabled && stage.status === 'review' && <><button className="btn btn-primary" onClick={() => openAction(selected, 'approve', index)}>验收通过{stage.name}</button><button className="btn btn-outline" onClick={() => openAction(selected, 'revise', index)}>提出修改意见</button></>}</div>
          </article>;
        })}</section>{role !== 'customer' && <section className="bs-section"><h4>阶段结算</h4>{renderSettlements(selected)}</section>}</>}
        <details className="bs-section"><summary>订单处理记录</summary>{[...selected.history].reverse().map((item, index) => <p key={index}><small>{date(item.at)}</small><br />{item.text.replace('（尚未付款）', '')}</p>)}</details>
      </div>}
    </Modal>
    <Modal open={!!action && !!actionOrder} title={action ? actionLabels[action.kind] : ''} onClose={() => setAction(null)} footer={<><button className="btn btn-outline" onClick={() => setAction(null)}>返回</button><button className="btn btn-primary" onClick={execute}>{action ? (actionLabels[action.kind].startsWith('确认') ? actionLabels[action.kind] : `确认${actionLabels[action.kind]}`) : '确认'}</button></>}>
      {action && actionOrder && <div className="bs-action-form">
        {action.kind === 'pay' && <><h3>全款 {money(actionOrder.amount)}</h3><p>请确认订单金额与服务内容。本次为模拟支付，不会实际扣款。</p></>}
        {action.kind === 'accept' && <p>确认可按订单约定的套餐、价格、交付周期与修改轮次承接服务。</p>}
        {action.kind === 'approve' && <p>确认{actionOrder.stages[action.stageIndex ?? 0].name}符合约定。{(action.stageIndex ?? 0) > 0 ? '验收通过后将生成该阶段待结算记录。' : '确认后传记师可开始初稿创作。'}</p>}
        {action.kind === 'settle' && <p>将本阶段 {money(actionOrder.stages[action.stageIndex ?? 0].amount)} 标记为已结算，仅演示记录，不实际打款。</p>}
        {!['pay', 'accept', 'approve', 'settle'].includes(action.kind) && <label>{action.kind === 'deliver' ? '稿件正文 / 访谈安排与大纲' : '说明或处理意见'}<textarea aria-label="服务操作内容" rows={7} value={text} onChange={e => setText(e.target.value)} placeholder={action.kind === 'deliver' ? '输入或粘贴正文，留空可提交示例内容演示' : '可填写具体说明，留空使用演示内容'} /></label>}
        {action.kind === 'deliver' && <label>稿件附件（演示记录文件名）<input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e => setFileName(e.target.files?.[0]?.name || '')} /><small>{fileName || '可直接粘贴正文完成交付演示'}</small></label>}
        {action.kind === 'resolve' && actionOrder.requests.some(item => item.status === 'pending' && item.type === 'refund') && <><label>协商退款金额<input aria-label="协商退款金额" type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} /></label><p>订单实付 {money(actionOrder.amount)}，请结合已完成工作和既有结算协商处理。退款处理完成后结束该订单。</p></>}
      </div>}
    </Modal>
  </section>;
}
