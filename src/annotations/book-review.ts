import type { PageAnnotations } from './types';

/** 传记上架审核页（/admin/book-review）的逻辑标注 */
export const bookReviewAnnotations: PageAnnotations = {
  page: 'book-review',
  pageName: '传记上架审核',
  route: '/admin/book-review',
  items: [
    {
      id: 'book-review.stats',
      target: '顶部统计卡',
      logic: `① 统计基于全量列表（status=all 单独拉取），不随筛选条件变化。
② 分为：全部申请 / 待审核 / 已通过 / 已拒绝。`,
    },
    {
      id: 'book-review.filters',
      target: '搜索与状态筛选',
      logic: `① 关键字搜标题、作者；状态筛选：全部 / 待审核 / 已通过 / 已拒绝 / 已下架。
② 筛选条件变化即重新请求列表（bookshelfApi.adminList）。`,
    },
    {
      id: 'book-review.list',
      target: '申请列表与行操作',
      logic: `① 行操作按状态流转：待审核 → 通过 / 拒绝；已通过 → 下架；已下架 → 重新上架。
② 操作调用 bookshelfApi.review()，成功后刷新列表与统计。
③ 拒绝操作弹出原因填写框（见「拒绝上架弹窗」标注）。`,
    },
    {
      id: 'book-review.detail',
      target: '传记详情弹窗（含章节试读）',
      logic: `① 点击「详情」按 archiveId 拉取传记全文（biographyApi.get），按章节切换试读。
② 章节正文首行若与章节标题重复则自动剔除；字数为去空白统计。
③ 传记未生成内容时显示空态，提示先让作者完成生成再提交上架。`,
    },
    {
      id: 'book-review.reject-modal',
      target: '拒绝上架弹窗',
      logic: `① 拒绝原因选填，填写后随审核结果一并记录并反馈给作者。
② 确认拒绝后传记状态变为「已拒绝」，作者修改后可重新提交上架申请。`,
    },
  ],
};
