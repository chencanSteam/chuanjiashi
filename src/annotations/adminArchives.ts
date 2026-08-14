import type { PageAnnotations } from './types';

/**
 * 人物档案管理（/admin/archives）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const adminArchivesAnnotations: PageAnnotations = {
  page: 'admin-archives',
  pageName: '人物档案管理',
  route: '/admin/archives',
  items: [
    {
      id: 'admin-archives.filters',
      target: '搜索与隐私筛选区',
      logic: `① 关键词（主人姓名、创建人）与隐私状态作为参数传给 adminArchiveApi.list，由 mock 后端过滤。
② 条件变化后 300ms 防抖再请求；接口失败时列表兜底为空，显示「暂无符合条件的档案」。
③ 隐私状态三档：私密 / 家人共享 / 公开，默认「全部」不过滤。`,
    },
    {
      id: 'admin-archives.archive-list',
      target: '档案列表',
      logic: `① 每行展示主人姓名、创建人、素材计数（图/音/文分列）、隐私状态、完整度与创建时间。
② 完整度进度条按数值分档配色：≥80% 绿色、≥50% 橙色、低于 50% 红色，宽度上限 100%。
③ 点击整行调用 adminArchiveApi.get(id) 打开详情抽屉，失败时 toast 报错。`,
    },
    {
      id: 'admin-archives.detail-drawer',
      target: '档案详情抽屉',
      logic: `① 只读展示档案基础信息（主人姓名、创建人、完整度、创建时间）与素材列表（图片/音频/文档数量）。
② 管理端仅查看不修改：档案内容的增删改仍归创建人在前台操作。
③ 点击遮罩或右上角 × 关闭抽屉。`,
    },
  ],
};
