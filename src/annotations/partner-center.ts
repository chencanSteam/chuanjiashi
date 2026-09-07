import type { PageAnnotations } from './types';

/**
 * 合伙人中心页（/partner）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const partnerCenterAnnotations: PageAnnotations = {
  page: 'partner-center',
  pageName: '合伙人中心',
  route: '/partner',
  items: [
    {
      id: 'partner-center.apply-entry',
      target: '非合伙人空态 / 「申请成为合伙人」按钮',
      logic: `① 进入页面先调 partnerApi.me() 拉取当前账号的合伙人档案；请求失败或返回空 → 判定「还不是合伙人」，整页切换为空态，只展示申请入口。
② 点击按钮弹出申请弹窗，内嵌与 /partner/apply 页共用的 PartnerApplyForm 表单组件。
③ 表单提交成功后关闭弹窗并重新调 partnerApi.me()：此时账号已带合伙人身份，页面自动切换为完整的合伙人中心。`,
    },
    {
      id: 'partner-center.level-card',
      target: '合伙人等级卡片（等级 / 佣金比例 / 进度条）',
      logic: `① 等级名称、颜色、权益标签均按 partner.type 从 partnerTypeConfig 配置表读取（省级/市级/县级/邀请码合伙人）。
② 佣金比例优先取合伙人档案里的 commissionRate，未设置时回退到该等级的默认比例 rate。
③ 进度条按「累计收益 / 20000」计算占比，封顶 100%，用于演示升级进度。`,
    },
    {
      id: 'partner-center.local-share',
      target: '属地数据（负责属地 / 属地 GMV / 属地分成金额）',
      logic: `① 数据来自 partnerApi.localOrders() 拉取的属地订单列表。
② 属地 GMV 只统计有效订单：剔除待支付（pending_pay）、已退款（refunded）、已关闭（closed）三种状态后求和。
③ 属地分成金额 = 属地 GMV × 当前佣金比例（同样优先 commissionRate，回退等级默认 rate）；未划分区域时负责属地显示「未划分区域」。`,
    },
    {
      id: 'partner-center.invite',
      target: '我的邀请（邀请码 / 邀请链接 / 二维码）',
      logic: `① 邀请码由后端在合伙人审核通过时生成，存在档案 inviteCode 字段，全页只读。
② 邀请链接由前端按「当前域名 + #/login?invite=邀请码」拼接，新用户通过该链接注册即与合伙人建立绑定关系。
③ 「复制」按钮调浏览器剪贴板 API 写入邀请码/链接并 toast 提示；二维码为示意展示，扫码即访问同一邀请链接。`,
    },
    {
      id: 'partner-center.customers',
      target: '我的客户（搜索 / 列表 / 客户详情）',
      logic: `① 客户列表来自 partnerApi.customers()，均为通过邀请码或手动绑定到该合伙人的用户。
② 搜索框前端实时过滤：按用户 ID、姓名、手机号三者任一模糊匹配，空关键词显示全部。
③ 列表展示付费状态（已付费/已注册），已付费客户额外显示累计订单金额；点击客户弹出详情弹窗，含绑定方式（邀请码/手动绑定）、绑定时间等字段。`,
    },
    {
      id: 'partner-center.earnings',
      target: '收益明细（状态筛选 / 列表 / 收益详情）',
      logic: `① 收益记录来自 commissionApi.list()，每条对应一笔客户订单产生的佣金；订单类型会映射为业务类型标签（AI 采访/传记生成/数字人/会员订阅/印刷/其他）。
② 顶部「累计」为该合伙人全部记录的佣金总额，不随筛选变化。
③ 筛选下拉按结算状态过滤：全部 / 已结算 / 待结算 / 冻结中，纯前端过滤。
④ 点击单条记录弹出收益详情，佣金比例按「佣金 ÷ 订单金额」现场反算展示。`,
    },
    {
      id: 'partner-center.region',
      target: '区域分佣（地域合伙人）',
      logic: `① 与邀请分佣的区别：区域分佣不看邀请关系，只要下单用户属于该合伙人的区域（regionCode/regionName），其消费订单都按合伙人等级比例（省级 30% / 市级 25% / 县级 20%，见 partnerTypeConfig）计佣。
② 区域订单来自 partnerApi.localOrders()（GET /api/partner/local/orders）；统计卡展示区域订单总额、我的区域分佣（总额 × 比例）、区域订单数。
③ 明细表逐单展示下单用户、商品、订单金额、分佣比例、我的分佣（订单金额 × 比例实时计算）、订单状态与时间。`,
    },
    {
      id: 'partner-center.withdraw',
      target: '提现（金额输入 / 提交 / 提现记录）',
      logic: `① 可提现余额来自 commissionApi.summary() 的 settled 字段（已结算佣金）；「审核中」为状态 pending 的历史提现申请总额。
② 提交校验：金额必须为大于 0 的数字，且不得超过「可提现余额 − 审核中金额」（防止重复透支），不满足则拦截并提示。
③ 校验通过调 commissionApi.withdraw(amount) 创建申请，成功后清空输入框并重新拉取余额与提现记录。
④ 提现记录状态三态：待审核（pending）/ 已打款（paid）/ 已拒绝（rejected），各配图标展示。`,
    },
    {
      id: 'partner-center.assessment',
      target: '考核结算（GMV 档位 / 考核指标 / 分成发放记录）',
      logic: `① 数据来自 partnerApi.assessment()，拉取失败或为空时整页显示「暂无考核数据」。
② GMV 档位卡：完成率 = 已完成 GMV / 年度目标 GMV，封顶 100%；未达成时显示「距下一档位还差 ¥xx」，达成最高档位目标则显示已满级文案。
③ 考核指标表逐项计算完成率，完成率 ≥100% 进度条显示绿色，否则橙色。
④ 分成发放记录按结算周期列出，状态分为已发放（paid，带发放时间）/ 待发放。`,
    },
  ],
};
