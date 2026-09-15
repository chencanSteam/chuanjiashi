import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Search, X } from 'lucide-react';
import { biographerApi } from '../api/biographer';
import { useToast } from '../hooks/useToast';
import type { BiographerOrder as MockBiographerOrder } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import { loadBiographerVersions } from '../utils/biographerVersions';
import './BiographerOrders.css';

type DisplayStatus = 'draft' | 'final' | 'completed';
type TimeFilter = 'all' | 'overdue' | '7d' | '30d';

const displayStatusMap: Record<DisplayStatus, { label: string; color: string }> = {
  draft: { label: '待交初稿', color: '#d97706' },
  final: { label: '待交终稿', color: '#2563eb' },
  completed: { label: '已完成', color: '#1B5E4B' },
};

const statusGroupMap: Record<MockBiographerOrder['status'], DisplayStatus> = {
  pending_schedule: 'draft',
  interview_scheduled: 'draft',
  draft_submitted: 'final',
  modifying: 'final',
  final_submitted: 'final',
  completed: 'completed',
  after_sales: 'final',
};

const statusOptions: Array<{ value: DisplayStatus; label: string }> = [
  { value: 'draft', label: '待交初稿' },
  { value: 'final', label: '待交终稿' },
  { value: 'completed', label: '已完成' },
];

const timeFilterOptions: Array<{ value: TimeFilter; label: string }> = [
  { value: 'all', label: '全部时间' },
  { value: 'overdue', label: '已逾期' },
  { value: '7d', label: '未来 7 天' },
  { value: '30d', label: '未来 30 天' },
];

const fallbackSavedVersions = [
  { id: 'mock-v3', label: '版本 3 · 2026/09/10 15:20', note: '已完成全部章节修改' },
  { id: 'mock-v2', label: '版本 2 · 2026/09/09 18:05', note: '完成家庭与事业章节' },
  { id: 'mock-v1', label: '版本 1 · 2026/09/08 11:30', note: '初稿保存' },
];

function getDeadlineInfo(deadline?: string, completed = false): { date: string; label: string; className: string } {
  if (!deadline) return { date: '待安排', label: '待安排', className: 'unset' };
  const target = new Date(deadline);
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.ceil((target.getTime() - Date.now()) / dayMs);
  const date = `${target.getMonth() + 1}月${target.getDate()}日`;
  if (completed) return { date, label: '已完成', className: 'done' };
  if (days < 0) return { date, label: `已逾期 ${Math.abs(days)} 天`, className: 'overdue' };
  if (days <= 3) return { date, label: `还剩 ${days} 天`, className: 'urgent' };
  return { date, label: `还剩 ${days} 天`, className: 'normal' };
}

function getNextAction(order: MockBiographerOrder): { node: string; label: string } | null {
  // 采访由传记师与客户线下自行约定，订单页不提供预约采访操作。
  const pending = order.progress.find((p) => p.status === 'pending' && p.node !== '预约采访');
  if (!pending) return null;
  const labelMap: Record<string, string> = {
    '提交初稿': '提交初稿',
    '修改完善': '提交过程稿',
    '交付定稿': '提交终稿',
  };
  return { node: pending.node, label: labelMap[pending.node] };
}

export default function BiographerOrders() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState<MockBiographerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOrder, setDetailOrder] = useState<MockBiographerOrder | null>(null);
  const [confirmActionState, setConfirmActionState] = useState<{ order: MockBiographerOrder; next: { node: string; label: string } } | null>(null);
  const [submitSource, setSubmitSource] = useState<'saved' | 'upload'>('saved');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  // 搜索/筛选：输入框为草稿值，点「查询」或回车后才生效
  const [keywordInput, setKeywordInput] = useState('');
  const [statusInput, setStatusInput] = useState<DisplayStatus | 'all'>('all');
  const [timeInput, setTimeInput] = useState<TimeFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const applyFilters = () => {
    setKeyword(keywordInput.trim());
    setStatusFilter(statusInput);
    setTimeFilter(timeInput);
  };

  const resetFilters = () => {
    setKeywordInput('');
    setStatusInput('all');
    setTimeInput('all');
    setKeyword('');
    setStatusFilter('all');
    setTimeFilter('all');
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setLoading(true);
    biographerApi
      .myOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  const handleAction = (order: MockBiographerOrder) => {
    const next = getNextAction(order);
    if (!next) return;
    // 其余操作先弹确认框，避免误触
    const saved = loadBiographerVersions(order.id);
    setSubmitSource('saved');
    setSelectedVersionId(saved[0]?.id || fallbackSavedVersions[0].id);
    setSubmitFile(null);
    setConfirmActionState({ order, next });
  };

  const executeAction = async () => {
    if (!confirmActionState) return;
    if (submitSource === 'upload' && !submitFile) return;
    try {
      setProcessing(true);
      await biographerApi.updateProgress(confirmActionState.order.id, confirmActionState.next.node);
      const sourceLabel = submitSource === 'saved'
        ? '保存版本'
        : `文件「${submitFile?.name || '未命名文件'}」`;
      setConfirmActionState(null);
      addToast(`${confirmActionState.next.label}已提交（${sourceLabel}）`, 'success');
      loadOrders();
    } finally {
      setProcessing(false);
    }
  };

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const searchable = `${order.id} ${order.orderId || ''} ${order.customerName || order.userId} ${order.serviceName}`.toLowerCase();
    if (keyword && !searchable.includes(keyword.toLowerCase())) return false;
    if (statusFilter !== 'all' && statusGroupMap[order.status] !== statusFilter) return false;
    if (timeFilter !== 'all') {
      const deadline = order.deadline ? new Date(order.deadline).getTime() : null;
      if (!deadline) return false;
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      if (timeFilter === 'overdue' && deadline >= now) return false;
      if (timeFilter === '7d' && (deadline < now || deadline > now + 7 * dayMs)) return false;
      if (timeFilter === '30d' && (deadline < now || deadline > now + 30 * dayMs)) return false;
    }
    return true;
  }), [orders, keyword, statusFilter, timeFilter]);

  if (loading) {
    return (
      <div className="biographer-orders-page">
        <header className="page-header"><h1 className="page-title">我的订单</h1></header>
        <div className="card"><div className="card-body">加载中...</div></div>
      </div>
    );
  }

  return (
    <div className="biographer-orders-page">
      <header className="page-header"><h1 className="page-title">我的订单</h1></header>

      <div className="card">
        <div className="card-header partner-center-list-header">
          <h3 className="card-title"><ClipboardList size={16} /> 传记订单</h3>
        </div>
        <div className="card-body partner-center-list-body">
          <div className="biographer-orders-filters">
            <div className="biographer-orders-search">
              <Search size={15} />
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') applyFilters(); }}
                placeholder="搜索订单号、客户或服务"
              />
            </div>
            <select value={statusInput} onChange={(event) => setStatusInput(event.target.value as DisplayStatus | 'all')}>
              <option value="all">全部状态</option>
              {statusOptions.map((item) => (
                <option value={item.value} key={item.value}>{item.label}</option>
              ))}
            </select>
            <select value={timeInput} onChange={(event) => setTimeInput(event.target.value as TimeFilter)}>
              {timeFilterOptions.map((item) => (
                <option value={item.value} key={item.value}>{item.label}</option>
              ))}
            </select>
            <button type="button" className="btn btn-primary btn-sm" onClick={applyFilters}>查询</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={resetFilters}>重置</button>
          </div>
          {filteredOrders.length === 0 ? (
            <div className="admin-table-empty">暂无符合条件的订单</div>
          ) : (
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>服务</th>
                  <th>客户</th>
                  <th>订单号</th>
                  <th>金额</th>
                  <th>交付截止</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
              {filteredOrders.map((o) => {
                const nextAction = getNextAction(o);
                return (
                  <tr key={o.id}>
                    <td className="admin-table-text-left">{o.serviceName}</td>
                    <td>{o.customerName || o.userId}</td>
                    <td>{o.orderId || o.id.slice(-8)}</td>
                    <td>¥{o.amount.toLocaleString()}</td>
                    <td>
                      {(() => {
                        const deadline = getDeadlineInfo(o.deadline, statusGroupMap[o.status] === 'completed');
                        return (
                          <div className={`bio-order-deadline ${deadline.className}`}>
                            <strong>{deadline.date}</strong>
                            <small>{deadline.label}</small>
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      <Annotate id="biographer-orders.order-status" inline>
                      <span style={{ color: displayStatusMap[statusGroupMap[o.status]].color, fontWeight: 600 }}>{displayStatusMap[statusGroupMap[o.status]].label}</span>
                      </Annotate>
                    </td>
                    <td>
                      <button className="admin-table-link" onClick={() => setDetailOrder(o)}>详情</button>
                      {nextAction ? (
                        <Annotate id="biographer-orders.next-action" inline>
                        <button
                          className="admin-table-link"
                          disabled={processing}
                          onClick={() => handleAction(o)}
                        >
                          {nextAction.label}
                        </button>
                        </Annotate>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {detailOrder && (
        <div className="modal-overlay" onClick={() => setDetailOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>订单详情 - {detailOrder.orderId || detailOrder.id}</h4>
              <button className="modal-close" onClick={() => setDetailOrder(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="bio-order-detail-grid">
                <div className="bio-order-detail-row"><span>服务</span><strong>{detailOrder.serviceName}</strong></div>
                <div className="bio-order-detail-row"><span>客户</span><strong>{detailOrder.customerName || detailOrder.userId}</strong></div>
                <div className="bio-order-detail-row"><span>订单金额</span><strong>¥{detailOrder.amount.toLocaleString()}</strong></div>
                <div className="bio-order-detail-row">
                  <span>订单状态</span>
                  <strong style={{ color: displayStatusMap[statusGroupMap[detailOrder.status]].color }}>{displayStatusMap[statusGroupMap[detailOrder.status]].label}</strong>
                </div>
                <div className="bio-order-detail-row"><span>截止时间</span><strong>{detailOrder.deadline ? new Date(detailOrder.deadline).toLocaleString() : '待安排'}</strong></div>
                <div className="bio-order-detail-row"><span>创建时间</span><strong>{new Date(detailOrder.createdAt).toLocaleString()}</strong></div>
                {detailOrder.remark && (
                  <div className="bio-order-detail-row bio-order-detail-full"><span>客户备注</span><strong>{detailOrder.remark}</strong></div>
                )}
              </div>
              <div className="bio-order-detail-progress-title">服务进度</div>
              <div className="bio-order-detail-progress">
                {detailOrder.progress.filter((p) => p.node !== '预约采访').map((p) => (
                  <div className={`bio-order-detail-node ${p.status === 'done' ? 'done' : ''}`} key={p.node}>
                    <span className="bio-order-detail-node-name">{p.node}</span>
                    <span className="bio-order-detail-node-time">{p.status === 'done' ? (p.time ? new Date(p.time).toLocaleString() : '已完成') : '待处理'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmActionState && (
        <div className="modal-overlay" onClick={() => setConfirmActionState(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{confirmActionState.next.label}</h4>
              <button className="modal-close" onClick={() => setConfirmActionState(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.8 }}>
                订单「{confirmActionState.order.serviceName}」（客户：{confirmActionState.order.customerName || confirmActionState.order.userId}）当前进度节点为「{confirmActionState.next.node}」，确认执行「{confirmActionState.next.label}」吗？
              </p>
              <div className="biographer-submit-source">
                <div className="biographer-submit-source-title">提交稿件来源</div>
                <div className="biographer-submit-source-options">
                  <button
                    type="button"
                    className={`biographer-submit-source-option ${submitSource === 'saved' ? 'selected' : ''}`}
                    onClick={() => setSubmitSource('saved')}
                  >
                    <strong>选择保存版本</strong>
                    <span>使用“传记修改”里已保存的稿件版本</span>
                  </button>
                  <button
                    type="button"
                    className={`biographer-submit-source-option ${submitSource === 'upload' ? 'selected' : ''}`}
                    onClick={() => setSubmitSource('upload')}
                  >
                    <strong>上传文件</strong>
                    <span>支持 Word、PDF 或 TXT 文件</span>
                  </button>
                </div>
                {submitSource === 'saved' ? (
                  <div className="biographer-submit-version">
                    <label htmlFor="submit-version">保存版本</label>
                    <select
                      id="submit-version"
                      value={selectedVersionId}
                      onChange={(event) => setSelectedVersionId(event.target.value)}
                    >
                      {(() => {
                        const versions = loadBiographerVersions(confirmActionState.order.id);
                        const options = versions.length > 0
                          ? versions.map((version) => ({ id: version.id, label: `${version.label} · ${version.chapterCount} 章`, note: `${version.wordCount} 字` }))
                          : fallbackSavedVersions;
                        return options.map((version) => (
                          <option value={version.id} key={version.id}>{version.label}（{version.note}）</option>
                        ));
                      })()}
                    </select>
                  </div>
                ) : (
                  <label className="biographer-submit-file">
                    <span>{submitFile ? `已选择：${submitFile.name}` : '点击选择要提交的稿件文件'}</span>
                    <input type="file" accept=".doc,.docx,.pdf,.txt" onChange={(event) => setSubmitFile(event.target.files?.[0] || null)} />
                  </label>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button className="btn btn-outline" onClick={() => setConfirmActionState(null)}>取消</button>
                <button className="btn btn-primary" disabled={processing || (submitSource === 'upload' && !submitFile)} onClick={executeAction}>{processing ? '提交中…' : '确认提交'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
