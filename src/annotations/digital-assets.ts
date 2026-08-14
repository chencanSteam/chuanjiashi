import type { PageAnnotations } from './types';

/**
 * 数字资产页（/digital-assets）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const digitalAssetsAnnotations: PageAnnotations = {
  page: 'digital-assets',
  pageName: '数字资产',
  route: '/digital-assets',
  items: [
    {
      id: 'digital-assets.pdf',
      target: 'PDF 传记卡（打印 / 高级选项）',
      logic: `① 「查看 / 打印」跳转 /biography/print 打印预览页。
② 高级选项（添加水印 / 查看密码 / 防复制防编辑）实时持久化到 localStorage「cj_pdf_export_options」，导出 PDF 时应用。
③ 查看密码仅允许数字、最长 6 位；失焦时不足 4 位则提示「密码需为 4-6 位数字」并清空，合法则保存。
④ 勾进水印时即时预览水印文案「传家世 · 仅供留念」。`,
    },
    {
      id: 'digital-assets.epub',
      target: 'EPUB 电子书卡',
      logic: `① 「生成 EPUB」为 400ms 间隔的模拟进度，完成后按钮变为「下载 EPUB」。
② 下载时真实打包：读取当前档案（cj_current_archive_id）的传记数据「cj_biography_{id}」，无内容时回退「cj_biography_chapters_{id}」中已生成章节；仍为空则导出只含「前言」占位章的电子书。
③ 书名取档案主人姓名（cj_archives 中匹配），打包失败提示「EPUB 生成失败，请稍后重试」。`,
    },
    {
      id: 'digital-assets.hardcover',
      target: '精装书排版稿卡',
      logic: `① 「申请精装书制作」点击即视为提交申请，toast 提示客服将在 1 个工作日内联系；演示环境无实际表单与订单流转。`,
    },
    {
      id: 'digital-assets.video',
      target: '60 秒纪念短视频卡',
      logic: `① 生成流程与 EPUB 相同的模拟进度；完成后写入 localStorage「cj_memorial_video_status=done」，数字博物馆页据此展示视频已生成。
② 刷新页面若标记为 done 则直接显示「下载视频」；下载为演示 toast，不产出真实文件。`,
    },
    {
      id: 'digital-assets.qrcode',
      target: '码记二维码卡',
      logic: `① 「生成二维码」用 canvas 真实绘制 21×21 码点矩阵：由博物馆链接（当前站点 #/museum）哈希确定性生成，含三角定位框与定时图案，为占位图案非标准可扫二维码。
② 「高清下载」以 20 倍分辨率重绘并导出 PNG，完成后恢复预览分辨率；未生成二维码时按钮禁用。`,
    },
    {
      id: 'digital-assets.evidence',
      target: '区块链存证卡',
      logic: `① 存证哈希、存证时间、存证链（至信链）、状态为静态演示数据，卡片上哈希做截断展示（前 20 位…后 8 位）。
② 「查看存证」弹窗展示完整哈希与说明文案。`,
    },
  ],
};
