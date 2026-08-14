import type { PageAnnotations } from './types';

/**
 * 事件详情页（/family/event/:title）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyEventDetailAnnotations: PageAnnotations = {
  page: 'family-event-detail',
  pageName: '事件详情',
  route: '/family/event',
  items: [
    {
      id: 'family-event-detail.event-info',
      target: '事件信息区（时间 / 地点 / 状态）',
      logic: `① 按路由参数 :title（decodeURIComponent 解码）在内置 eventData 表中查找事件（时间、地点、状态、描述、参与成员）。
② 未收录的标题走兜底数据：时间与地点显示「-」、状态显示「筹备中」、描述「暂无活动描述。」、参与成员为空。
③ 状态徽标按状态值变色：「进行中」绿色高亮、「已结束」置灰，其余状态无特殊样式。
④ 「活动议程」为所有事件共用的写死文案，不随事件变化。`,
    },
    {
      id: 'family-event-detail.attendees',
      target: '参与成员',
      logic: `① 成员列表来自 eventData 中该事件的 attendees 字段，逐个渲染头像与姓名；兜底事件的成员列表为空时整块只显示标题。
② 点击成员头像跳转成员详情页 /family/members/:name（姓名经 encodeURIComponent 编码后作为路由参数）。`,
    },
    {
      id: 'family-event-detail.join-btn',
      target: '「报名参加」按钮',
      logic: `① 点击后按钮文案变为「已报名」并置为 disabled，不可重复报名，同时 toast 提示「报名成功」。
② 报名状态仅存在组件内存，不写 localStorage、不影响参与成员列表，刷新即恢复。
③ 原型未做「已结束事件不可报名」的校验，任何状态下按钮都可点击。`,
    },
    {
      id: 'family-event-detail.remind-btn',
      target: '「设置提醒」按钮',
      logic: `① 点击后按钮文案变为「已设置提醒」并置为 disabled，同时 toast 提示「提醒已设置」。
② 提醒仅为前端状态演示，没有真实的推送/日历订阅逻辑，刷新即恢复。`,
    },
  ],
};
