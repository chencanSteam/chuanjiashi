import type { PageAnnotations } from './types';

/**
 * 总览看板（/admin/dashboard）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const adminDashboardAnnotations: PageAnnotations = {
  page: 'admin-dashboard',
  pageName: '总览看板',
  route: '/admin/dashboard',
  items: [
    {
      id: 'admin-dashboard.stats',
      target: '核心指标卡片区',
      logic: `① 进入页面时并行拉取 7 个 mock 接口（订单、用户、传记师、拼团、待审书籍、提现、合伙人申请），任一接口失败该项兜底为 0，不影响其他卡片。
② GMV 总额只统计状态为「已支付 / 配送中 / 已完成」的订单金额之和，待支付与已取消订单不计入。
③ 注册用户数、入驻传记师数取接口返回列表长度；进行中拼团数按拼团记录 status = pending 过滤统计。`,
    },
    {
      id: 'admin-dashboard.todo',
      target: '待办事项列表',
      logic: `① 四类待办分别按「待审核」状态过滤统计：传记师 status=pending、书籍审核 pending、提现 pending、合伙人申请 pending。
② 数量徽标仅在 count > 0 时显示，为 0 时只保留箭头。
③ 点击任意待办项跳转对应管理页（/admin/biographers、/admin/book-review、/admin/withdrawals、/admin/partner-applications）。`,
    },
    {
      id: 'admin-dashboard.trend',
      target: '近 6 个月 GMV / 订单趋势图',
      logic: `① 以当前月份为终点向前取 6 个自然月，按订单 createdAt 的「年-月」前缀分桶。
② GMV 曲线沿用指标卡口径（仅已支付/配送中/已完成订单金额），订单数曲线统计当月全部订单（含未支付）。
③ 双 Y 轴：左轴为 GMV 金额，右轴为订单数（整数刻度）；订单金额为 0 的月份曲线落 0 不断线。`,
    },
  ],
};
