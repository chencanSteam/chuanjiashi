import type { PageAnnotations } from './types';

/**
 * 老照片修复页（/photo-restore）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const photoRestoreAnnotations: PageAnnotations = {
  page: 'photo-restore',
  pageName: '老照片修复',
  route: '/photo-restore',
  items: [
    {
      id: 'photo-restore.upload',
      target: '上传区域（点击 / 拖拽上传）',
      logic: `① 支持点击唤起文件选择或拖拽文件到区域内上传，只取第一个文件。
② 校验：非图片类型（image/*）拦截并提示「请上传图片文件」；单张超过 20MB 拦截并提示。
③ 上传成功后用 FileReader 转成 dataURL 存入原图状态，同时清空已修复结果与选中的历史记录。`,
    },
    {
      id: 'photo-restore.preview',
      target: '修复预览（前后对比 / 进度）',
      logic: `① 未修复时只显示原图；修复完成后进入对比模式：鼠标在图上移动驱动分割线（0-100%），左侧 clip 出「修复前」，右侧显示「修复后」。
② 修复中显示模拟进度条：每 300ms 随机递增、封顶 90%，实际处理完成后跳 100%；下方 4 个步骤标签按进度阈值（22/44/66/88）依次点亮，纯前端演示，无真实任务状态。
③ 「重新上传」清空原图、修复结果与选中记录，回到上传区域。`,
    },
    {
      id: 'photo-restore.mode',
      target: '修复模式选择',
      logic: `① 四种模式：智能增强（亮度/对比度/饱和度）、去划痕（3x3 邻域均值去噪）、黑白上色（按亮度映射暖色调）、超清放大（分辨率 2 倍 + 锐化卷积），均为前端 Canvas 像素级模拟处理。
② 处理输出尺寸最长边限制 1200px（超清放大先翻倍再受限），导出 JPEG 质量 0.92。
③ 修复进行中模式置灰不可切换。`,
    },
    {
      id: 'photo-restore.actions',
      target: '开始修复 / 下载 / 保存到档案',
      logic: `① 「开始修复」：未上传图片时禁用（点击提示「请先上传老照片」）；完成后自动生成一条修复记录插入记录列表顶部并选中。
② 「下载修复图」「保存到档案」仅在已有修复结果时出现；下载通过 a 标签直接导出 dataURL。
③ 「保存到档案」：当前账号无任何人生档案时拦截并提示先创建档案，否则弹出保存弹窗。`,
    },
    {
      id: 'photo-restore.records',
      target: '修复记录（侧边栏）',
      logic: `① 记录持久化在 localStorage「cj_photo_restore_records」，最多保留 20 条（超出截断），刷新后仍在。
② 点击某条记录：回填原图、修复结果和所用模式到主区域，可直接再次下载。
③ 删除：仅删记录本身；若删除的是当前选中记录，主区域一并清空。`,
    },
    {
      id: 'photo-restore.save-modal',
      target: '保存到人生档案弹窗',
      logic: `① 档案下拉读取 localStorage「cj_archives」，默认选中当前档案（cj_current_archive_id，缺省取第一个）。
② 阶段下拉：优先取该档案时间轴事件（cj_events_{档案id}）生成的「年份·事件」选项，无事件时用默认 8 个阶段；选「自定义」时可手填，留空按「其他」保存。
③ 确认保存写入两处：修复图 dataURL 入「cj_restored_photos_{档案id}」（上限 50 条），同时在媒体库「cj_media_{档案id}」插入一条 image 记录（含文件名、日期、阶段）。
④ 校验：未选档案或文件名为空时「确认保存」禁用。`,
    },
  ],
};
