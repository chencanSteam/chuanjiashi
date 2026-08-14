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
② 对话记录存储在 localStorage「cj_interview_transcript_mobile_{档案id}」（移动端独立 key）；旧数据没有 topicId 时按主题名（category）补挂到对应主题做兼容迁移。
③ 对话按主题隔离显示；新消息时自动滚动到底部。
④ 会话进度（当前主题/题目、已答/已跳过、延伸问题）存「cj_interview_session_{档案id}」，与 Web 端共用，刷新或中途退出不丢失。`,
    },
    {
      id: 'mobile-interview.input-bar',
      target: '回答输入与发送',
      logic: `① 输入为空（trim 后）时发送按钮禁用；支持回车发送。
② 发送后回答写入 localStorage「cj_interview_answers_{档案id}」，与 Web 端共用，Web 端生成传记可直接读取。
③ 自动定位下一道未回答问题（跨主题按顺序查找）并让 AI 发出；全部问题答完后发出完成提示，输入框与发送按钮置为「采访已完成」禁用态。`,
    },
    {
      id: 'mobile-interview.empty-state',
      target: '无档案空态',
      logic: `① 触发条件：localStorage 中没有「cj_current_archive_id」，或该 id 在「cj_archives」中匹配不到档案。
② 空态下不渲染采访界面，只提供「返回首页」（/m）入口，引导用户先创建/选择档案。`,
    },
  ],
};
