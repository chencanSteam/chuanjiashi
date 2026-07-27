import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Flame,
  Clock,
  Share2,
  Gift,
  Copy,
  ShieldAlert,
  Crown,
  PartyPopper,
  RefreshCcw,
} from 'lucide-react';
import { groupBuyApi } from '../api/groupBuy';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import Modal from '../components/ui/Modal';
import type { GroupBuyActivity, GroupBuyRecord } from '../mocks/types';
import './GroupBuy.css';

const formatLeftTime = (endAt: string, now: number) => {
  const left = new Date(endAt).getTime() - now;
  if (left <= 0) return '已结束';
  const hours = Math.floor(left / 3600000);
  const minutes = Math.floor((left % 3600000) / 60000);
  const seconds = Math.floor((left % 60000) / 1000);
  return `${hours}时${minutes}分${seconds}秒`;
};

const maskPhone = (phone: string) =>
  phone.length >= 7 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone;

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

export default function GroupBuy() {
  const { addToast } = useToast();
  const { user } = useAuth();
  // mock 侧当前用户 id 规则与 AuthContext.syncMockAuth 一致：`u_${phone}`
  const myMockId = user ? `u_${user.phone}` : '';
  const [activity, setActivity] = useState<GroupBuyActivity | null>(null);
  const [records, setRecords] = useState<GroupBuyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ongoing' | 'mine'>('ongoing');
  const [paying, setPaying] = useState(false);
  const [shareRecord, setShareRecord] = useState<GroupBuyRecord | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const loadData = useCallback(() => {
    Promise.all([groupBuyApi.activity(), groupBuyApi.records()])
      .then(([a, r]) => {
        setActivity(a);
        setRecords(r || []);
      })
      .catch(() => {
        setActivity(null);
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ongoingRecords = useMemo(
    () =>
      records
        .filter((r) => r.status === 'pending' && new Date(r.endAt).getTime() > now)
        .sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime()),
    [records, now]
  );

  const myRecords = useMemo(() => {
    if (!user) return [];
    return records
      .filter((r) => r.launcherId === myMockId || r.members.some((m) => m.userId === myMockId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [records, user, myMockId]);

  const handleLaunch = async () => {
    if (!user) {
      addToast('请先登录', 'error');
      return;
    }
    if (!activity) return;
    try {
      setPaying(true);
      const { record } = await groupBuyApi.join(undefined, true);
      addToast('支付成功，拼团已发起，快邀请好友参团吧', 'success');
      setShareRecord(record);
      loadData();
    } catch (err) {
      addToast(errorMessage(err, '发起拼团失败'), 'error');
    } finally {
      setPaying(false);
    }
  };

  const handleJoin = async (record: GroupBuyRecord) => {
    if (!user) {
      addToast('请先登录', 'error');
      return;
    }
    if (record.members.some((m) => m.userId === myMockId)) {
      addToast('你已参与该团，同一账号限参 1 次', 'error');
      return;
    }
    try {
      setPaying(true);
      await groupBuyApi.join(record.id, false);
      addToast('支付成功，参团成功', 'success');
      loadData();
    } catch (err) {
      addToast(errorMessage(err, '参团失败'), 'error');
    } finally {
      setPaying(false);
    }
  };

  const shareLink = shareRecord ? `${window.location.origin}${window.location.pathname}#/group-buy?recordId=${shareRecord.id}` : '';

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast('链接已复制到剪贴板', 'success');
    } catch {
      addToast('复制失败，请手动复制', 'error');
    }
  };

  const recordStatusText = (r: GroupBuyRecord) => {
    if (r.status === 'pending') return new Date(r.endAt).getTime() > now ? '拼团中' : '已退款';
    return r.status === 'success' ? '已成团' : '已退款';
  };

  return (
    <div className="group-buy-page">
      <div className="group-buy-banner">
        <div className="group-buy-banner-badge"><Flame size={14} /> 限时拼团</div>
        <h1>99 元 AI 传记拼团</h1>
        <p className="group-buy-banner-price">
          <strong>¥{activity?.price ?? 99}</strong>
          <span>AI 智能采访 + 专属人物传记</span>
        </p>
        <ul className="group-buy-rules">
          <li>第一轮 6 人成团，第二轮起 5 人成团</li>
          <li>成团后随机抽取 1 人免单，退款原路返回</li>
          <li>{activity?.durationHours ?? 24} 小时内未成团，自动全额退款</li>
        </ul>
        <button className="btn btn-accent group-buy-launch-btn" disabled={paying} onClick={handleLaunch}>
          <Users size={16} /> {paying ? '支付中…' : `发起拼团 ¥${activity?.price ?? 99}`}
        </button>
      </div>

      <div className="group-buy-tabs">
        <button
          className={`group-buy-tab ${tab === 'ongoing' ? 'active' : ''}`}
          onClick={() => setTab('ongoing')}
        >
          进行中的团
        </button>
        <button
          className={`group-buy-tab ${tab === 'mine' ? 'active' : ''}`}
          onClick={() => setTab('mine')}
        >
          我的拼团
        </button>
      </div>

      {loading ? (
        <div className="group-buy-loading">加载中…</div>
      ) : tab === 'ongoing' ? (
        ongoingRecords.length === 0 ? (
          <div className="group-buy-empty">
            <Users size={48} color="#d1d5db" />
            <p>暂无进行中的拼团，发起一个吧</p>
          </div>
        ) : (
          <div className="group-buy-list">
            {ongoingRecords.map((r) => {
              const percent = Math.min(100, Math.round((r.currentCount / r.targetCount) * 100));
              return (
                <div className="group-buy-card" key={r.id}>
                  <div className="group-buy-card-header">
                    <div className="group-buy-launcher">
                      <div className="group-buy-avatar"><Crown size={14} /></div>
                      <div>
                        <div className="group-buy-launcher-name">团长 {maskPhone(r.launcherPhone)}</div>
                        <div className="group-buy-card-time">
                          <Clock size={12} /> 剩余 {formatLeftTime(r.endAt, now)}
                        </div>
                      </div>
                    </div>
                    <span className="group-buy-card-count">
                      已拼 <strong>{r.currentCount}</strong>/{r.targetCount} 人
                    </span>
                  </div>
                  <div className="group-buy-progress-track">
                    <div className="group-buy-progress-fill" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="group-buy-card-footer">
                    <span className="group-buy-card-hint">还差 {r.targetCount - r.currentCount} 人成团</span>
                    <div className="group-buy-card-actions">
                      <button className="btn btn-outline" onClick={() => setShareRecord(r)}>
                        <Share2 size={14} /> 邀请好友
                      </button>
                      <button className="btn btn-primary" disabled={paying} onClick={() => handleJoin(r)}>
                        {paying ? '支付中…' : '参团 ¥99'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : myRecords.length === 0 ? (
        <div className="group-buy-empty">
          <Gift size={48} color="#d1d5db" />
          <p>暂无拼团记录</p>
        </div>
      ) : (
        <div className="group-buy-list">
          {myRecords.map((r) => {
            const isLauncher = myMockId === r.launcherId;
            const status = recordStatusText(r);
            const freeMember = r.status === 'success' ? r.members.find((m) => m.isFree) : undefined;
            return (
              <div className="group-buy-card" key={r.id}>
                <div className="group-buy-card-header">
                  <div className="group-buy-launcher">
                    <div className="group-buy-avatar">{isLauncher ? <Crown size={14} /> : <Users size={14} />}</div>
                    <div>
                      <div className="group-buy-launcher-name">
                        {isLauncher ? '我发起的团' : '我参与的团'}
                        <span className="group-buy-launcher-sub">（团长 {maskPhone(r.launcherPhone)}）</span>
                      </div>
                      <div className="group-buy-card-time">
                        {new Date(r.createdAt).toLocaleString()} · {r.currentCount}/{r.targetCount} 人
                      </div>
                    </div>
                  </div>
                  <span className={`group-buy-status ${status === '已成团' ? 'success' : status === '拼团中' ? 'pending' : 'refunded'}`}>
                    {status}
                  </span>
                </div>
                {r.status === 'success' && (
                  <div className="group-buy-free-result">
                    <PartyPopper size={16} />
                    {freeMember
                      ? `恭喜 ${freeMember.userId === myMockId ? '你' : maskPhone(freeMember.phone)} 抽中免单，款项已原路退回`
                      : '免单结果已公布'}
                  </div>
                )}
                {status === '已退款' && (
                  <div className="group-buy-refund-result">
                    <RefreshCcw size={14} /> 未在规定时间内成团，款项已自动退回
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="group-buy-anti-fraud">
        <h4><ShieldAlert size={14} /> 防刷限制说明</h4>
        <p>
          为保障活动公平：同一设备、同一账号、同一手机号在每期活动中限参 1 次；
          免单结果由系统随机抽取并公示；如发现恶意刷单行为，平台有权取消参团资格并原路退款。
        </p>
      </div>

      <Modal open={!!shareRecord} title="邀请好友参团" onClose={() => setShareRecord(null)}>
        {shareRecord && (
          <div className="group-buy-share">
            <p className="group-buy-share-desc">
              把链接发给好友，还差 {Math.max(0, shareRecord.targetCount - shareRecord.currentCount)} 人即可成团，成团随机 1 人免单！
            </p>
            <div className="group-buy-share-link">{shareLink}</div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleCopy(shareLink)}>
              <Copy size={14} /> 复制邀请链接
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
