import type { PageAnnotations } from './types';

/**
 * 找传记师页（/biographers）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const biographerListAnnotations: PageAnnotations = {
  page: 'biographer-list',
  pageName: '找传记师',
  route: '/biographers',
  items: [
    {
      id: 'biographer-list.search',
      target: '关键词搜索框',
      logic: `① 输入即过滤（前端本地过滤，不发请求）：匹配姓名、头衔、城市、专长、标签五个字段，大小写不敏感。
② 与城市、专长筛选叠加生效（三者取交集）。
③ 页面数据来自 mock 接口 biographerApi.list()（GET /api/biographers），进入页面时加载一次。`,
    },
    {
      id: 'biographer-list.filters',
      target: '专长 / 城市筛选',
      logic: `① 专长筛选：匹配 specialties 或 tags 任一字段包含所选值；「全部」不过滤。
② 城市筛选：匹配常驻城市 city 或服务范围 serviceAreas 包含所选城市；「全部」不过滤。
③ 两个下拉与关键词搜索共同作用于同一份列表，均为前端 useMemo 本地过滤。`,
    },
    {
      id: 'biographer-list.card',
      target: '传记师卡片',
      logic: `① 卡片信息：认证等级徽标（gold 金牌 / silver 银牌 / standard 平台认证），评分默认 5 分，好评率 = 评分 / 5 换算；无 tags 时回退展示 specialties 前三项。
② 价格取该传记师所有服务的最低价显示「¥X 起」，无服务时显示「价格面议」。
③ 点击卡片或「查看详情」按钮打开传记师详情弹窗（内嵌 BiographerProfile）；「查看详情」阻止事件冒泡，效果与点卡片一致。
④ 列表为空时显示空态引导；接口异常时降级为空列表。`,
    },
    {
      id: 'biographer-list.booking',
      target: '预约下单（详情弹窗内）',
      logic: `① 在弹窗中选择服务并提交预约表单后，先调 biographerApi.createOrder（POST /api/biographer-orders）创建订单，成功后自动调 paymentApi.pay 以微信渠道支付定金。
② 定金金额优先取传记师的 deposit 字段，缺省按服务价 30% 四舍五入计算，仅用于成功提示文案。
③ 下单期间显示「正在创建订单…」遮罩并禁用表单；任一步失败 toast 报错，成功后关闭弹窗。`,
    },
  ],
};
