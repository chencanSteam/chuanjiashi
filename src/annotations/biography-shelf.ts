import type { PageAnnotations } from './types';

/**
 * 传记书架页（/biography-shelf，含 /biography-shelf/:id 详情模式）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const biographyShelfAnnotations: PageAnnotations = {
  page: 'biography-shelf',
  pageName: '传记书架',
  route: '/biography-shelf',
  items: [
    {
      id: 'biography-shelf.search',
      target: '搜索框',
      logic: `① 在传记标题、作者、简介中做不区分大小写的包含匹配，前端本地过滤、输入即生效，不调接口。
② 搜索结果与分类筛选叠加生效；无结果时显示空态。`,
    },
    {
      id: 'biography-shelf.categories',
      target: '行业 / 职业级联筛选',
      logic: `① 两个下拉级联：先选行业（data/occupations 的 industryOptions），再选该行业下的职业；未选行业时职业下拉禁用。
② 选了职业按 occupationTags 精确匹配；只选行业时匹配该行业下任一职业；与搜索关键词条件叠加。`,
    },
    {
      id: 'biography-shelf.hot-rank',
      target: '热度榜单',
      logic: `① 按「阅读数 + 点赞数」降序取前 5 名，仅在列表模式且数据加载完成后展示。
② 点击榜单条目跳转该传记详情页 /biography-shelf/:id。`,
    },
    {
      id: 'biography-shelf.book-cards',
      target: '传记卡片（点赞 / 收藏 / 进详情）',
      logic: `① 点击卡片进入详情页 /biography-shelf/:id；卡片上的点赞、收藏按钮阻止冒泡，不触发跳转。
② 点赞 / 收藏需登录，未登录 toast 提示「请先登录」；成功后用接口返回的最新计数原地更新卡片，不整页刷新。
③ 价格为 0 或标记免费的显示「免费」，否则显示 ¥ 价格。`,
    },
    {
      id: 'biography-shelf.detail-actions',
      target: '详情页操作（点赞 / 收藏 / 分享）',
      logic: `① 点赞、收藏规则同列表卡片：需登录，成功后更新详情页计数。
② 分享：拼接「当前域名 + #/biography-shelf/:id」链接写入剪贴板；剪贴板不可用时 toast 报错并展示完整链接供手动复制。`,
    },
    {
      id: 'biography-shelf.reader-unlock',
      target: '阅读区与付费解锁',
      logic: `① 免费（isFree 或价格为 0）或已解锁（unlocked）的传记显示全本内容；否则只显示试读内容 trialContent（无试读则回退为简介），标题随状态切换「全本阅读 / 前 N 字 · 免费试读」。
② 未解锁时底部出现解锁条：需登录，点击弹出「确认订单」弹窗（商品信息、金额、微信 / 支付宝支付方式二选一），确认支付后模拟支付耗时约 1.2s 再走解锁流程（bookshelfApi.unlock）；支付中按钮禁用，成功后关闭弹窗、更新状态为已解锁并提示「支付成功，已解锁全本」，失败 toast 报错。`,
    },
  ],
};
