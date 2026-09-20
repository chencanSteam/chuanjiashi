import type { Biographer, BiographerBookingForm, BiographerService } from '../mocks/types';
import { defaultBiographerSettlements } from '../mocks/data/seed';
export const SERVICE_ORDER_KEY = 'cj_biographer_service_orders_v1';
export const SERVICE_ORDER_EVENT = 'cj-service-orders-updated';
export type ServiceRole = 'customer' | 'biographer' | 'admin';
export type ServiceStatus = 'pending_accept' | 'pending_pay' | 'working' | 'completed' | 'closed' | 'refunded';
export const serviceStatusLabels: Record<ServiceStatus, string> = { pending_accept: '待传记师接单', pending_pay: '待用户付款', working: '服务中', completed: '已完成', closed: '已关闭', refunded: '已退款结束' };
export const stageNames = ['访谈与大纲', '初稿', '校审稿', '终稿'];
export function serviceTerms(service: BiographerService): BiographerService {
  return { ...service, interviewCount: service.interviewCount || service.description.match(/\d+\s*次/)?.[0] || '2 次', wordCount: service.wordCount || service.description.match(/[\d.]+\s*万?字/)?.[0] || '5000 字', deliveryPeriod: service.deliveryPeriod || '30 天', revisionCount: service.revisionCount || '2 次', physicalBook: service.physicalBook || '不含', mediaMaterial: service.mediaMaterial || '不含' };
}
export interface ServiceStage { name: string; status: 'waiting' | 'review' | 'revision' | 'accepted'; versions: { content: string; fileName: string; at: string }[]; feedback: { text: string; at: string }[]; acceptedAt: string; amount: number; settledAt: string }
export interface ServiceOrder {
  id: string; customerPhone: string; customerName: string; biographerId: string; biographerName: string; biographerPhone: string;
  service: BiographerService; requirements: BiographerBookingForm; amount: number; platformFee: number; providerAmount: number; commissionRate: number;
  status: ServiceStatus; createdAt: string; acceptedAt: string; paidAt: string; updatedAt: string; closeReason: string;
  stages: ServiceStage[]; requests: { type: 'help' | 'refund'; reason: string; status: 'pending' | 'resolved' | 'rejected'; result: string; amount: number; at: string }[];
  history: { at: string; text: string }[];
}
export const money = (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export function readServiceOrders(): ServiceOrder[] {
  try { const value = JSON.parse(localStorage.getItem(SERVICE_ORDER_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
}
function writeOrders(orders: ServiceOrder[]) { localStorage.setItem(SERVICE_ORDER_KEY, JSON.stringify(orders)); window.dispatchEvent(new Event(SERVICE_ORDER_EVENT)); }
export function createServiceOrder(biographer: Biographer, service: BiographerService, requirements: BiographerBookingForm, user: { phone: string; name?: string }) {
  const now = new Date().toISOString();
  const amountCents = Math.round(service.price * 100);
  const rate = defaultBiographerSettlements.find(item => item.biographerId === biographer.id)?.commissionRate ?? 0.15;
  const feeCents = Math.round(amountCents * rate), net = amountCents - feeCents;
  const first = Math.round(net * 0.3), second = Math.round(net * 0.4);
  const installments = [0, first, second, net - first - second];
  const order: ServiceOrder = {
    id: `BS-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    customerPhone: user.phone, customerName: user.name || '演示客户', biographerId: biographer.id, biographerName: biographer.name, biographerPhone: biographer.phone,
    service: serviceTerms(service), requirements: { ...requirements }, amount: amountCents / 100, commissionRate: rate, platformFee: feeCents / 100, providerAmount: net / 100,
    status: 'pending_accept', createdAt: now, updatedAt: now, acceptedAt: '', paidAt: '', closeReason: '', requests: [],
    stages: stageNames.map((name, index) => ({ name, status: 'waiting', versions: [], feedback: [], acceptedAt: '', amount: installments[index] / 100, settledAt: '' })),
    history: [{ at: now, text: '客户提交需求订单' }],
  };
  writeOrders([order, ...readServiceOrders()]); return order;
}
export function serviceOrderVisible(order: ServiceOrder, role: ServiceRole, phone: string) { return role === 'admin' || (role === 'customer' ? order.customerPhone === phone : order.biographerPhone === phone); }
export function phoneUnlocked(order: ServiceOrder) { return !!order.paidAt && order.status !== 'refunded' && order.status !== 'closed'; }
export type ServiceAction = 'accept' | 'decline' | 'cancel' | 'pay' | 'deliver' | 'revise' | 'approve' | 'settle' | 'help' | 'refund' | 'resolve' | 'reject_request';
export function updateServiceOrder(id: string, action: ServiceAction, actor: { role: ServiceRole; phone: string }, payload: { text?: string; fileName?: string; amount?: number; stageIndex?: number } = {}) {
  const orders = readServiceOrders(); const order = orders.find(item => item.id === id);
  if (!order || !serviceOrderVisible(order, actor.role, actor.phone)) throw new Error('找不到当前账号的订单');
  const now = new Date().toISOString();
  const stageIndex = order.stages.findIndex(stage => stage.status !== 'accepted');
  const stage = order.stages[stageIndex];
  const pendingRequest = order.requests.find(item => item.status === 'pending');
  const requireState = (condition: boolean) => { if (!condition) throw new Error('订单状态已变化，请刷新后操作'); };
  if (pendingRequest && !['resolve', 'reject_request'].includes(action)) throw new Error('平台正在处理售后申请，暂缓交付、验收和结算');
  let text = '';
  switch (action) {
    case 'accept':
      requireState(actor.role === 'biographer' && order.status === 'pending_accept'); order.status = 'pending_pay'; order.acceptedAt = now; text = '传记师确认接单'; break;
    case 'decline':
    case 'cancel':
      requireState(!order.paidAt && (order.status === 'pending_accept' || order.status === 'pending_pay') && (action === 'decline' ? actor.role === 'biographer' : actor.role === 'customer'));
      order.status = 'closed'; order.closeReason = payload.text?.trim() || (action === 'decline' ? '档期暂不合适，无法承接' : '客户取消订单'); text = order.closeReason; break;
    case 'pay':
      requireState(actor.role === 'customer' && order.status === 'pending_pay' && !!order.acceptedAt && !order.paidAt);
      order.status = 'working'; order.paidAt = now; text = `客户模拟全款支付 ${money(order.amount)}，已开放传记师联系方式`; break;
    case 'deliver':
      requireState(actor.role === 'biographer' && order.status === 'working' && !!stage && ['waiting', 'revision'].includes(stage.status) && payload.stageIndex === stageIndex);
      stage.versions.push({ content: payload.text?.trim() || (stageIndex === 0 ? '访谈安排：双方电话约定时间，线上或电话访谈。大纲：成长经历、求学与工作、家庭故事、人生感悟。' : `${stage.name}示例：围绕传主的成长、事业与家庭经历整理成文，保留关键事件与个人讲述。本次提交供客户查看并提出修改意见。`), fileName: payload.fileName || '', at: now });
      stage.status = 'review'; text = `传记师提交${stage.name}，等待客户验收`; break;
    case 'revise':
    case 'approve':
      requireState(actor.role === 'customer' && order.status === 'working' && !!stage && stage.status === 'review' && payload.stageIndex === stageIndex);
      if (action === 'revise') { stage.status = 'revision'; stage.feedback.push({ text: payload.text?.trim() || '请补充关键时间和人物细节后重新提交。', at: now }); text = `客户提出${stage.name}修改意见`; }
      else { stage.status = 'accepted'; stage.acceptedAt = now; if (stageIndex === 3) order.status = 'completed'; text = `客户验收通过${stage.name}${stageIndex > 0 ? `，生成待结算 ${money(stage.amount)}` : ''}`; } break;
    case 'settle': {
      const target = order.stages[payload.stageIndex ?? -1];
      requireState(actor.role === 'admin' && ['working', 'completed'].includes(order.status) && !!target && target.status === 'accepted' && !target.settledAt && (payload.stageIndex ?? 0) > 0);
      target.settledAt = now; text = `平台确认${target.name}结算 ${money(target.amount)}`; break;
    }
    case 'help':
    case 'refund':
      requireState(actor.role === 'customer' && !!order.paidAt && ['working', 'completed'].includes(order.status));
      order.requests.push({ type: action, status: 'pending', reason: payload.text?.trim() || (action === 'refund' ? '申请取消剩余服务，请平台协助核算退款。' : '暂时联系不上传记师，请平台协助。'), at: now, result: '', amount: 0 }); text = action === 'refund' ? '客户申请退款，等待平台处理' : '客户申请平台介入'; break;
    case 'resolve':
    case 'reject_request':
      requireState(actor.role === 'admin' && !!pendingRequest);
      if (pendingRequest) {
        if (action === 'resolve' && pendingRequest.type === 'refund') { const refund = payload.amount ?? order.amount; requireState(Number.isFinite(refund) && refund > 0 && refund <= order.amount); pendingRequest.amount = Math.round(refund * 100) / 100; order.status = 'refunded'; }
        pendingRequest.status = action === 'resolve' ? 'resolved' : 'rejected';
        pendingRequest.result = payload.text?.trim() || (action === 'resolve' ? '平台已联系双方并完成处理。' : '平台暂不支持本次申请，可补充原因后再次提交。');
        text = `${pendingRequest.type === 'refund' ? '退款' : '平台介入'}处理：${pendingRequest.result}${pendingRequest.amount ? `，模拟退款 ${money(pendingRequest.amount)}` : ''}`;
      } break;
  }
  order.updatedAt = now; order.history.push({ at: now, text }); writeOrders(orders); return order;
}
