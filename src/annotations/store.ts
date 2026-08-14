import type { PageAnnotations } from './types';

/**
 * 传家商城页（/store）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const storeAnnotations: PageAnnotations = {
  page: 'store',
  pageName: '传家商城',
  route: '/store',
  items: [
    {
      id: 'store.category-tabs',
      target: '商品分类筛选（含「实物商品」）',
      logic: `① 当前分类写入 URL 参数 category，刷新/分享链接后筛选状态保留；从档案入口带入的 archiveId 参数在切换分类时继续保留。
② 「实物商品」是组合筛选：实体书 + 衍生品两类需要收货地址的商品；其余分类按商品 type 精确匹配，「全部商品」不过滤。
③ 商品列表来自 productApi.list()；接口异常时降级为空列表，页面显示「暂无该类商品」。`,
    },
    {
      id: 'store.search-sort',
      target: '搜索框与排序下拉',
      logic: `① 搜索在商品名称、描述中做不区分大小写的包含匹配，前端本地过滤、实时生效，不调接口；出现 × 按钮可一键清空。
② 排序支持价格从低到高 / 从高到低，「默认排序」保持接口返回顺序；排序在分类与搜索筛选结果之上进行。`,
    },
    {
      id: 'store.product-list',
      target: '商品列表与商品卡片',
      logic: `① 点击卡片任意处进入商品详情页（/store/:id）；「立即购买」按钮阻止冒泡，直接在当前页弹出确认订单弹窗。
② HOT 角标：商品带 hot 标记或销量 ≥ 50 自动展示；存在原价且高于现价时自动计算并显示折扣百分比（x% OFF）。
③ 销量为空或为 0 时显示「新品上线」；权益点最多展示前 4 条。`,
    },
    {
      id: 'store.order-modal',
      target: '确认订单弹窗（地址 / 备注 / 支付）',
      logic: `① 实体书、衍生品必须填齐收件人、电话、省、市、详细地址，缺一拦截并提示「请填写完整收货地址」；数字类商品不显示地址区、下单不传 address。
② 联系电话自动带入登录账号手机号；上次成功下单的地址从 localStorage「cj_last_address」回填（不覆盖登录手机号），实体商品支付成功后回写该 key。
③ URL 带 archiveId 时弹窗显示「关联档案」及与本人关系，下单时随订单提交 archiveId（档案 → 商城导流场景）。
④ 支付流程：orderApi.create 创建订单 → paymentApi.pay（微信）→ 成功 toast 并跳转 /order-success?orderId=xx；任一步失败 toast 报错，支付中按钮禁用防重复提交。`,
    },
  ],
};
