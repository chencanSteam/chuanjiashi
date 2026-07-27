import { useEffect, useMemo, useState } from 'react';
import { Settings2, Users, Gift, Undo2, Save, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { groupBuyApi } from '../api/groupBuy';
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

      {activeTab === 'rules' && (
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
      )}

      {activeTab === 'orders' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Users size={16} /> 拼团订单</h3>
          </div>
          <div className="card-body groupbuy-body">
            {records.length === 0 ? (
              <div className="groupbuy-empty">暂无拼团订单</div>
            ) : (
              <div className="groupbuy-table">
                <div className="groupbuy-row groupbuy-header-row">
                  <div className="groupbuy-cell">团号</div>
                  <div className="groupbuy-cell">团长</div>
                  <div className="groupbuy-cell">人数进度</div>
                  <div className="groupbuy-cell">状态</div>
                  <div className="groupbuy-cell">金额</div>
                  <div className="groupbuy-cell">截止时间</div>
                </div>
                {records.map((r) => (
                  <div className="groupbuy-row" key={r.id}>
                    <div className="groupbuy-cell">{r.id}</div>
                    <div className="groupbuy-cell">{r.launcherPhone}</div>
                    <div className="groupbuy-cell">
                      <div className="groupbuy-progress">
                        <div className="groupbuy-progress-bar">
                          <div
                            className="groupbuy-progress-inner"
                            style={{ width: `${Math.min(100, (r.currentCount / r.targetCount) * 100)}%` }}
                          />
                        </div>
                        <span>{r.currentCount}/{r.targetCount} 人</span>
                      </div>
                    </div>
                    <div className="groupbuy-cell">
                      <span className={`groupbuy-status ${r.status}`}>{groupStatusLabels[r.status]}</span>
                    </div>
                    <div className="groupbuy-cell groupbuy-money">
                      ¥{((activity?.price || 0) * r.currentCount).toFixed(2)}
                    </div>
                    <div className="groupbuy-cell">{new Date(r.endAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'free' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Gift size={16} /> 免单记录</h3>
          </div>
          <div className="card-body groupbuy-body">
            {freeRecords.length === 0 ? (
              <div className="groupbuy-empty">暂无免单记录</div>
            ) : (
              <div className="groupbuy-table">
                <div className="groupbuy-row groupbuy-header-row">
                  <div className="groupbuy-cell">免单用户</div>
                  <div className="groupbuy-cell">团号</div>
                  <div className="groupbuy-cell">角色</div>
                  <div className="groupbuy-cell">参团时间</div>
                  <div className="groupbuy-cell">退款状态</div>
                </div>
                {freeRecords.map((m) => (
                  <div className="groupbuy-row" key={m.id}>
                    <div className="groupbuy-cell">{m.phone}</div>
                    <div className="groupbuy-cell">{m.groupId}</div>
                    <div className="groupbuy-cell">{m.isLauncher ? '团长' : '团员'}</div>
                    <div className="groupbuy-cell">{new Date(m.joinedAt).toLocaleString()}</div>
                    <div className="groupbuy-cell">
                      {m.refunded ? (
                        <span className="groupbuy-status refunded">已退款</span>
                      ) : (
                        <span className="groupbuy-status pending">待退款</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'refunds' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Undo2 size={16} /> 未成团退款</h3>
          </div>
          <div className="card-body groupbuy-body">
            {failedGroups.length === 0 ? (
              <div className="groupbuy-empty">暂无待退款订单</div>
            ) : (
              <div className="groupbuy-table">
                <div className="groupbuy-row groupbuy-header-row">
                  <div className="groupbuy-cell">团号</div>
                  <div className="groupbuy-cell">用户</div>
                  <div className="groupbuy-cell">金额</div>
                  <div className="groupbuy-cell">参团时间</div>
                  <div className="groupbuy-cell">操作</div>
                </div>
                {failedGroups.flatMap((r) =>
                  r.members.map((m) => {
                    const refunded = !!m.refunded;
                    return (
                      <div className="groupbuy-row" key={m.id}>
                        <div className="groupbuy-cell">{r.id}</div>
                        <div className="groupbuy-cell">{m.phone}</div>
                        <div className="groupbuy-cell groupbuy-money">¥{(activity?.price || 0).toFixed(2)}</div>
                        <div className="groupbuy-cell">{new Date(m.joinedAt).toLocaleString()}</div>
                        <div className="groupbuy-cell">
                          {refunded ? (
                            <span className="groupbuy-status refunded"><CheckCircle size={12} /> 已退款</span>
                          ) : (
                            <button className="btn btn-outline groupbuy-refund-btn" onClick={() => handleConfirmRefund(m.id)}>
                              确认退款
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
