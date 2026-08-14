import type { PageAnnotations } from './types';

/** 拼团管理页（/admin/group-buy）的逻辑标注 */
export const groupBuyManagementAnnotations: PageAnnotations = {
  page: 'group-buy-management',
  pageName: '拼团管理',
  route: '/admin/group-buy',
  items: [
    {
      id: 'group-buy-management.tabs',
      target: '标签页（规则配置 / 拼团订单 / 免单记录 / 退款处理）',
      logic: `① 四个 Tab 分别对应：活动规则、全部拼团记录、免单中奖名单、未成团退款处理。
② 数据来自 groupBuyApi（activity / records / rules）。`,
    },
    {
      id: 'group-buy-management.rules',
      target: '拼团规则表单',
      logic: `① 成团人数分首轮（6 人）与后续轮（5 人）；校验：成团人数 ≥ 2、拼团时限 ≥ 1 小时，否则拦截保存。
② 免单开关与免单名额按轮次配置；防刷：同一设备限开 1 团、同一手机号限参 1 次。
③ 保存后用户端开团规则即时生效（groupBuyApi.saveRules 后刷新活动信息）。`,
    },
    {
      id: 'group-buy-management.orders',
      target: '拼团订单列表',
      logic: `① 展示全部团：团长、进度（已拼/目标）、状态（拼团中 / 已成团 / 未成团）、成团截止时间。
② 状态由系统按「截止时间 + 人数是否达标」自动流转：到期未满员 → 未成团并触发退款。`,
    },
    {
      id: 'group-buy-management.free',
      target: '免单记录',
      logic: `① 从已成团的团中提取 isFree 成员生成名单（含是否团长、是否已退款）。
② 免单人由系统随机抽取并公示，免单款项原路退回。`,
    },
    {
      id: 'group-buy-management.refunds',
      target: '未成团退款处理',
      logic: `① 仅列出「未成团」的团及其成员的退款状态。
② 点击「确认退款」调用 groupBuyApi.confirmRefund()，标记该成员退款完成；正式版对接支付渠道原路退回。`,
    },
  ],
};
