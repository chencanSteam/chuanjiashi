import { orderApi } from '../api/order';
import { loadJson, type ChapterData } from '../data/aiMock';

export interface ActivityItem {
  user: string;
  action: string;
  time: string;
  type: string;
  ts: number;
}

interface ArchiveLike {
  id: string;
  name: string;
  createdAt?: string;
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

function parseChapterTime(updatedAt: string | null): number {
  if (!updatedAt) return 0;
  const ts = new Date(updatedAt).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function loadArchives(): ArchiveLike[] {
  try {
    const raw = localStorage.getItem('cj_archives');
    if (raw) return JSON.parse(raw) as ArchiveLike[];
  } catch {
    // ignore
  }
  return [];
}

// 最近动态：从真实数据源聚合（档案创建 + 传记章节生成 + 订单），按时间倒序
// Web 端首页与移动端首页共用，保证两端动态一致
export async function loadRecentActivities(limit = 6): Promise<ActivityItem[]> {
  const archives = loadArchives();
  const orders = await orderApi.list().catch(() => []);

  const activities: ActivityItem[] = [];
  archives.forEach((a) => {
    const ts = a.createdAt ? new Date(a.createdAt).getTime() : NaN;
    if (!Number.isNaN(ts)) {
      activities.push({ user: '我', action: `创建了「${a.name}」的人生档案`, time: formatRelativeTime(ts), type: '档案创建', ts });
    }
    const chapters = loadJson<ChapterData[]>(`cj_biography_chapters_${a.id}`, []);
    const generated = chapters.filter((c) => c.status !== 'notGenerated' && c.updatedAt);
    if (generated.length > 0) {
      const latest = generated.reduce((m, c) => Math.max(m, parseChapterTime(c.updatedAt)), 0);
      if (latest > 0) {
        activities.push({
          user: '系统',
          action: `已为「${a.name}」生成 ${generated.length} 个传记章节`,
          time: formatRelativeTime(latest),
          type: '传记生成完成',
          ts: latest,
        });
      }
    }
  });
  orders.forEach((o) => {
    const ts = new Date(o.createdAt).getTime();
    if (!Number.isNaN(ts)) {
      activities.push({
        user: '我',
        action: `提交了订单「${o.productName}」（¥${o.amount.toFixed(2)}）`,
        time: formatRelativeTime(ts),
        type: o.status === 'pending_pay' ? '订单待支付' : '订单已支付',
        ts,
      });
    }
  });
  activities.sort((a, b) => b.ts - a.ts);
  return activities.slice(0, limit);
}
