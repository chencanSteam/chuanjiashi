import type { PageAnnotations } from './types';

/**
 * 邀请有礼页（/invite）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const inviteAnnotations: PageAnnotations = {
  page: 'invite',
  pageName: '邀请有礼',
  route: '/invite',
  items: [
    {
      id: 'invite.hero',
      target: '邀请码主视觉区',
      logic: `① 邀请码取当前登录用户的 user.inviteCode（注册时自动生成），邀请链接为「站点地址#/login?invite=邀请码」，好友打开链接注册即建立邀请关系。
② 复制邀请码 / 复制邀请链接均写剪贴板并 toast 提示；写剪贴板失败时提示稍后重试。`,
    },
    {
      id: 'invite.stats',
      target: '邀请统计卡（累计奖励 / 可提现余额 / 已邀请好友）',
      logic: `① 数据来自 commissionApi.summary()（GET /api/commissions/summary）：累计奖励=全部佣金流水合计；可提现余额=已结算部分；已邀请好友=被邀请用户数。
② mock 端首次请求时会为当前用户补 3 条演示佣金流水，保证页面有内容。`,
    },
    {
      id: 'invite.invited-table',
      target: '我邀请的用户列表',
      logic: `① 数据来自 localStorage「cj_user_invites」（inviterUserId = 当前用户手机号），好友信息关联「cj_registered_users」。
② 贡献奖励=该好友产生的佣金合计（按 fromUserId 聚合奖励明细），无消费显示「暂无消费」。`,
    },
    {
      id: 'invite.rewards-table',
      target: '奖励明细',
      logic: `① 数据来自 commissionApi.list()（GET /api/commissions），展示来源用户、订单号、订单金额、奖励金额、状态（结算中/已结算/冻结中/已提现）与时间。
② 奖励比例为订单金额的 20%（普通用户），仅一级邀请关系有效。`,
    },
    {
      id: 'invite.withdraw',
      target: '奖励提现',
      logic: `① 金额校验：为空或 ≤0、超过可提现余额均拦截提示；提交调 commissionApi.withdraw（POST /api/withdrawals），状态为待审核，后台「提现审核」处理。
② 成功后清空输入并刷新页面数据；提现记录带状态（待审核/已通过/已驳回/已打款）与处理时间。`,
    },
  ],
};
