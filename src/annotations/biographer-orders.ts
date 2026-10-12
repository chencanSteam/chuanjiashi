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
      id: 'biographer-orders.service-orders',
      target: '传记师服务订单列表',
      logic: `① 页面只保留一套订单：传记师服务订单（共享组件 BiographerServiceOrders，role=biographer），与用户端「我的订单」、后台「订单管理」、传记师「结算提现」读写同一份 localStorage 数据（cj_biographer_service_orders_v1），一处操作处处同步。
② 传记师只能看到 biographerPhone 与当前登录手机号一致的订单；列表支持按订单号/人物/套餐搜索与按服务状态筛选。
③ 首次打开且无任何历史数据时自动注入 3 笔演示订单（待接单 / 服务中 / 已完成），可演示确认接单、提交稿件、客户验收、平台结算、退款/平台介入全流程；点「查看服务订单」打开详情弹窗操作。`,
    },
  ],
};
