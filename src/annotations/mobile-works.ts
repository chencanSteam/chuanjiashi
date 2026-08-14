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
      logic: `① 读取 localStorage「cj_mock_biographies」中的传记列表；为空或解析失败时显示空态（提示「完成 AI 采访后可生成传记」）。
② 列表项显示作品名、状态（final=已完成，其余=草稿）与章节数。
③ 点击列表项弹出作品详情弹窗。`,
    },
    {
      id: 'mobile-works.detail-modal',
      target: '作品详情弹窗',
      logic: `① 展示作品名、传主、进度、创建时间。
② 传主名按作品的 archiveId 到 localStorage「cj_archives」中反查，查不到显示「—」。
③ 进度计算规则：已完成=100%；草稿按章节数估算（章数 × 20%，下限 10%、上限 90%）。
④ 创建时间按本地时间格式化显示。`,
    },
    {
      id: 'mobile-works.view-biography',
      target: '「查看传记」按钮',
      logic: `① 关闭详情弹窗并跳转 Web 端传记页（/biography）——移动端不提供完整阅读排版，阅读与编辑在 Web 端完成。`,
    },
  ],
};
