import type { PageAnnotations } from './types';

/**
 * 商品详情页（/store/:id）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const productDetailAnnotations: PageAnnotations = {
  page: 'product-detail',
  pageName: '商品详情',
  route: '/store',
  items: [
    {
      id: 'product-detail.buy-button',
      target: '「立即购买」按钮',
      logic: `① 点击弹出确认订单弹窗，不离开当前页。
② 商品加载中走 loading 分支、商品不存在走空态分支，两种情况下均不渲染此按钮。`,
    },
    {
      id: 'product-detail.reviews',
      target: '用户评价区（评分汇总 / 分布 / 列表）',
      logic: `① 评价来自 productApi.reviews(id)，与商品详情 productApi.get(id) 并行加载；平均分 = 全部评价算术平均并保留 1 位小数。
② 无真实订单评价时，接口按商品类型回退到预置演示评价（仅展示用）；有真实评价后演示数据自动不再出现。
③ 星级分布按 5 → 1 星统计条数，条形图宽度 = 该星数量 / 评价总数；列表按接口返回顺序逐条展示评分、内容与发表时间。`,
    },
    {
      id: 'product-detail.buy-modal',
      target: '确认订单弹窗（地址 / 备注 / 支付）',
      logic: `① 实体书、衍生品强制校验地址五要素（收件人 / 电话 / 省 / 市 / 详细地址），缺一拦截；数字类商品不显示地址区、下单不传 address。
② 联系电话自动带入登录账号手机号；上次地址从 localStorage「cj_last_address」回填，实体商品支付成功后回写该 key。
③ 支付流程：orderApi.create → paymentApi.pay（微信）→ 跳转 /order-success?orderId=xx；失败 toast 报错，支付中按钮禁用防重复提交。`,
    },
    {
      id: 'product-detail.not-found',
      target: '商品不存在空态',
      logic: `① productApi.get(id) 返回空或接口异常时进入该分支，提示「商品不存在或已下架」。
② 「返回商城」按钮跳转 /store 列表页。`,
    },
  ],
};
