import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  UserCheck,
  X,
  Ban,
  CheckCircle,
  Phone,
  Share2,
  Wallet,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { adminUserApi, type AdminUserDetail } from '../api/adminUser';
import type { AdminUser, CommissionRecord, OrderType } from '../mocks/types';
import './UserManagement.css';

const REALNAME_STATUS_LABELS: Record<AdminUser['realNameStatus'], string> = {
  none: '未认证',
  pending: '认证中',
  verified: '已实名',
  rejected: '认证失败',
};

const COMMISSION_STATUS_LABELS: Record<CommissionRecord['status'], string> = {
  pending: '待结算',
  settled: '已结算',
  frozen: '冻结中',
  deducted: '已扣除',
};

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  biography: 'AI 传记',
  digital_person: '数字人',
  video: '短视频',
  qrcode: '二维码',
  book: '实体书',
  biographer_service: '传记师服务',
  group_buy: '拼团',
  derivative: '衍生品',
};

export default function UserManagement() {
  const { addToast } = useToast();

  return (
    <div className="user-management-page">
      <header className="page-header">
        <h1 className="page-title">用户管理</h1>
      </header>

      <UserListTab addToast={addToast} />
    </div>
  );
}

type AddToast = (message: string, type?: 'success' | 'error' | 'info') => void;

function UserListTab({ addToast }: { addToast: AddToast }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminUser['status'] | 'all'>('all');
  const [realnameFilter, setRealnameFilter] = useState<AdminUser['realNameStatus'] | 'all'>('all');
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);

  const load = useCallback(() => {
    adminUserApi
      .list({ keyword: keyword || undefined, status: statusFilter })
      .then((list) => setUsers(realnameFilter === 'all' ? list : list.filter((u) => u.realNameStatus === realnameFilter)))
      .catch(() => setUsers([]));
  }, [keyword, statusFilter, realnameFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const openDetail = (id: string) => {
    adminUserApi
      .get(id)
      .then(setDetail)
      .catch((err) => addToast(err.message || '加载用户详情失败', 'error'));
  };

  const handleToggleStatus = async () => {
    if (!confirmUser) return;
    const next: AdminUser['status'] = confirmUser.status === 'active' ? 'disabled' : 'active';
    try {
      await adminUserApi.updateStatus(confirmUser.id, next);
      addToast(next === 'disabled' ? '用户已禁用' : '用户已启用', 'success');
      setConfirmUser(null);
      load();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  return (
    <>
      <div className="card um-list-card">
        <div className="card-header um-list-header">
          <div className="um-filters">
            <div className="um-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="搜索昵称、手机号…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AdminUser['status'] | 'all')}
            >
              <option value="all">全部状态</option>
              <option value="active">正常</option>
              <option value="disabled">已禁用</option>
            </select>
            <select
              value={realnameFilter}
              onChange={(e) => setRealnameFilter(e.target.value as AdminUser['realNameStatus'] | 'all')}
            >
              <option value="all">全部实名状态</option>
              <option value="pending">认证中</option>
              <option value="verified">已实名</option>
              <option value="rejected">认证失败</option>
              <option value="none">未认证</option>
            </select>
          </div>
        </div>
        <div className="card-body um-list-body">
          {users.length === 0 ? (
            <div className="um-empty">暂无符合条件的用户</div>
          ) : (
            <div className="um-table">
              <div className="um-row um-header">
                <div className="um-cell">昵称</div>
                <div className="um-cell">手机号</div>
                <div className="um-cell">注册时间</div>
                <div className="um-cell">实名状态</div>
                <div className="um-cell">状态</div>
                <div className="um-cell">操作</div>
              </div>
              {users.map((u) => (
                <div className="um-row um-row-clickable" key={u.id} onClick={() => openDetail(u.id)}>
                  <div className="um-cell um-cell-name">用户{u.phone.slice(-4)}</div>
                  <div className="um-cell">{u.phone}</div>
                  <div className="um-cell">{new Date(u.registeredAt).toLocaleDateString()}</div>
                  <div className="um-cell">
                    <span className={`um-status realname-${u.realNameStatus}`}>
                      {REALNAME_STATUS_LABELS[u.realNameStatus]}
                    </span>
                  </div>
                  <div className="um-cell">
                    <span className={`um-status ${u.status}`}>{u.status === 'active' ? '正常' : '已禁用'}</span>
                  </div>
                  <div className="um-cell">
                    <button
                      className={`btn ${u.status === 'active' ? 'um-btn-danger' : 'btn-primary'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmUser(u);
                      }}
                    >
                      {u.status === 'active' ? <Ban size={12} /> : <CheckCircle size={12} />}
                      {u.status === 'active' ? ' 禁用' : ' 启用'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {detail && (
        <div className="um-drawer-overlay" onClick={() => setDetail(null)}>
          <div className="um-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="um-drawer-header">
              <h4>用户详情</h4>
              <button className="modal-close" onClick={() => setDetail(null)}><X size={16} /></button>
            </div>
            <div className="um-drawer-body">
              <div className="um-detail-section">
                <div className="um-detail-title"><UserCheck size={14} /> 基础信息</div>
                <div className="um-detail-row"><span>昵称</span><span>{detail.nickname}</span></div>
                <div className="um-detail-row"><span>手机号</span><span>{detail.phone}</span></div>
                <div className="um-detail-row"><span>注册时间</span><span>{new Date(detail.registeredAt).toLocaleString()}</span></div>
                <div className="um-detail-row"><span>实名状态</span><span>{REALNAME_STATUS_LABELS[detail.realNameStatus]}</span></div>
                <div className="um-detail-row"><span>档案数 / 订单数</span><span>{detail.archiveCount} / {detail.orderCount}</span></div>
                <div className="um-detail-row"><span>账号状态</span><span>{detail.status === 'active' ? '正常' : '已禁用'}</span></div>
              </div>

              <div className="um-detail-section">
                <div className="um-detail-title"><Share2 size={14} /> 推广关系</div>
                <div className="um-detail-row"><span>邀请人</span><span>{detail.inviterName || '无'}</span></div>
                <div className="um-detail-row"><span>下级人数</span><span>{detail.invitees.length}</span></div>
                {detail.invitees.length > 0 && (
                  <div className="um-invitee-list">
                    {detail.invitees.map((inv) => (
                      <div className="um-invitee" key={inv.id}>
                        <span className="um-invitee-name">{inv.nickname}</span>
                        <span className="um-invitee-meta"><Phone size={11} /> {inv.phone}</span>
                        <span className="um-invitee-meta">{new Date(inv.registeredAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="um-detail-section">
                <div className="um-detail-title"><Wallet size={14} /> 佣金明细</div>
                {detail.commissions.length === 0 ? (
                  <div className="um-empty small">暂无佣金记录</div>
                ) : (
                  <div className="um-commission-list">
                    {detail.commissions.map((c) => (
                      <div className="um-commission" key={c.id}>
                        <div>
                          <div className="um-commission-title">{ORDER_TYPE_LABELS[c.orderType] || c.orderType}</div>
                          <div className="um-commission-meta">{c.orderId} · {new Date(c.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="um-commission-right">
                          <span className="um-commission-amount">+¥{c.commission.toFixed(2)}</span>
                          <span className={`um-status commission-${c.status}`}>{COMMISSION_STATUS_LABELS[c.status]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmUser && (
        <div className="modal-overlay" onClick={() => setConfirmUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{confirmUser.status === 'active' ? '确认禁用' : '确认启用'}</h4>
              <button className="modal-close" onClick={() => setConfirmUser(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#6b7280', fontSize: 13 }}>
                {confirmUser.status === 'active'
                  ? `禁用后，用户「${confirmUser.nickname}」将无法登录和使用平台服务，是否继续？`
                  : `启用后，用户「${confirmUser.nickname}」将恢复正常使用，是否继续？`}
              </p>
              <div className="um-confirm-actions">
                <button className="btn btn-outline" onClick={() => setConfirmUser(null)}>取消</button>
                <button
                  className={`btn ${confirmUser.status === 'active' ? 'um-btn-danger' : 'btn-primary'}`}
                  onClick={handleToggleStatus}
                >
                  {confirmUser.status === 'active' ? '确认禁用' : '确认启用'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

