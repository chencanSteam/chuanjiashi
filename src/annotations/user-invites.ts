import type { PageAnnotations } from './types';

/** 用户邀请奖励页（/admin/user-invites）的逻辑标注 */
export const userInvitesAnnotations: PageAnnotations = {
  page: 'user-invites',
  pageName: '用户邀请奖励',
  route: '/admin/user-invites',
  items: [
    {
      id: 'user-invites.stats',
      target: '顶部统计卡',
      logic: `① 累计奖励 = 全部奖励流水的奖励金额之和；已提现 = 状态为「已打款」的提现总额；待审核提现 = pending 金额。
② 邀请关系数按奖励流水中的被邀请人去重统计。`,
    },
    {
      id: 'user-invites.rewards',
      target: '奖励流水（含搜索）',
      logic: `① 数据来自 commissionApi.adminList()，由邀请奖励类型的分润记录映射而来。
② 支持按邀请人 / 被邀请人 / 订单号搜索。
③ 邀请奖励与被邀请人的付费订单挂钩：订单完成且无退款，奖励才进入可提现余额。`,
    },
    {
      id: 'user-invites.withdrawals',
      target: '用户提现审核',
      logic: `① 仅「待审核」状态显示打款 / 拒绝按钮；处理后刷新列表。
② 打款调用 commissionApi.processWithdrawal(id, 'paid')；拒绝则返还金额至用户可提现余额。
③ 正式版：打款需对接微信支付企业付款，并保留审核操作日志。`,
    },
  ],
};
