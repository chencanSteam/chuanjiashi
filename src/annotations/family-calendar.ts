import type { PageAnnotations } from './types';

/**
 * 家庭日历页（/family/calendar）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyCalendarAnnotations: PageAnnotations = {
  page: 'family-calendar',
  pageName: '家庭日历',
  route: '/family/calendar',
  items: [
    {
      id: 'family-calendar.month-nav',
      target: '月份切换',
      logic: `① 左右箭头切换月份（currentMonth ±1），初始固定为 2024 年 5 月，与真实当前日期无关。
② 切月后选中日重置为 1 日，并 toast 提示「上个月/下个月」。`,
    },
    {
      id: 'family-calendar.grid',
      target: '日历格子',
      logic: `① 按 currentMonth 计算当月天数与 1 号的星期偏移（周一起算），月初空白格补齐对齐。
② 点击日期选中并高亮；若当天有日程（仅匹配列表中第一条同日日程）则 toast 显示「N日：日程标题」，有日程的日期右下角显示圆点。`,
    },
    {
      id: 'family-calendar.event-list',
      target: '当月日程列表',
      logic: `① 列表展示全部日程，不按选中日期过滤；点击某条日程反向选中对应日期并高亮该条。
② 行尾 × 删除该条日程（stopPropagation 阻止冒泡触发选中），toast「已删除日程」。
③ 日程仅存内存 state，刷新页面还原为 5 条初始演示数据，不落库。`,
    },
    {
      id: 'family-calendar.add-form',
      target: '添加日程表单',
      logic: `① 点「添加日程」展开表单：日期（数字输入，min 1 / max 31）、标题、类型下拉（聚会/节日/生日/纪念日/其他）。
② 保存校验：标题 trim 后非空且日期为 1-31 的整数，否则拦截并 toast「请填写有效日期与标题」。
③ 校验通过后新日程按日期升序插入列表，表单重置并收起，toast「日程已添加」。`,
    },
  ],
};
