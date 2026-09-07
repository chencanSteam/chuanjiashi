import type { PageAnnotations } from './types';

/**
 * 传记师订单（/biographer/orders）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const biographerOrdersAnnotations: PageAnnotations = {
  page: 'biographer-orders',
  pageName: '传记师订单',
  route: '/biographer/orders',
  items: [
    {
      id: 'biographer-orders.stats',
      target: '订单统计卡片区',
      logic: `① 数据来自 biographerApi.myOrders()（GET /api/biographer/orders），接口失败时订单列表降级为空数组，统计全部为 0。
② 统计口径：进行中=状态非「已完成」的全部订单；已完成=状态为 completed 的订单；累计金额=全部订单 amount 求和。
③ 每次完成节点操作（推进进度/预约采访）后都会重新拉取订单列表，统计随订单状态实时刷新。`,
    },
    {
      id: 'biographer-orders.order-status',
      target: '订单状态标签',
      logic: `① 订单状态共 7 种：待预约采访/已预约采访/已提交初稿/修改中/已提交终稿/已完成/售后中，由 statusMap 统一映射文案与颜色。
② 已预约采访的订单在列表中展示采访时间与地点（order.schedule.time / address），未预约的显示「待安排」。`,
    },
    {
      id: 'biographer-orders.progress',
      target: '服务进度条',
      logic: `① 服务流程固定 4 个节点：预约采访 → 提交初稿 → 修改完善 → 交付定稿（传记订单为全额支付，无定金/尾款环节）。
② 进度百分比 = order.progress 中 status=done 的节点数 ÷ 4；节点数据由后端（原型 mock）随订单维护。`,
    },
    {
      id: 'biographer-orders.next-action',
      target: '下一步操作按钮',
      logic: `① 取 order.progress 中第一个 status=pending 的节点作为当前待办，按钮文案随节点变化（如「预约采访时间」「提交初稿」「交付定稿」）；全部节点完成时显示「—」。每行另有「详情」按钮，弹出订单详情（基础信息 + 各节点完成时间）。
② 除「预约采访」外，点击先弹确认框，确认后调 biographerApi.updateProgress(orderId, 节点名) 推进流程并刷新列表；「预约采访」需先在弹窗中填写时间与地点。
③ 请求处理中按钮置灰禁用，防止重复提交。`,
    },
    {
      id: 'biographer-orders.schedule-modal',
      target: '预约采访弹窗',
      logic: `① 采访时间与采访地点均为必填，任一为空「确认预约」按钮禁用。
② 提交调 biographerApi.scheduleInterview(orderId, { time, address })，成功后关闭弹窗并刷新列表，订单状态流转为「已预约采访」。
③ 点击遮罩或右上角关闭按钮放弃预约，不写入任何数据；再次打开时会回显已保存的预约信息。`,
    },
  ],
};
