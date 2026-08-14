import type { PageAnnotations } from './types';

/**
 * 政务看板页（/government/dashboard）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const governmentDashboardAnnotations: PageAnnotations = {
  page: 'government-dashboard',
  pageName: '政务看板',
  route: '/government/dashboard',
  items: [
    {
      id: 'government-dashboard.back',
      target: '返回按钮',
      logic: `① 调用 navigate(-1) 回退浏览器历史栈上一页；直接从地址栏进入、无历史记录时点击无跳转效果。`,
    },
    {
      id: 'government-dashboard.stats',
      target: '统计卡片区',
      logic: `① 已办结 / 办理中 / 待补充 / 满意度四项为静态演示数据，各自带固定图标与主题色。
② 卡片仅展示，不可点击；正式版应由政务办件接口按状态聚合得出。`,
    },
    {
      id: 'government-dashboard.tasks',
      target: '办理进度列表',
      logic: `① 办件列表为静态演示数据；状态徽标按状态映射样式：已办结→done（绿）、办理中→progress（橙）、待补充→warn（红）。
② 点击办件行跳转 /government/application/:title（以办件标题作为路由参数，URL 编码）；详情页按参数匹配内置数据，匹配不到时回退到默认办件。`,
    },
  ],
};
