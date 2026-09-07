import type { PageAnnotations } from './types';

/**
 * 结算提现（/biographer/earnings）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const biographerEarningsAnnotations: PageAnnotations = {
  page: 'biographer-earnings',
  pageName: '结算提现',
  route: '/biographer/earnings',
  items: [
    {
      id: 'biographer-earnings.overview',
      target: '账户总览（余额卡 + 统计卡）',
      logic: `① 余额卡展示可提现金额（settlement.availableAmount）与托管中金额（escrowAmount，服务完成确认后转入可提现）；「申请提现」入口在余额卡上。
② 统计卡：累计收入=收入明细求和（含单数）；累计已提现=已打款状态的提现实收求和；平台服务费率=settlement.commissionRate，由平台统一配置、入账时已扣除。
③ 数据来自 biographerEarningsApi.overview()（GET /api/biographer/earnings）；接口失败时整页降级为「暂无结算数据」。`,
    },
    {
      id: 'biographer-earnings.withdraw-entry',
      target: '「申请提现」按钮',
      logic: `① 点击打开提现弹窗，入口位于账户总览余额卡；金额是否可提的校验在弹窗提交时进行。
② 提现成功后会用接口返回的最新结算数据整体刷新本页统计与明细。`,
    },
    {
      id: 'biographer-earnings.tabs',
      target: '收入 / 提现 / 扣款明细切换',
      logic: `① 三个 tab 共用 overview 接口返回的 settlement 数据，切换只改前端展示，不重新请求。
② 订单收入明细：逐单展示入账金额与平台抽佣金额。
③ 提现记录：带状态流转（待审核 → 已通过/已驳回 → 已打款），已打款的记录额外显示打款时间。
④ 违规扣款记录为空时展示引导文案；扣款由管理端录入（biographerEarningsApi.createPenalty）。`,
    },
    {
      id: 'biographer-earnings.withdraw-modal',
      target: '申请提现弹窗',
      logic: `① 金额校验：为空或 ≤0 提示「请输入正确的提现金额」；低于 ¥100 提示「单笔提现金额不能低于 ¥100」；超过可提现金额提示「提现金额不能超过可结算金额」，均拦截不发起请求。
② 弹窗展示收款账户（微信零钱-当前登录账号）与提现规则：1-3 个工作日审核打款，平台服务费已在入账时扣除、提现不重复收费。
③ 「全部提现」一键填入当前可提现金额。
④ 提交调 biographerEarningsApi.withdraw(amount)（POST /api/biographer/earnings/withdraw），成功后用返回的最新结算数据刷新页面、自动切到「提现记录」tab，申请进入平台审核流；提交中按钮禁用防重复。`,
    },
  ],
};
