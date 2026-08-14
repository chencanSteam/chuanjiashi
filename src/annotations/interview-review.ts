import type { PageAnnotations } from './types';

/**
 * 采访整理页（/interview-review）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const interviewReviewAnnotations: PageAnnotations = {
  page: 'interview-review',
  pageName: '采访整理',
  route: '/interview-review',
  items: [
    {
      id: 'interview-review.generate-btn',
      target: '「去生成传记」按钮',
      logic: `① 页头与右侧栏底部各有一个入口，均直接跳转 /biography（AI传记生成）。
② 不强制要求事件全部确认；已确认事件已同步进人生档案时间轴，生成页按已确认大纲或默认章节结构生成。`,
    },
    {
      id: 'interview-review.summary-tabs',
      target: '采访摘要 / 采访详情 / 协作者补充',
      logic: `① 「摘要」：由 buildReviewData 基于采访回答一次性提炼的整段总结，只读。
② 「采访详情」：按「主题 → 问题」分组，合并本人回答（cj_interview_answers_\${archiveId}，无回答时回退 mock 答案）与协作者补充回答；无任何回答时显示空态。
③ 「协作者补充」：先按协作者统计补充条数，再列全部补充明细；被创建人作废的补充带「已作废」标记，不作为传记素材。`,
    },
    {
      id: 'interview-review.events',
      target: 'AI 抽取的人生事件',
      logic: `① 事件由 AI 从采访回答中抽取，持久化到 cj_review_events_\${archiveId}，刷新后保留确认/忽略/编辑结果。
② 「确认」：状态置 confirmed，并同步三处——familyApi.syncPlace（地点入档案）、familyApi.syncRelation（人物关系）、syncReviewEventToTimeline（写入人生档案时间轴）；同步失败不阻断状态变更。
③ 「编辑」保存后同样执行上述三处同步，并自动置为已确认。
④ 「忽略」仅改状态不参与同步；「加入素材」把事件 id 记入 cj_review_added_\${archiveId}，按钮变「已加入」不可重复点击。
⑤ 卡片头部「已确认/总数」实时统计。`,
    },
    {
      id: 'interview-review.side',
      target: '重点片段 / 待确认事实 / 素材来源',
      logic: `① 三栏均为 AI 提炼的只读内容，来自 buildReviewData，用于确认事件与生成传记前核对。
② 其中「重点片段」额外持久化到 cj_review_highlights_\${archiveId}。
③ 底部「生成传记」与页头入口一致，跳转 /biography。`,
    },
  ],
};
