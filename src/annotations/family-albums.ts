import type { PageAnnotations } from './types';

/**
 * 家庭相册页（/family/albums）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyAlbumsAnnotations: PageAnnotations = {
  page: 'family-albums',
  pageName: '家庭相册',
  route: '/family/albums',
  items: [
    {
      id: 'family-albums.back-btn',
      target: '「返回」按钮',
      logic: `① 调用 navigate(-1) 沿浏览器历史栈回退一页，不固定跳转目标。
② 若用户直接打开本页（无历史记录），点击不会有任何反应。`,
    },
    {
      id: 'family-albums.upload-btn',
      target: '「上传照片」按钮',
      logic: `① 点击触发隐藏的文件选择框（accept="image/*"，支持多选）。
② 仅处理图片类型文件；单张超过 2MB 的照片跳过并逐张 toast 提示「已超过 2MB，已跳过」。
③ 读取成功的照片转为 dataURL，统一追加写入「全部相册」，持久化到 localStorage 的 cj_album_photos（按相册名分桶存储）。
④ 全部处理完成后 toast 提示上传成功；选完文件后清空 input 值，保证重复选择同一文件仍能触发 onChange。`,
    },
    {
      id: 'family-albums.album-list',
      target: '相册列表（封面与张数）',
      logic: `① 6 个预设相册为前端写死的演示数据（标题 + 张数文案）。
② 渲染每个相册时实时读取 localStorage cj_album_photos 中该相册的上传照片：有照片则封面取第一张、张数显示「N张（含新上传）」；无照片则显示占位图标与预设张数。
③ 点击相册卡片跳转相册详情页 /family/album/:title（标题经 encodeURIComponent 编码后作为路由参数）。`,
    },
    {
      id: 'family-albums.uploaded-album',
      target: '「全部相册」入口',
      logic: `① 仅当本页上传过照片（「全部相册」桶非空）时才显示该入口，初始状态不渲染。
② 封面取最近一次上传的照片，张数显示实际上传数量。
③ 点击跳转 /family/album/全部相册，与预设相册共用同一个详情页。`,
    },
  ],
};
