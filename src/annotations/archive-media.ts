import type { PageAnnotations } from './types';

/**
 * 媒体资料页（/archive/media）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const archiveMediaAnnotations: PageAnnotations = {
  page: 'archive-media',
  pageName: '媒体资料',
  route: '/archive/media',
  items: [
    {
      id: 'archive-media.upload',
      target: '「上传素材」按钮',
      logic: `① 观察者角色（cj_current_role = 观察者）隐藏上传与删除入口，仅可查看。
② 选择文件后按扩展名推断类型（图片 / 视频 / 音频 / 文档），以当天日期追加到素材列表并写入「cj_media_<archiveId>」；空列表时也提供上传入口。`,
    },
    {
      id: 'archive-media.filter-search',
      target: '搜索框与类型筛选',
      logic: `① 搜索按素材名称模糊匹配（不区分大小写），与类型筛选叠加生效，均为前端即时过滤。
② 当前档案 id 取自「cj_current_archive_id」，缺省为 default 演示档案。`,
    },
    {
      id: 'archive-media.grid',
      target: '素材网格（预览 / 下载 / 删除）',
      logic: `① 素材数据来自「cj_media_<archiveId>」（default 档案用内置演示素材），列表每次变更自动回写 localStorage。
② 点击素材打开预览弹窗；下载按钮为演示动作，仅 toast 提示「开始下载素材」。
③ 删除按钮仅非观察者可见，点击直接移除该素材（已阻止冒泡，不会触发预览）。`,
    },
    {
      id: 'archive-media.preview',
      target: '素材预览弹窗',
      logic: `① 按类型渲染：图片用生成的占位图，视频带占位海报无真实片源，音频用占位音源，文档仅显示图标。
② 点击遮罩或「关闭」按钮关闭弹窗。`,
    },
  ],
};
