import type { PageAnnotations } from './types';

/**
 * 内容审核页（/admin/content-review）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const contentReviewAnnotations: PageAnnotations = {
  page: 'content-review',
  pageName: '内容审核',
  route: '/admin/content-review',
  items: [
    {
      id: 'content-review.tabs',
      target: '审核分类标签页',
      logic: `① 五个标签页互斥切换，仅为前端状态，不跳转路由。
② 切到「公开传记审核 / 素材审核 / 举报管理 / 内容下架管理」时分别请求对应列表接口；「敏感词检测」用页面内置静态演示数据，不发请求。
③ 任一列表接口失败时降级为空列表，展示「暂无」占位，不报错中断。`,
    },
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
      id: 'content-review.sensitive-hits',
      target: '敏感词命中记录',
      logic: `① 当前为页面内置 mock 数据，仅展示敏感词、命中来源、上下文、命中时间，无人工处置入口。
② 正式逻辑：传记章节、数字馆留言、采访转写文本在发布 / 保存时过敏感词库，命中即记录并拦截展示，转人工复核后放行或处理。`,
    },
    {
      id: 'content-review.report-process',
      target: '举报管理（标记已处理）',
      logic: `① contentReviewApi.reportList()（GET /api/admin/content-review/reports）拉取用户举报，含举报人、被举报内容、原因、时间。
② status = pending 的举报显示「标记已处理」按钮；点击调 processReport（PATCH /api/admin/content-review/reports/:id，status = processed），用返回对象局部更新该行。
③ 处理后显示「已处理」标签，按钮消失，不可重复处理。`,
    },
    {
      id: 'content-review.offshelf-restore',
      target: '已下架内容（恢复上架）',
      logic: `① 进入该标签页调 bookshelfApi.adminList({ status: 'off_shelf' }) 拉取已下架传记。
② 「恢复上架」复用 bookshelfApi.review(id, 'approved')，将状态改回已上架；成功后 toast 提示并重新拉取下架列表，该条从列表消失。
③ 失败时 toast 错误信息，内容仍留在下架列表。`,
    },
  ],
};
