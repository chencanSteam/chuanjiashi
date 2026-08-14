import type { PageAnnotations } from './types';

/**
 * 家庭事件页（/family/events）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyEventsAnnotations: PageAnnotations = {
  page: 'family-events',
  pageName: '家庭事件',
  route: '/family/events',
  items: [
    {
      id: 'family-events.back',
      target: '「返回」按钮',
      logic: `① 调用 navigate(-1) 回退浏览器历史上一页，不是固定跳回 /family。
② 边界：直接输入网址打开本页（无历史栈）时点击无反应。`,
    },
    {
      id: 'family-events.event-list',
      target: '全部活动列表',
      logic: `① 3 条活动为静态演示数据，无接口请求，也没有新增/编辑入口。
② 状态徽标样式规则：「进行中」高亮（active）、「已结束」置灰（ended）、「未开始」默认样式。
③ 点击活动行跳转活动详情页（/family/event/:title，title 经 encodeURIComponent 编码）。`,
    },
  ],
};
