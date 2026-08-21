import type { PageAnnotations } from './types';

/**
 * 订单管理页（/admin/orders）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const orderManagementAnnotations: PageAnnotations = {
  page: 'order-management',
  pageName: '订单管理',
  route: '/admin/orders',
  items: [
    {
      id: 'order-management.supplement',
      target: '「手动补单」按钮',
      logic: `① 用于线下收款等场景补录订单；用户必选（选项取自订单中已出现过的客户）、金额必须大于 0，否则拦截并提示。
② 提交调用 orderApi.adminCreate（POST /api/admin/orders），mock 端再次校验用户与金额后创建订单。
③ 补单创建后直接为「已支付」状态并写入支付时间；商品名称不填时默认为「手动补单」。`,
    },
    {
      id: 'order-management.stats',
      target: '顶部统计卡片',
      logic: `① 基于当前订单列表前端实时计算：订单总数、订单总额（全部订单金额合计）。
② 实收金额只统计「已支付 / 服务中 / 已完成」三种状态；待支付卡片统计待支付订单数量。`,
    },
    {
      id: 'order-management.filters',
      target: '搜索框与状态/类型筛选',
      logic: `① 关键字同时匹配订单号、商品名称、客户姓名、客户手机号（纯前端过滤，不走接口）。
② 状态、类型两个下拉与关键字为「与」关系，三个条件同时生效。
③ 进入页面调用 orderApi.adminList（GET /api/admin/orders）加载列表，mock 端会先自动关闭已超时的待支付订单（pending_pay → closed）再返回；订单数据存于 localStorage 的 cj_mock_orders。`,
    },
    {
      id: 'order-management.batch',
      target: '批量发货 / 批量上传交付物',
      logic: `① 勾选订单后才出现批量操作栏；「批量发货」仅对勾选中「已支付」的实体订单（实体书/衍生品）生效，「批量上传交付物」仅对「已支付」的数字订单（二维码/视频/数字人/传记）生效。
② 批量发货：物流公司必填，运单号由系统自动生成（SF + 时间戳），逐单调用 adminDeliver，订单进入「服务中」。
③ 批量上传交付物：名称与链接必填，所有选中订单写入同一条交付物，paid 状态的订单随之进入「服务中」。`,
    },
    {
      id: 'order-management.row-actions',
      target: '订单行操作按钮（状态流转）',
      logic: `① 按「状态 + 类型」动态出按钮：已支付的实体订单出「发货」（物流公司、运单号必填，订单转服务中）；已支付的数字订单出「上传交付物」（名称、链接必填）；已支付的传记师服务/团购出「开始服务」。
② 待支付订单只能「关闭订单」；服务中还可「完成服务」。退款不再是通用状态流转。
③ 客户提交退款后，订单行展示「退款待审核」；后台通过专用审核接口 approve 才将申请标记完成并把订单改为已退款，驳回必须填写原因且保留原订单状态。`,
    },
    {
      id: 'order-management.detail',
      target: '订单详情弹窗',
      logic: `① 点击「详情」打开弹窗，展示订单基础信息，并按订单数据条件展示收货地址、物流信息、交付物、用户评价四个区块（无数据不渲染）。
② 类型为「传记师服务」时额外调用 biographerApi.adminGetBiographerOrderByOrderId 拉取关联的传记师订单，展示定金金额、采访安排和服务进度节点；查不到时显示「未找到关联的传记师订单」。
③ 交付物「查看」直接新窗口打开链接。`,
    },
    {
      id: 'order-management.review-audit',
      target: '用户评价审核（通过 / 驳回）',
      logic: `① 订单存在用户评价时展示评分与内容，并带「待审核/已通过/已驳回」状态徽标。
② 仅待审核状态出现「通过 / 驳回」按钮，点击调用 adminAuditReview（PUT /api/admin/orders/:id/review）改写评价状态。
③ 只有「已通过」的评价才会出现在 C 端商品详情页的评价列表中。`,
    },
  ],
};
