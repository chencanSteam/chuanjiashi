import type { PageAnnotations } from './types';

/**
 * 用户端合伙人页（/my-partner）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const userPartnerAnnotations: PageAnnotations = {
  page: 'user-partner',
  pageName: '合伙人',
  route: '/my-partner',
  items: [
    {
      id: 'user-partner.profile-card',
      target: '合伙人信息卡',
      logic: `① 数据来自 partnerApi.me()（GET /api/partner/me），mock 端首次访问会为当前用户自动创建一个演示合伙人（默认邀请码合伙人，含余额与累计收益）。
② 卡片展示合伙人类型（省级/市级/县级/邀请码合伙人）、分成占比（commissionRate）与代理区域（regionName），左侧边条颜色随类型变化。`,
    },
    {
      id: 'user-partner.region-users',
      target: '区域内用户列表',
      logic: `① 数据来自 partnerApi.customers()（GET /api/partner/customers），mock 端为空时补 4 条演示客户。
② 展示用户、手机号、绑定方式（邀请码/区域自动/手动绑定）、累计消费、我的分成（累计消费 × 分成占比）与绑定时间。`,
    },
    {
      id: 'user-partner.stats',
      target: '累计奖励 / 可提余额',
      logic: `① 数据来自 commissionApi.summary()（GET /api/commissions/summary）：累计奖励=全部佣金流水合计；可提余额=已结算金额减去审核中的提现。`,
    },
    {
      id: 'user-partner.rewards',
      target: '奖励明细',
      logic: `① 数据来自 commissionApi.list()（GET /api/commissions），展示来源用户、订单号、订单金额、奖励金额、状态（结算中/已结算/冻结中/已扣除）与时间。`,
    },
    {
      id: 'user-partner.withdraw',
      target: '奖励提现',
      logic: `① 金额校验：为空或 ≤0、超过可提余额均拦截提示；提交调 commissionApi.withdraw（POST /api/withdrawals），状态为待审核，后台「提现审核」处理。
② 成功后清空输入并刷新页面数据；提现记录带状态（待审核/已通过/已驳回/已打款）与申请时间。`,
    },
  ],
};
