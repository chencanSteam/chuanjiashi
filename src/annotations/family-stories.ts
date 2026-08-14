import type { PageAnnotations } from './types';

/**
 * 家风故事列表页（/family/stories）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyStoriesAnnotations: PageAnnotations = {
  page: 'family-stories',
  pageName: '家风故事',
  route: '/family/stories',
  items: [
    {
      id: 'family-stories.back-btn',
      target: '「返回」按钮',
      logic: `① 调用 navigate(-1) 沿浏览器历史栈回退一页，不固定跳转目标。
② 若用户直接打开本页（无历史记录），点击不会有任何反应。`,
    },
    {
      id: 'family-stories.filter-tabs',
      target: '故事分类筛选',
      logic: `① 筛选项为写死的 6 类：全部 / 家风家训 / 创业历程 / 家庭教育 / 成长故事 / 生活故事，默认「全部」。
② 切换后按故事的 tag 字段精确匹配过滤列表；「全部」不过滤。
③ 纯前端本地状态过滤，不发请求、不持久化，刷新后回到「全部」。`,
    },
    {
      id: 'family-stories.story-list',
      target: '故事列表',
      logic: `① 列表数据为前端写死的 5 条演示故事（标题、标签、作者、相对时间、浏览量、点赞数）。
② 点击整行跳转故事详情页 /family/story/:title（标题经 encodeURIComponent 编码后作为路由参数），详情页按标题匹配内容。`,
    },
    {
      id: 'family-stories.like-btn',
      target: '「点赞」按钮',
      logic: `① 点击切换点赞状态：未点赞 → 已点赞（点赞数 +1），再点取消（点赞数 -1），图标高亮同步切换。
② 点击时已 stopPropagation，不会触发整行跳转详情页。
③ 点赞记录仅保存在组件内存（Set），不落库、不写 localStorage，刷新页面即丢失。`,
    },
  ],
};
