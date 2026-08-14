import type { PageAnnotations } from './types';

/**
 * 家风少年分类明细页（/family/child/:category）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyChildCategoryAnnotations: PageAnnotations = {
  page: 'family-child-category',
  pageName: '家风少年分类',
  route: '/family/child',
  items: [
    {
      id: 'family-child-category.back',
      target: '返回按钮 / 页面标题',
      logic: `① 返回固定跳转 /family/child（亲子成长档案列表页），不是浏览器历史回退。
② 标题与图标由路由参数 category 决定：growth=成长记录、study=学习档案、health=健康档案、hobby=兴趣特长。
③ 边界分支：category 参数缺失或不认识时，静默回退到 growth（成长记录），不报错。`,
    },
    {
      id: 'family-child-category.timeline',
      target: '分类时间轴列表',
      logic: `① 当前为演示数据：四个分类的事件清单写死在 categoryMeta 里，年份按「2010 + 序号×2」公式生成，不是真实数据。
② 正式逻辑：按「子女 + 分类」从档案读取成长事件，按时间正序渲染时间轴。
③ 每条记录应支持点开查看详情（图片、描述、来源），演示版暂为纯展示。`,
    },
  ],
};
