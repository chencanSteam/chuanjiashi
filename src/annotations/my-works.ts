import type { PageAnnotations } from './types';

/**
 * 我的传记页（/my-works）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const myWorksAnnotations: PageAnnotations = {
  page: 'my-works',
  pageName: '我的传记',
  route: '/my-works',
  items: [
    {
      id: 'my-works.new-biography',
      target: '「新建传记」按钮',
      logic: `① 跳转 /onboarding 建档流程；列表为空时空态区也提供同样的入口。
② 建档完成后新档案会出现在本列表，初始状态为「未开始」。`,
    },
    {
      id: 'my-works.work-status',
      target: '作品卡片（信息与状态）',
      logic: `① 列表数据 = mock 后端档案（archiveApi.list）与本地 cj_archives 合并去重；接口失败时只用本地数据。
② 状态统一为「进行中 / 已完成」：有已完成标记或历史非空传记快照为已完成，只有采访/档案过程数据为进行中。
③ 状态决定主操作按钮的文案与跳转目标（见操作区标注）。`,
    },
    {
      id: 'my-works.earnings',
      target: '收益数据（售出 / 单价 / 累计收益）',
      logic: `① 售出份数与单价为按作品 id 生成的稳定伪随机 mock 数据（同一作品刷新不变）。
② 已设置公开授权售价的作品，单价与累计收益改用创作者真实设置（cj_work_license_settings_\${id}）；免费作品显示「免费」。`,
    },
    {
      id: 'my-works.work-actions',
      target: '操作区（继续 / 上架 / 实体书 / 删除）',
      logic: `① 进行中显示「继续完成」，已完成显示只读「查看传记」；完成作品不再提供编辑或查看档案。
② 「上架」与公开授权合并为同一个发布弹窗，仅已完成作品可见；「制作实体书」同样仅已完成可用。
③ 「删除」二次确认后移除该档案及其全部关联 localStorage 数据；若删的是当前档案，则把 cj_current_archive_id 切到列表第一个。`,
    },
  ],
};
