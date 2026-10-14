import type { PageAnnotations } from './types';

/**
 * 我的订单页（/my-orders）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const myOrdersAnnotations: PageAnnotations = {
  page: 'my-orders',
  pageName: '我的订单',
  route: '/my-orders',
  items: [
    {
      id: 'my-orders.filters',
      target: '状态与类型筛选',
      logic: `① 类型筛选支持从 URL 参数 type 初始化（如从传记师页跳入 ?type=biographer_service），非法值回退「全部类型」。
② 状态与类型筛选在本页固定的 7 条演示订单上即时生效。`,
    },
    {
      id: 'my-orders.order-list',
      target: '统一订单表格',
      logic: `① 固定展示 5 条商品/服务订单和 2 条传记师订单，不读取当前账号或浏览器历史订单；按下单时间倒序排列。
② 查看详情展示对应演示订单；实体书可在本页模拟确认收货，已支付或服务中订单可模拟提交退款申请。操作结果仅保存在当前页面状态，刷新后恢复演示数据。`,
    },
    {
      id: 'my-orders.detail-modal',
      target: '订单详情弹窗',
      logic: `① 按订单字段分区展示：收货地址（仅实体订单）、物流信息（公司 / 运单号 / 发货时间）、交付物（PDF / 视频 / 二维码 / 链接 / 图片，可新窗口打开）、售后记录。
② 订单号支持一键复制；底部操作按钮规则与列表一致（待支付可立即支付、已支付/服务中可申请退款）。`,
    },
    {
      id: 'my-orders.refund-modal',
      target: '申请退款弹窗',
      logic: `① 使用本页固定的退款原因选项；选择「其他」时必须填写补充说明。
② 提交后在当前页面创建「待审核」演示记录，不改变订单原状态；刷新页面后恢复初始演示数据。`,
    },
  ],
};
