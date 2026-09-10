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
      target: '「去生成初稿」按钮',
      logic: `① 页头与右侧栏底部各有一个入口，均直接跳转 /biography（AI传记生成）。
② 不强制要求事件全部确认；已确认事件已同步进人生档案时间轴，生成页按已确认大纲或默认章节结构生成。`,
    },
    {
      id: 'interview-review.records',
      target: '采访记录列表',
      logic: `① 读取当前档案的创建者和协作者 transcript（cj_interview_transcript_<archiveId>[_<respondentId>])，列表只显示被采访人、关系、采访时间和对话条数。
② 没有 transcript 但有采访回答时，根据题目与答案生成可读的回退记录；完全没有数据时显示空态并提供返回 AI 智能采访入口。
③ 点击记录打开详情弹窗，完整展示 AI 提问和被采访人回答；回答行提供「修改」入口，编辑后写回对应逐字稿（cj_interview_transcript_<archiveId>[_<respondentId>]），回退记录（由回答生成）不可编辑；协作者记录的回答另有「废弃/取消废弃」，废弃标注存于逐字稿行上（行内删除线置灰 + 「已废弃」标签），不作为传记参考。`,
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
