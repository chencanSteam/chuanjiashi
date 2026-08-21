import type { PageAnnotations } from './types';

/**
 * 移动端作品页（/m/works）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const mobileWorksAnnotations: PageAnnotations = {
  page: 'mobile-works',
  pageName: '移动端作品',
  route: '/m/works',
  items: [
    {
      id: 'mobile-works.work-list',
      target: '传记作品列表',
      logic: `① 作品列表与 Web 端「我的传记」完全一致：mock 档案（archiveApi.list）与本地档案（cj_archives）按 id 合并，状态由存储 key 推导（cj_events_*→已同步档案、cj_biography_*→已生成传记、cj_interview_transcript_*→采集中、cj_interview_outline_*→待采访、否则未开始）。
② 列表项显示作品名（xx的传记）、出生年、籍贯与状态；为空时显示空态（提示「完成 AI 采访后可生成传记」）。
③ 点击列表项弹出作品详情弹窗。`,
    },
    {
      id: 'mobile-works.detail-modal',
      target: '作品详情弹窗',
      logic: `① 展示作品名、传主、状态、创建时间（与 Web 端作品卡信息一致）。
② 创建时间按档案 createdAt 本地时间格式化显示，无 createdAt 显示「—」。`,
    },
    {
      id: 'mobile-works.view-biography',
      target: '「查看传记」按钮',
      logic: `① 关闭详情弹窗，把该作品设为当前档案（cj_current_archive_id）后按状态跳转（与 Web 端 openWork 一致）：未开始/待采访→/interview，采集中/已生成传记→/biography，其余→/archive。`,
    },
  ],
};
