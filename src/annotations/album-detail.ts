import type { PageAnnotations } from './types';

/**
 * 相册详情页（/family/album/:title）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const albumDetailAnnotations: PageAnnotations = {
  page: 'album-detail',
  pageName: '相册详情',
  route: '/family/album',
  items: [
    {
      id: 'album-detail.album-meta',
      target: '相册信息（标题 / 张数 / 日期）',
      logic: `① 相册标题取自路由参数 :title（decodeURIComponent 解码）。
② 描述、日期等元数据从内置 albumMeta 表按标题查找；未收录的相册走兜底文案（「若干张 / - / 家庭相册精选。」）。
③ 张数优先显示实际上传数量「N张（已上传）」；该相册没有上传照片时显示 albumMeta 中的预设张数。`,
    },
    {
      id: 'album-detail.share-btn',
      target: '「分享」按钮',
      logic: `① 点击弹出分享弹窗，展示按相册标题拼出的固定分享链接（https://chuanjiashi.cn/album/:title）。
② 「复制链接」调用 navigator.clipboard 写入剪贴板并 toast 提示；剪贴板权限被拒绝时无额外兜底（原型未处理异常分支）。
③ 点击遮罩或 × 关闭弹窗，点击弹窗内容不关闭（stopPropagation）。`,
    },
    {
      id: 'album-detail.upload-btn',
      target: '「上传」按钮',
      logic: `① 点击弹出上传弹窗，选择图片（多选）后需再点「开始上传」才真正写入；未选择文件直接点上传会被拦截并提示「请先选择照片」。
② 单张超过 2MB 的照片跳过并逐张提示；其余照片转 dataURL 追加到当前相册，持久化到 localStorage cj_album_photos（按相册名分桶）。
③ 上传完成后自动关闭弹窗、清空待传文件并 toast 提示成功。`,
    },
    {
      id: 'album-detail.photo-grid',
      target: '照片网格（预览 / 下载）',
      logic: `① 有已上传照片时只渲染真实照片；没有上传照片时渲染 12 张占位演示卡片（标题为「相册名 + 序号」，日期为写死的演示数据）。
② 点击照片卡片打开大图预览：真实照片显示原图并提供「下载」按钮；占位卡片仅显示图标与标题。
③ 每张真实照片右下角的下载按钮调用 downloadDataUrl 触发浏览器下载（文件名 = 原始文件名），点击时已 stopPropagation，不会触发预览。
④ 预览层点击遮罩或 × 关闭。`,
    },
  ],
};
