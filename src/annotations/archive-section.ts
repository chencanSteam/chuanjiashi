import type { PageAnnotations } from './types';

/**
 * 档案子页（/archive，动态 section：completeness / events / members）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const archiveSectionAnnotations: PageAnnotations = {
  page: 'archive-section',
  pageName: '档案子页',
  route: '/archive',
  items: [
    {
      id: 'archive-section.routing',
      target: '子页内容与数据加载',
      logic: `① 页面按路由参数 section 渲染三类内容：completeness（档案完整度）、events（关键事件）、members（授权成员），未匹配时回退「档案完整度」。
② 数据按 section 存「cj_archive_sub_<section>」；读取时与内置初始项按 label 对齐合并，避免历史数据结构变更后错位。`,
    },
    {
      id: 'archive-section.completeness',
      target: '完整度滑块',
      logic: `① 仅 completeness 子页显示；拖动滑块即更新该模块百分比（0-100）。
② 每次变更实时写入「cj_archive_sub_completeness」，刷新后保留。`,
    },
    {
      id: 'archive-section.events',
      target: '关键事件条目',
      logic: `① 仅 events 子页显示；点击条目跳转「/archive/event/<年份>/edit」编辑对应事件。
② 年份取自条目标题首段（如「1958 出生」取 1958）。`,
    },
    {
      id: 'archive-section.members',
      target: '成员角色下拉',
      logic: `① 仅 members 子页显示；切换角色（家主 / 管理员 / 编辑者 / 观察者）即时写入「cj_archive_sub_members」并 toast 确认。
② 「查看」按钮跳转家庭成员详情「/family/members/<姓名>」。`,
    },
    {
      id: 'archive-section.save',
      target: '「保存完整度」按钮',
      logic: `① 仅 completeness 子页显示。
② 数据在拖动滑块时已实时持久化，此按钮为演示确认动作，点击仅 toast 提示「完整度已保存」。`,
    },
  ],
};
