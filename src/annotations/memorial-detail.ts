import type { PageAnnotations } from './types';

/**
 * 数字纪念馆详情页（/family/memorial/:name）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const memorialDetailAnnotations: PageAnnotations = {
  page: 'memorial-detail',
  pageName: '纪念详情',
  route: '/family/memorial',
  items: [
    {
      id: 'memorial-detail.hero',
      target: '逝者信息卡（头像/称谓/生卒年）',
      logic: `① 按路由参数 name（decodeURIComponent 解码后）查静态纪念资料库，命中则展示称谓与生卒年（如 张志远 1920-1998）。
② 边界分支：查无此人时回退展示「家族先辈 / 暂无纪念资料」，不报错不 404；正式版应按逝者 id 从档案接口拉取。`,
    },
    {
      id: 'memorial-detail.photos',
      target: '纪念影像',
      logic: `① 演示版固定渲染 4 个占位影像位，点击任一打开预览弹窗（类型 photo，标题「纪念影像 N」）。
② 正式逻辑：读取该逝者的相册/影像列表，支持上传与删除，空列表时显示引导上传的空态。`,
    },
    {
      id: 'memorial-detail.articles',
      target: '纪念文章',
      logic: `① 演示版写死两篇（《怀念爷爷》《记忆中的奶奶》，含作者与日期），点击打开预览弹窗（类型 article）。
② 正式逻辑：拉取该逝者名下的缅怀文章列表，按发布时间倒序；家族成员可撰写，权限受角色控制。`,
    },
    {
      id: 'memorial-detail.actions',
      target: '献花缅怀 / 纪念音乐',
      logic: `① 献花：点击计数 +1 并 toast「已向 xx 献花」，当前仅内存计数、刷新归零；正式版应落库并防刷（每人每日限次）。
② 纪念音乐：Web Audio 现场合成的五声音阶旋律循环播放（每 1.4s 一个音，含低八度垫音），不依赖外部音频文件。
③ 再点暂停（suspend 音频上下文并清定时器）；离开页面时组件卸载自动停止，不会残留后台播放。`,
    },
    {
      id: 'memorial-detail.preview',
      target: '影像/文章预览弹窗',
      logic: `① 由纪念影像或纪念文章点击触发，按类型渲染：photo 显示占位图，article 显示正文段落。
② 关闭方式：点遮罩、点右上角 × 均可；点弹窗内容区不关闭（阻止冒泡）。
③ 演示版正文为占位文案，正式版加载完整图文并支持点赞/留言。`,
    },
  ],
};
