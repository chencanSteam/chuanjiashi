import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  PenTool,
  UsersRound,
  ChevronRight,
  BarChart3,
  BookOpen,
  Wallet,
  UserCheck,
  ClipboardList,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { orderApi, type AdminOrder } from '../api/order';
import { adminUserApi } from '../api/adminUser';
import { biographerApi } from '../api/biographer';
import { groupBuyApi } from '../api/groupBuy';
import { bookshelfApi } from '../api/bookshelf';
import { commissionApi } from '../api/commission';
import { partnerApi } from '../api/partner';
import type { Biographer, GroupBuyRecord, WithdrawalRecord, PartnerApplication } from '../mocks/types';
import Annotate from '../components/annotation/Annotate';
import './AdminDashboard.css';

const GMV_STATUSES: AdminOrder['status'][] = ['paid', 'delivering', 'completed'];

function last6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [biographers, setBiographers] = useState<Biographer[]>([]);
  const [groupRecords, setGroupRecords] = useState<GroupBuyRecord[]>([]);
  const [pendingBooks, setPendingBooks] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [applications, setApplications] = useState<PartnerApplication[]>([]);

  useEffect(() => {
    orderApi.adminList().then(setOrders).catch(() => setOrders([]));
    adminUserApi.list().then((list) => setUserCount(list.length)).catch(() => setUserCount(0));
    biographerApi.adminList().then(setBiographers).catch(() => setBiographers([]));
    groupBuyApi.records().then(setGroupRecords).catch(() => setGroupRecords([]));
    bookshelfApi
      .adminList({ status: 'pending' })
      .then((list) => setPendingBooks(list.length))
      .catch(() => setPendingBooks(0));
    commissionApi.adminWithdrawals().then(setWithdrawals).catch(() => setWithdrawals([]));
    partnerApi.adminApplications().then(setApplications).catch(() => setApplications([]));
  }, []);

  const gmvTotal = useMemo(
    () => orders.filter((o) => GMV_STATUSES.includes(o.status)).reduce((sum, o) => sum + o.amount, 0),
    [orders]
  );

  const trendData = useMemo(() => {
    const months = last6Months();
    return months.map((month) => {
      const monthOrders = orders.filter((o) => o.createdAt.startsWith(month));
      const gmv = monthOrders
        .filter((o) => GMV_STATUSES.includes(o.status))
        .reduce((sum, o) => sum + o.amount, 0);
      return { month, GMV: Math.round(gmv * 100) / 100, 订单数: monthOrders.length };
    });
  }, [orders]);

  const pendingBiographers = biographers.filter((b) => b.status === 'pending').length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending').length;
  const pendingApplications = applications.filter((a) => a.status === 'pending').length;
  const ongoingGroupBuys = groupRecords.filter((r) => r.status === 'pending').length;

  const statCards = [
    { icon: TrendingUp, label: 'GMV 总额', value: `¥${gmvTotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#1B5E4B' },
    { icon: ShoppingCart, label: '订单总数', value: orders.length.toString(), color: '#2563eb' },
    { icon: Users, label: '注册用户数', value: userCount.toString(), color: '#7c3aed' },
    { icon: PenTool, label: '入驻传记师数', value: biographers.length.toString(), color: '#d97706' },
    { icon: UsersRound, label: '进行中拼团数', value: ongoingGroupBuys.toString(), color: '#0891b2' },
  ];

  const todos = [
    { icon: PenTool, label: '待审核传记师', count: pendingBiographers, path: '/admin/biographers', color: '#d97706' },
    { icon: BookOpen, label: '待审核书籍', count: pendingBooks, path: '/admin/book-review', color: '#7c3aed' },
    { icon: Wallet, label: '待审核提现', count: pendingWithdrawals, path: '/admin/withdrawals', color: '#dc2626' },
    { icon: UserCheck, label: '待审合伙人申请', count: pendingApplications, path: '/admin/partner-applications', color: '#2563eb' },
  ];

  return (
    <div className="admin-dashboard-page">
      <header className="page-header">
        <h1 className="page-title">平台总览</h1>
      </header>

      <Annotate id="admin-dashboard.stats">
      <div className="ad-stats">
        {statCards.map((card) => (
          <div className="card ad-stat-card" key={card.label}>
            <div className="ad-stat-icon" style={{ color: card.color, background: `${card.color}14` }}>
              <card.icon size={20} />
            </div>
            <div className="ad-stat-value">{card.value}</div>
            <div className="ad-stat-label">{card.label}</div>
          </div>
        ))}
      </div>
      </Annotate>

      <div className="ad-main">
        <Annotate id="admin-dashboard.todo">
        <div className="card ad-todo-card">
          <div className="card-header">
            <h3 className="card-title"><ClipboardList size={16} /> 待办事项</h3>
          </div>
          <div className="card-body ad-todo-body">
            {todos.map((todo) => (
              <div className="ad-todo-item" key={todo.label} onClick={() => navigate(todo.path)}>
                <div className="ad-todo-left">
                  <div className="ad-todo-icon" style={{ color: todo.color, background: `${todo.color}14` }}>
                    <todo.icon size={16} />
                  </div>
                  <span className="ad-todo-label">{todo.label}</span>
                </div>
                <div className="ad-todo-right">
                  {todo.count > 0 && <span className="ad-todo-badge">{todo.count}</span>}
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
        </Annotate>

        <Annotate id="admin-dashboard.trend">
        <div className="card ad-trend-card">
          <div className="card-header">
            <h3 className="card-title"><BarChart3 size={16} /> 近 6 个月 GMV / 订单趋势</h3>
          </div>
          <div className="card-body ad-trend-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="gmv" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="count" orientation="right" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line yAxisId="gmv" type="monotone" dataKey="GMV" stroke="#1B5E4B" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="count" type="monotone" dataKey="订单数" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        </Annotate>
      </div>
    </div>
  );
}
