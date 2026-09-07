import { useEffect, useMemo, useState } from 'react';
import { Settings2, Users, Gift, Undo2, Save, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { groupBuyApi } from '../api/groupBuy';
import Annotate from '../components/annotation/Annotate';
import type { GroupBuyActivity, GroupBuyRecord, GroupBuyRules } from '../mocks/types';
import './GroupBuyManagement.css';

const tabs = [
  { key: 'rules', label: '规则配置' },
  { key: 'orders', label: '拼团订单' },
  { key: 'free', label: '免单记录' },
  { key: 'refunds', label: '退款处理' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const defaultRules: GroupBuyRules = {
  firstRoundSize: 6,
  laterRoundSize: 5,
  durationHours: 24,
  freeEnabled: true,
  firstRoundFreeCount: 3,
  laterRoundFreeCount: 2,
  maxLaunchPerDevice: 1,
  maxJoinPerPhone: 1,
};

const groupStatusLabels: Record<GroupBuyRecord['status'], string> = {
  pending: '拼团中',
  success: '已成团',
  failed: '未成团',
};

export default function GroupBuyManagement() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('rules');
  const [activity, setActivity] = useState<GroupBuyActivity | null>(null);
  const [records, setRecords] = useState<GroupBuyRecord[]>([]);
  const [rules, setRules] = useState<GroupBuyRules>(defaultRules);

  const loadRecords = () => {
    groupBuyApi.records().then(setRecords).catch(() => setRecords([]));
  };

  useEffect(() => {
    groupBuyApi.activity().then(setActivity).catch(() => setActivity(null));
    loadRecords();
    groupBuyApi.rules().then(setRules).catch(() => setRules(defaultRules));
  }, []);

  const freeRecords = useMemo(() => {
    return records.flatMap((r) =>
      r.members
        .filter((m) => m.isFree)
        .map((m) => ({
          id: m.id,
          groupId: r.id,
          phone: m.phone,
          isLauncher: m.isLauncher,
          joinedAt: m.joinedAt,
          refunded: !!m.refunded,
        }))
    );
  }, [records]);

  const failedGroups = useMemo(() => records.filter((r) => r.status === 'failed'), [records]);

  const handleSaveRules = async () => {
    if (rules.firstRoundSize < 2 || rules.laterRoundSize < 2) {
      addToast('成团人数不能小于 2', 'error');
      return;
    }
    if (rules.durationHours < 1) {
      addToast('拼团时限不能小于 1 小时', 'error');
      return;
    }
    try {
      await groupBuyApi.saveRules(rules);
      groupBuyApi.activity().then(setActivity).catch(() => {});
      addToast('拼团规则已保存，用户端开团即时生效', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '保存失败', 'error');
    }
  };

  const handleConfirmRefund = async (memberId: string) => {
    try {
      await groupBuyApi.confirmRefund(memberId);
      loadRecords();
      addToast('已确认退款', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '操作失败', 'error');
    }
  };

  return (
    <div className="groupbuy-mgmt-page">
      <header className="page-header">
        <h1 className="page-title">拼团管理</h1>
      </header>

      <Annotate id="group-buy-management.tabs" inline>
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      </Annotate>

      {activeTab === 'rules' && (
        <Annotate id="group-buy-management.rules">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Settings2 size={16} /> 拼团规则</h3>
          </div>
          <div className="card-body groupbuy-rules-body">
            {activity && (
              <div className="groupbuy-current-activity">
                当前活动：{activity.name}（¥{activity.price}/人，
                {activity.status === 'active' ? '进行中' : '已停用'}）
              </div>
            )}
            <div className="form-row">
              <label>首轮成团人数</label>
              <input
                type="number"
                min={2}
                value={rules.firstRoundSize}
                onChange={(e) => setRules((prev) => ({ ...prev, firstRoundSize: Number(e.target.value) }))}
              />
            </div>
            <div className="form-row">
              <label>后续轮成团人数</label>
              <input
                type="number"
                min={2}
                value={rules.laterRoundSize}
                onChange={(e) => setRules((prev) => ({ ...prev, laterRoundSize: Number(e.target.value) }))}
              />
            </div>
            <div className="form-row">
              <label>拼团时限（小时）</label>
              <input
                type="number"
                min={1}
                value={rules.durationHours}
                onChange={(e) => setRules((prev) => ({ ...prev, durationHours: Number(e.target.value) }))}
              />
            </div>
            <div className="form-row">
              <label className="groupbuy-check">
                <input
                  type="checkbox"
                  checked={rules.freeEnabled}
                  onChange={(e) => setRules((prev) => ({ ...prev, freeEnabled: e.target.checked }))}
                />
                开启成团免单
              </label>
            </div>
            {rules.freeEnabled && (
              <>
                <div className="form-row">
                  <label>首轮免单名额</label>
                  <input
                    type="number"
                    min={0}
                    value={rules.firstRoundFreeCount}
                    onChange={(e) => setRules((prev) => ({ ...prev, firstRoundFreeCount: Number(e.target.value) }))}
                  />
                </div>
                <div className="form-row">
                  <label>后续轮免单名额</label>
                  <input
                    type="number"
                    min={0}
                    value={rules.laterRoundFreeCount}
                    onChange={(e) => setRules((prev) => ({ ...prev, laterRoundFreeCount: Number(e.target.value) }))}
                  />
                </div>
              </>
            )}
            <div className="groupbuy-section-title">防刷规则</div>
            <div className="form-row">
              <label>同一设备限开团次数</label>
              <input
                type="number"
                min={1}
                value={rules.maxLaunchPerDevice}
                onChange={(e) => setRules((prev) => ({ ...prev, maxLaunchPerDevice: Number(e.target.value) }))}
              />
            </div>
            <div className="form-row">
              <label>同一手机号限参团次数</label>
              <input
                type="number"
                min={1}
                value={rules.maxJoinPerPhone}
                onChange={(e) => setRules((prev) => ({ ...prev, maxJoinPerPhone: Number(e.target.value) }))}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSaveRules}>
              <Save size={14} /> 保存规则
            </button>
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'orders' && (
        <Annotate id="group-buy-management.orders">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Users size={16} /> 拼团订单</h3>
          </div>
          <div className="card-body groupbuy-body">
            {records.length === 0 ? (
              <div className="groupbuy-empty">暂无拼团订单</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>团号</th>
                      <th>团长</th>
                      <th>人数进度</th>
                      <th>状态</th>
                      <th>金额</th>
                      <th>截止时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.launcherPhone}</td>
                        <td>
                          <div className="groupbuy-progress">
                            <div className="groupbuy-progress-bar">
                              <div
                                className="groupbuy-progress-inner"
                                style={{ width: `${Math.min(100, (r.currentCount / r.targetCount) * 100)}%` }}
                              />
                            </div>
                            <span>{r.currentCount}/{r.targetCount} 人</span>
                          </div>
                        </td>
                        <td>
                          <span className={`groupbuy-status ${r.status}`}>{groupStatusLabels[r.status]}</span>
                        </td>
                        <td className="groupbuy-money">
                          ¥{((activity?.price || 0) * r.currentCount).toFixed(2)}
                        </td>
                        <td>{new Date(r.endAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'free' && (
        <Annotate id="group-buy-management.free">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Gift size={16} /> 免单记录</h3>
          </div>
          <div className="card-body groupbuy-body">
            {freeRecords.length === 0 ? (
              <div className="groupbuy-empty">暂无免单记录</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>免单用户</th>
                      <th>团号</th>
                      <th>角色</th>
                      <th>参团时间</th>
                      <th>退款状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freeRecords.map((m) => (
                      <tr key={m.id}>
                        <td>{m.phone}</td>
                        <td>{m.groupId}</td>
                        <td>{m.isLauncher ? '团长' : '团员'}</td>
                        <td>{new Date(m.joinedAt).toLocaleString()}</td>
                        <td>
                          {m.refunded ? (
                            <span className="groupbuy-status refunded">已退款</span>
                          ) : (
                            <span className="groupbuy-status pending">待退款</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        </Annotate>
      )}

      {activeTab === 'refunds' && (
        <Annotate id="group-buy-management.refunds">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Undo2 size={16} /> 未成团退款</h3>
          </div>
          <div className="card-body groupbuy-body">
            {failedGroups.length === 0 ? (
              <div className="groupbuy-empty">暂无待退款订单</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>团号</th>
                      <th>用户</th>
                      <th>金额</th>
                      <th>参团时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedGroups.flatMap((r) =>
                      r.members.map((m) => {
                        const refunded = !!m.refunded;
                        return (
                          <tr key={m.id}>
                            <td>{r.id}</td>
                            <td>{m.phone}</td>
                            <td className="groupbuy-money">¥{(activity?.price || 0).toFixed(2)}</td>
                            <td>{new Date(m.joinedAt).toLocaleString()}</td>
                            <td>
                              {refunded ? (
                                <span className="groupbuy-status refunded"><CheckCircle size={12} /> 已退款</span>
                              ) : (
                                <button className="admin-table-link" onClick={() => handleConfirmRefund(m.id)}>
                                  确认退款
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        </Annotate>
      )}
    </div>
  );
}
