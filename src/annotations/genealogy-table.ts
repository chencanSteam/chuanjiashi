import type { PageAnnotations } from './types';

/**
 * 家谱世系表页（/genealogy/table）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const genealogyTableAnnotations: PageAnnotations = {
  page: 'genealogy-table',
  pageName: '家谱世系表',
  route: '/genealogy/table',
  items: [
    {
      id: 'genealogy-table.back',
      target: '「返回」按钮',
      logic: `① 调用 navigate(-1) 回退浏览器历史上一条记录，通常返回「数字家谱」页；若直接打开本页则无上一页可退。`,
    },
    {
      id: 'genealogy-table.search',
      target: '姓名搜索',
      logic: `① 仅按「姓名」列做包含匹配，输入即实时过滤表格，不匹配世代、生卒年等其它列。
② 清空搜索词即恢复全量 17 条演示数据。`,
    },
    {
      id: 'genealogy-table.print',
      target: '「打印」按钮',
      logic: `① 直接调起浏览器打印（window.print），打印当前整页，无独立打印模板；正式版应提供适配纸张的世系表打印样式。`,
    },
    {
      id: 'genealogy-table.export',
      target: '「导出」按钮',
      logic: `① 导出内容为全量世系数据（非当前搜索筛选结果），拼为 CSV，含表头：世代、姓名、生卒年、配偶、子女数。
② 通过 Blob + a[download] 触发浏览器下载「世系表.csv」，完成后 Toast 提示。
③ CSV 未加 BOM，Excel 直接打开中文可能乱码，原型暂不处理。`,
    },
    {
      id: 'genealogy-table.table',
      target: '世系表（行点击 / 状态列）',
      logic: `① 点击任意行跳转成员详情页（/family/members/:name，姓名经 URL 编码作为路径参数）。
② 「状态」列由生卒年格式推导：形如「1860-1920」判为「已故」，形如「1942-」判为「健在」，已故行加样式标记。
③ 配偶、子女数等列直接展示演示数据，无编辑能力。`,
    },
  ],
};
