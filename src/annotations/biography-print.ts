import type { PageAnnotations } from './types';

/**
 * 传记印刷页（/biography/print）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const biographyPrintAnnotations: PageAnnotations = {
  page: 'biography-print',
  pageName: '传记印刷',
  route: '/biography/print',
  items: [
    {
      id: 'biography-print.print',
      target: '「打印 / 另存为 PDF」按钮',
      logic: `① 调用浏览器 window.print()，在系统打印对话框中可选择「另存为 PDF」。
② 顶部工具栏与空态提示带 no-print 类，不会进入打印稿，只输出书本内容。`,
    },
    {
      id: 'biography-print.download-pdf',
      target: '「下载 PDF」按钮',
      logic: `① 动态加载 html2pdf.js，把整本书的 DOM（bookRef）按 A4 纵向渲染为 PDF 下载，文件名取传记标题。
② 生成期间按钮禁用并显示「生成中…」；生成失败时 toast 引导改用打印功能。`,
    },
    {
      id: 'biography-print.order',
      target: '「下单印刷实体书」按钮',
      logic: `① 跳转 /store?category=book&archiveId={当前档案 id}，进入商城实体书下单流程并携带档案上下文。`,
    },
    {
      id: 'biography-print.book',
      target: '书本预览（封面 / 扉页 / 目录 / 章节 / 封底）',
      logic: `① 数据优先级：先读 cj_biography_\${archiveId}（「保存到我的传记」的快照），没有则回退读章节草稿 cj_biography_chapters_\${archiveId}；两者皆无有效内容时显示空态并引导去 /biography 生成。
② 结构固定为 封面 → 版权/扉页 → 目录 → 各章节 → 封底；封面与扉页取档案的籍贯、出生年份与成书时间。
③ 章节正文自动识别格式：含 HTML 标签按富文本渲染，否则按纯文本逐行分段。`,
    },
  ],
};
