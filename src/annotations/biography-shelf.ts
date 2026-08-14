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
      target: '分类筛选',
      logic: `① 分类项由当前书籍数据的 category 字段动态去重生成，「全部」固定在最前；数据中没有分类的传记归入「其他」展示。
② 选中分类后仅显示该分类传记，与搜索关键词条件叠加。`,
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
② 未解锁时底部出现解锁条：需登录，点击走支付流程（bookshelfApi.unlock），支付中按钮禁用；成功后更新状态为已解锁并提示「支付成功，已解锁全本」，失败 toast 报错。`,
    },
    {
      id: 'biography-shelf.comments',
      target: '评论区',
      logic: `① 进入详情模式即加载该传记的评论列表（bookshelfApi.comments），失败降级为空列表。
② 发表评论需登录且内容非空：空内容拦截提示，提交中按钮禁用；成功后新评论插入列表最前并清空输入框。`,
    },
  ],
};
