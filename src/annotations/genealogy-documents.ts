import type { PageAnnotations } from './types';

/**
 * 家谱文献页（/genealogy/documents）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const genealogyDocumentsAnnotations: PageAnnotations = {
  page: 'genealogy-documents',
  pageName: '家谱文献',
  route: '/genealogy/documents',
  items: [
    {
      id: 'genealogy-documents.upload',
      target: '「上传文献」按钮',
      logic: `① 点击唤起系统文件选择（label 包裹隐藏的 file input）。
② 原型不做真实上传：选中文件后直接 Toast「文献上传成功」，列表不新增条目；正式版需校验格式与大小，上传后入库并刷新列表。`,
    },
    {
      id: 'genealogy-documents.search',
      target: '文献搜索',
      logic: `① 仅按文献名称做包含匹配，输入即实时过滤下方列表，不匹配年代、修谱人等其它字段。
② 清空搜索词即恢复全部 6 条演示数据。`,
    },
    {
      id: 'genealogy-documents.list',
      target: '文献列表（条目点击 / 预览弹窗）',
      logic: `① 点击文献条目打开预览弹窗，展示该文献的年代、修谱人、页数等元信息。
② 弹窗点击遮罩或「关闭」按钮关闭；点击弹窗内容区阻止冒泡，不会误关闭。
③ 预览为占位实现，正式版应接入文献扫描件在线预览。`,
    },
    {
      id: 'genealogy-documents.download',
      target: '文献「下载」按钮',
      logic: `① 阻止事件冒泡，点击下载不会触发条目的预览弹窗。
② 将该文献的标题、年代、修谱人、页数拼为 TXT 文本，经 Blob + a[download] 下载为「<标题>.txt」，完成后 Toast 提示（原型以文本代替真实文献文件）。`,
    },
  ],
};
