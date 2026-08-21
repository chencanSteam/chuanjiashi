import { useEffect, useState } from 'react';
import { Building2, ShieldCheck, Bell, Save, Check, X as XIcon, Plus, Edit2, Trash2, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { refundReasonApi } from '../api/refundReason';
import type { RefundReasonOption } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './AdminSettings.css';

const INFO_KEY = 'admin_platform_info';
const NOTIFY_KEY = 'admin_notify_config';

interface PlatformInfo {
  platformName: string;
  servicePhone: string;
  icp: string;
  contactEmail: string;
  companyName: string;
  address: string;
}

interface NotifyConfig {
  smsOrder: boolean;
  smsAudit: boolean;
  smsFinance: boolean;
  inappOrder: boolean;
  inappAudit: boolean;
  inappSystem: boolean;
}

const defaultInfo: PlatformInfo = {
  platformName: '传家世 AI 数字人生与家风传承平台',
  servicePhone: '400-000-0000',
  icp: '浙ICP备00000000号-1',
  contactEmail: 'service@chuanjiashi.cn',
  companyName: '传家世科技有限公司',
  address: '浙江省杭州市西湖区',
};

const defaultNotify: NotifyConfig = {
  smsOrder: true,
  smsAudit: true,
  smsFinance: false,
  inappOrder: true,
  inappAudit: true,
  inappSystem: true,
};

const roleMatrix: { role: string; perms: { label: string; granted: boolean }[] }[] = [
  {
    role: '超级管理员',
    perms: [
      { label: '用户与档案管理', granted: true },
      { label: '内容审核', granted: true },
      { label: '产品与订单管理', granted: true },
      { label: '财务与分润', granted: true },
      { label: '系统设置', granted: true },
    ],
  },
  {
    role: '运营',
    perms: [
      { label: '用户与档案管理', granted: true },
      { label: '内容审核', granted: false },
      { label: '产品与订单管理', granted: true },
      { label: '财务与分润', granted: false },
      { label: '系统设置', granted: false },
    ],
  },
  {
    role: '审核',
    perms: [
      { label: '用户与档案管理', granted: false },
      { label: '内容审核', granted: true },
      { label: '产品与订单管理', granted: false },
      { label: '财务与分润', granted: false },
      { label: '系统设置', granted: false },
    ],
  },
  {
    role: '财务',
    perms: [
      { label: '用户与档案管理', granted: false },
      { label: '内容审核', granted: false },
      { label: '产品与订单管理', granted: false },
      { label: '财务与分润', granted: true },
      { label: '系统设置', granted: false },
    ],
  },
];

const notifyGroups: { title: string; items: { key: keyof NotifyConfig; label: string; desc: string }[] }[] = [
  {
    title: '短信通知',
    items: [
      { key: 'smsOrder', label: '订单通知', desc: '新订单、退款申请时短信提醒运营' },
      { key: 'smsAudit', label: '审核通知', desc: '有待审核内容时短信提醒审核人员' },
      { key: 'smsFinance', label: '财务通知', desc: '提现申请、对账异常时短信提醒财务' },
    ],
  },
  {
    title: '站内信通知',
    items: [
      { key: 'inappOrder', label: '订单通知', desc: '向用户推送订单状态变更站内信' },
      { key: 'inappAudit', label: '审核结果通知', desc: '向用户推送内容审核结果站内信' },
      { key: 'inappSystem', label: '系统公告', desc: '向全站用户推送系统维护与活动公告' },
    ],
  },
];

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...fallback, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return fallback;
}

export default function AdminSettings() {
  const { addToast } = useToast();
  const [info, setInfo] = useState<PlatformInfo>(() => loadJSON(INFO_KEY, defaultInfo));
  const [notify, setNotify] = useState<NotifyConfig>(() => loadJSON(NOTIFY_KEY, defaultNotify));
  const [refundReasons, setRefundReasons] = useState<RefundReasonOption[]>([]);
  const [refundReasonModal, setRefundReasonModal] = useState(false);
  const [editingRefundReason, setEditingRefundReason] = useState<RefundReasonOption | null>(null);
  const [refundReasonLabel, setRefundReasonLabel] = useState('');
  const [refundReasonSubmitting, setRefundReasonSubmitting] = useState(false);

  const loadRefundReasons = () => {
    refundReasonApi.adminList().then(setRefundReasons).catch(() => setRefundReasons([]));
  };

  useEffect(() => {
    loadRefundReasons();
  }, []);

  const openRefundReasonCreate = () => {
    setEditingRefundReason(null);
    setRefundReasonLabel('');
    setRefundReasonModal(true);
  };

  const openRefundReasonEdit = (reason: RefundReasonOption) => {
    if (reason.isOther) return;
    setEditingRefundReason(reason);
    setRefundReasonLabel(reason.label);
    setRefundReasonModal(true);
  };

  const closeRefundReasonModal = () => {
    setRefundReasonModal(false);
    setEditingRefundReason(null);
    setRefundReasonLabel('');
  };

  const saveRefundReason = async () => {
    if (!refundReasonLabel.trim()) {
      addToast('请填写退款原因', 'error');
      return;
    }
    try {
      setRefundReasonSubmitting(true);
      if (editingRefundReason) await refundReasonApi.update(editingRefundReason.id, refundReasonLabel);
      else await refundReasonApi.create(refundReasonLabel);
      addToast(editingRefundReason ? '退款原因已更新' : '退款原因已新增', 'success');
      closeRefundReasonModal();
      loadRefundReasons();
    } catch (err: any) {
      addToast(err.message || '保存失败', 'error');
    } finally {
      setRefundReasonSubmitting(false);
    }
  };

  const toggleRefundReason = async (reason: RefundReasonOption) => {
    if (reason.isOther) return;
    try {
      await refundReasonApi.updateStatus(reason.id, !reason.enabled);
      loadRefundReasons();
    } catch (err: any) {
      addToast(err.message || '状态更新失败', 'error');
    }
  };

  const deleteRefundReason = async (reason: RefundReasonOption) => {
    if (reason.isOther || !window.confirm(`确定删除退款原因“${reason.label}”吗？`)) return;
    try {
      await refundReasonApi.remove(reason.id);
      addToast('退款原因已删除', 'success');
      loadRefundReasons();
    } catch (err: any) {
      addToast(err.message || '删除失败', 'error');
    }
  };

  const moveRefundReason = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= refundReasons.length) return;
    const ids = refundReasons.map((reason) => reason.id);
    [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];
    try {
      await refundReasonApi.reorder(ids);
      loadRefundReasons();
    } catch (err: any) {
      addToast(err.message || '排序失败', 'error');
    }
  };

  const handleSaveInfo = () => {
    if (!info.platformName.trim()) {
      addToast('请填写平台名称', 'error');
      return;
    }
    localStorage.setItem(INFO_KEY, JSON.stringify(info));
    addToast('平台基础信息已保存', 'success');
  };

  const toggleNotify = (key: keyof NotifyConfig) => {
    const next = { ...notify, [key]: !notify[key] };
    setNotify(next);
    localStorage.setItem(NOTIFY_KEY, JSON.stringify(next));
    addToast('通知配置已更新', 'success');
  };

  return (
    <div className="admin-settings-page">
      <header className="page-header">
        <h1 className="page-title">系统设置</h1>
      </header>

      <Annotate id="admin-settings.platform-info">
      <div className="card admin-settings-section">
        <div className="card-header">
          <h3 className="card-title"><Building2 size={16} /> 平台基础信息</h3>
        </div>
        <div className="card-body admin-settings-form">
          <div className="form-row">
            <label>平台名称</label>
            <input type="text" value={info.platformName} onChange={(e) => setInfo((prev) => ({ ...prev, platformName: e.target.value }))} />
          </div>
          <div className="form-row">
            <label>客服电话</label>
            <input type="text" value={info.servicePhone} onChange={(e) => setInfo((prev) => ({ ...prev, servicePhone: e.target.value }))} />
          </div>
          <div className="form-row">
            <label>备案号</label>
            <input type="text" value={info.icp} onChange={(e) => setInfo((prev) => ({ ...prev, icp: e.target.value }))} />
          </div>
          <div className="form-row">
            <label>联系邮箱</label>
            <input type="text" value={info.contactEmail} onChange={(e) => setInfo((prev) => ({ ...prev, contactEmail: e.target.value }))} />
          </div>
          <div className="form-row">
            <label>公司名称</label>
            <input type="text" value={info.companyName} onChange={(e) => setInfo((prev) => ({ ...prev, companyName: e.target.value }))} />
          </div>
          <div className="form-row">
            <label>公司地址</label>
            <input type="text" value={info.address} onChange={(e) => setInfo((prev) => ({ ...prev, address: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={handleSaveInfo}>
            <Save size={14} /> 保存信息
          </button>
        </div>
      </div>
      </Annotate>

      <div className="card admin-settings-section">
        <div className="card-header admin-refund-reasons-header">
          <div>
            <h3 className="card-title"><RotateCcw size={16} /> 退款原因配置</h3>
            <p className="admin-refund-reasons-desc">客户申请退款时将从启用的原因中单选， “其他”始终保留。</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openRefundReasonCreate}><Plus size={14} /> 新增原因</button>
        </div>
        <div className="card-body admin-settings-body">
          <div className="admin-refund-reasons-list">
            {refundReasons.map((reason, index) => (
              <div className="admin-refund-reason-row" key={reason.id}>
                <span className="admin-refund-reason-order">{index + 1}</span>
                <div className="admin-refund-reason-info">
                  <span className="admin-refund-reason-label">{reason.label}</span>
                  {reason.isOther && <span className="admin-refund-reason-system">系统选项</span>}
                </div>
                <span className={`admin-refund-reason-status ${reason.enabled ? 'enabled' : 'disabled'}`}>{reason.enabled ? '已启用' : '已停用'}</span>
                <div className="admin-refund-reason-actions">
                  <button className="admin-icon-btn" title="上移" disabled={index === 0} onClick={() => moveRefundReason(index, -1)}><ChevronUp size={15} /></button>
                  <button className="admin-icon-btn" title="下移" disabled={index === refundReasons.length - 1} onClick={() => moveRefundReason(index, 1)}><ChevronDown size={15} /></button>
                  {!reason.isOther && <>
                    <button className="admin-icon-btn" title="编辑" onClick={() => openRefundReasonEdit(reason)}><Edit2 size={14} /></button>
                    <button className="admin-icon-btn danger" title="删除" onClick={() => deleteRefundReason(reason)}><Trash2 size={14} /></button>
                    <button className={`admin-refund-toggle ${reason.enabled ? 'on' : ''}`} onClick={() => toggleRefundReason(reason)}>{reason.enabled ? '停用' : '启用'}</button>
                  </>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Annotate id="admin-settings.role-matrix">
      <div className="card admin-settings-section">
        <div className="card-header">
          <h3 className="card-title"><ShieldCheck size={16} /> 后台角色权限</h3>
        </div>
        <div className="card-body admin-settings-body">
          <div className="admin-settings-table">
            <div className="admin-settings-row admin-settings-header-row">
              <div className="admin-settings-cell">角色</div>
              {roleMatrix[0].perms.map((p) => (
                <div className="admin-settings-cell" key={p.label}>{p.label}</div>
              ))}
            </div>
            {roleMatrix.map((r) => (
              <div className="admin-settings-row" key={r.role}>
                <div className="admin-settings-cell admin-settings-role">{r.role}</div>
                {r.perms.map((p) => (
                  <div className="admin-settings-cell" key={p.label}>
                    {p.granted ? (
                      <Check size={16} color="#1B5E4B" />
                    ) : (
                      <XIcon size={16} color="#d1d5db" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      </Annotate>

      <Annotate id="admin-settings.notify-config">
      <div className="card admin-settings-section">
        <div className="card-header">
          <h3 className="card-title"><Bell size={16} /> 消息通知配置</h3>
        </div>
        <div className="card-body admin-settings-body">
          {notifyGroups.map((group) => (
            <div className="admin-notify-group" key={group.title}>
              <div className="admin-notify-group-title">{group.title}</div>
              {group.items.map((item) => (
                <div className="admin-notify-item" key={item.key}>
                  <div className="admin-notify-info">
                    <div className="admin-notify-label">{item.label}</div>
                    <div className="admin-notify-desc">{item.desc}</div>
                  </div>
                  <label className="admin-notify-switch">
                    <input type="checkbox" checked={notify[item.key]} onChange={() => toggleNotify(item.key)} />
                    <span>{notify[item.key] ? '已开启' : '已关闭'}</span>
                  </label>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      </Annotate>

      {refundReasonModal && (
        <div className="modal-overlay" onClick={closeRefundReasonModal}>
          <div className="modal-content admin-refund-reason-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{editingRefundReason ? '编辑退款原因' : '新增退款原因'}</h4>
              <button className="modal-close" onClick={closeRefundReasonModal}><XIcon size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label htmlFor="admin-refund-reason-label">原因名称</label>
                <input id="admin-refund-reason-label" type="text" maxLength={50} value={refundReasonLabel} onChange={(e) => setRefundReasonLabel(e.target.value)} placeholder="如：商品与描述不符" />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={refundReasonSubmitting} onClick={saveRefundReason}>
                {refundReasonSubmitting ? '保存中…' : editingRefundReason ? '保存修改' : '确认新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
