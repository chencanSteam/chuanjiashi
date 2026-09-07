import type { PageAnnotations } from './types';

/**
 * 传记修改（/biographer/works）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const biographerWorksAnnotations: PageAnnotations = {
  page: 'biographer-works',
  pageName: '传记修改',
  route: '/biographer/works',
  items: [
    {
      id: 'biographer-works.chapters',
      target: '章节目录（新增 / 排序 / 重命名 / 删除）',
      logic: `① 顶部下拉选择进行中的订单（已完成/售后订单不出现），每个订单对应一部传记，章节数据按订单存 localStorage（cj_biographer_work_<orderId>），首次打开按模板初始化示例章节。
② 章节操作：新增章节追加到末尾并自动选中；上移/下移调整顺序（首尾禁用）；重命名弹窗标题为空时拦截；删除需弹窗二次确认，删除后自动选中剩余第一章。
③ 章节状态自动判断：已完成=手动标记；有正文未标记=撰写中；无正文=未撰写。`,
    },
    {
      id: 'biographer-works.editor',
      target: '章节编辑区（编辑 / AI 润色 / 保存）',
      logic: `① 标题与正文即改即存（每次变更写入 localStorage），顶部实时显示本章字数与全书字数（按去空白字符统计）。
② 「AI 润色」为演示模拟：正文为空时拦截；否则延迟后对正文做保守的文字替换并更新章节，toast 提示为模拟润色；编辑正文会清除「已完成」标记，需重新手动标记。
③ 「保存」手动落盘并提示；「标记为已完成 / 取消完成标记」切换章节状态。`,
    },
  ],
};
