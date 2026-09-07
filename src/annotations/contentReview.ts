import type { PageAnnotations } from './types';

/**
 * 内容审核页（/admin/content-review/:section）的逻辑标注。
 * 审核模块拆为侧边栏独立菜单：传记内容审核 books / 素材审核 media / 退款审核 refunds；
 * 敏感词审核已独立为敏感词库（/admin/sensitive-words）与敏感词命中（/admin/sensitive-hits）两个页面。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const contentReviewAnnotations: PageAnnotations = {
  page: 'content-review',
  pageName: '内容审核',
  route: '/admin/content-review',
  items: [
    {
      id: 'content-review.book-review',
      target: '待审核公开传记（通过 / 驳回）',
      logic: `① 进入该标签页调 bookshelfApi.adminList({ status: 'pending' })（GET /api/admin/bookshelf）拉取待审核的公开传记。
② 通过 / 驳回均调 bookshelfApi.review（PUT /api/admin/bookshelf/:id/review），状态写为 approved / rejected；成功后 toast 提示并重新拉取列表，该传记从待审列表消失。
③ 接口异常时 toast 展示后端返回的错误信息，列表保持原状。`,
    },
    {
      id: 'content-review.media-review',
      target: '图片/音频素材审核',
      logic: `① contentReviewApi.mediaList()（GET /api/admin/content-review/media）拉取待审素材，图片与音频混排，按类型显示图标。
② 仅 status = pending 的素材显示「通过 / 驳回」按钮；点击调 reviewMedia（PATCH /api/admin/content-review/media/:id），用接口返回的更新对象局部替换列表项，不整表刷新。
③ 审核完成后按钮变为「已通过 / 已驳回」状态标签，不可重复操作。`,
    },
    {
      id: 'content-review.refund-review',
      target: '退款审核（通过 / 驳回）',
      logic: `① 进入该标签页调 orderApi.adminList（GET /api/admin/orders），前端筛出带 refundRequest 的订单，按申请时间倒序展示；状态筛选（全部 / 待审核 / 已驳回 / 已完成）为纯前端过滤。
② 「通过退款」需 confirm 二次确认，调 orderApi.adminApproveRefund，退款完成后订单状态变为已退款；「驳回」弹窗必须填写驳回原因，调 adminRejectRefund，客户可见该原因并可重新申请。
③ 与订单管理页的退款审核共用同一组接口，两处操作结果互通；操作成功后重新拉取列表。`,
    },
  ],
};
