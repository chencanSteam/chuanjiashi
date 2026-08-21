import type { PageAnnotations } from './types';

/**
 * 移动端采访页（/m/interview）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const mobileInterviewAnnotations: PageAnnotations = {
  page: 'mobile-interview',
  pageName: '移动端采访',
  route: '/m/interview',
  items: [
    {
      id: 'mobile-interview.archive-switch',
      target: '选择传记（切换档案）',
      logic: `① 下拉列出 localStorage「cj_archives」中的全部档案，当前选中项为「cj_current_archive_id」。
② 切换后写入新的「cj_current_archive_id」并整页刷新（window.location.reload），采访进度、回答、对话记录全部按新档案重新读取。
③ 右侧状态图标：全部问题答完显示绿色对勾，否则显示进行中图标。`,
    },
    {
      id: 'mobile-interview.topic-tabs',
      target: '采访主题切换',
      logic: `① 主题与 Web 端共用同一套 generateInterviewTopics（含后台配置主题、标签主题、自定义主题），按当前档案信息生成。
② 点击切换主题：对话区只显示该主题的问答；该主题没有任何历史对话时，AI 自动发出该主题第一道未回答的问题。
③ 切换主题会更新会话进度（当前主题/题目下标）并持久化。`,
    },
    {
      id: 'mobile-interview.chat',
      target: '采访对话区',
      logic: `① 首次进入且无历史记录时，自动写入欢迎语和当前问题；全部已完成则写入完成提示。
② 对话记录存储在 localStorage「cj_interview_transcript_{档案id}」，与 Web 端共用同一 key 与 TranscriptLine 结构（speaker/time/text），topicId/category 为移动端按主题分组的附加字段；旧版「cj_interview_transcript_mobile_{档案id}」数据在首次进入时一次性迁移并删除旧 key。
③ 对话按主题隔离显示；新消息时自动滚动到底部。
④ 会话进度（当前主题/题目、已答/已跳过、延伸问题）存「cj_interview_session_{档案id}」，与 Web 端共用，刷新或中途退出不丢失。`,
    },
    {
      id: 'mobile-interview.input-bar',
      target: '回答输入与发送',
      logic: `① 输入为空（trim 后）时发送按钮禁用；支持回车发送。
② 主问题首次回答前消耗 interviewQuestion 额度（quotaApi.consume），额度不足 toast 拦截且不保存，与 Web 端一致；回答写入 localStorage「cj_interview_answers_{档案id}」，与 Web 端共用。
③ 主问题回答后自动生成延伸问题（与 Web 端一致：followUpQuestionsPool 随机取题、每次最多 2 个、每题累计上限 3 个、消耗 followUp 额度）；AI 自动提出延伸问题，答完延伸问题后自动定位下一道未答主问题；全部答完发出完成提示并禁用输入。
④ 麦克风按钮为语音回答（与 Web 端一致）：浏览器支持 Web Speech API 时实时转写，不支持时回退模拟转写，转写文本填入输入框。`,
    },
    {
      id: 'mobile-interview.empty-state',
      target: '无档案空态',
      logic: `① 触发条件：localStorage 中没有「cj_current_archive_id」，或该 id 在「cj_archives」中匹配不到档案。
② 空态下不渲染采访界面，只提供「返回首页」（/m）入口，引导用户先创建/选择档案。`,
    },
  ],
};
