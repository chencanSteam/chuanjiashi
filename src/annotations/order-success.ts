import type { PageAnnotations } from './types';

/**
 * 下单成功页（/order-success）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const orderSuccessAnnotations: PageAnnotations = {
  page: 'order-success',
  pageName: '下单成功',
  route: '/order-success',
  items: [
    {
      id: 'order-success.order-info',
      target: '订单信息区',
      logic: `① 从 URL 参数 orderId 调 orderApi.get 拉取订单详情；加载中显示「加载订单信息…」。
② 无 orderId 或查询失败时不报错，只显示「已支付，等待商家履约」兜底状态。
③ 订单号支持一键复制到剪贴板，成功 toast 提示。`,
    },
    {
      id: 'order-success.tips',
      target: '履约提示',
      logic: `① 实体书 / 衍生品订单：提示 1-3 个工作日内发货，可在「我的订单」查看物流进度。
② 数字服务订单（二维码 / 数字人 / 传记服务等）：提示确认后生成，可在「我的订单」查看交付物。`,
    },
    {
      id: 'order-success.actions',
      target: '底部操作按钮',
      logic: `① 「查看我的订单」跳转 /my-orders，可继续查看支付状态与后续履约。
② 「返回首页」跳转 /home（商城已下线，原「继续逛逛」入口移除）。`,
    },
  ],
};
