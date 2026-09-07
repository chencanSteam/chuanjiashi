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
      id: 'my-orders.stats',
      target: '订单统计卡片与刷新',
      logic: `① 统计全部 / 待支付 / 服务中 / 已完成四类数量，数据来自 orderApi.list() 当前账号普通订单（不含传记师订单）。
② 「刷新」按钮重新并行拉取普通订单、传记师订单、传记师信息三个接口；任一失败降级为空列表。`,
    },
    {
      id: 'my-orders.filters',
      target: '状态与类型筛选',
      logic: `① 类型筛选支持从 URL 参数 type 初始化（如从传记师页跳入 ?type=biographer_service），非法值回退「全部类型」。
② 类型为「传记师服务」时隐藏状态下拉，列表只显示传记师订单；传记师订单仅在「全部类型 / 传记师服务」下展示，不参与普通订单的状态筛选。`,
    },
    {
      id: 'my-orders.order-list',
      target: '订单卡片（倒计时 / 操作按钮 / 传记师订单）',
      logic: `① 待支付订单显示支付倒计时（按 expireAt 每秒刷新），过期后显示「已过期」并隐藏「去支付」按钮。
② 按钮可见性：去支付 = 待支付且未过期；申请退款 = 已支付或服务中；查看详情打开详情弹窗。
③ 去支付走 paymentApi.pay（微信），成功后跳转 /order-success?orderId=xx；支付中按钮禁用防重复。
④ 传记师订单卡片：状态七态（待预约采访 → 已预约采访 → 已提交初稿 → 修改中 → 已提交终稿 → 已完成 → 售后中）着色展示；服务进度按 4 个固定节点（预约采访 → 提交初稿 → 修改完善 → 交付定稿）的完成数计算百分比。`,
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
      logic: `① 退款原因由管理端配置的启用选项单选；选择「其他」时必须填写补充说明。
② 提交 orderApi.refund 后创建「待审核」申请，不改变订单原状态；后台审核通过后才完成退款，驳回时展示驳回原因并允许重新申请。
③ 退款记录保存选项文案快照，不受后续配置修改影响。`,
    },
  ],
};
