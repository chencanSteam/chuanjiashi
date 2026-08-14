import type { PageAnnotations } from './types';

/**
 * 故事详情页（/family/story/:title）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const storyDetailAnnotations: PageAnnotations = {
  page: 'story-detail',
  pageName: '故事详情',
  route: '/family/story',
  items: [
    {
      id: 'story-detail.story-content',
      target: '故事内容区',
      logic: `① 按路由参数 :title（decodeURIComponent 解码）在内置 storyData 表中查找故事（标签、作者、日期、浏览量、点赞数、正文）。
② 未收录的标题走兜底数据：标签「家庭故事」、作者「张明远」、浏览量与点赞数均为 0、正文「暂无故事内容。」，页面仍可正常打开不报错。
③ 浏览量、点赞数、评论数均为静态展示值，进入页面不会真实累计浏览量。`,
    },
    {
      id: 'story-detail.like-btn',
      target: '「点赞」按钮',
      logic: `① 点击在「点赞 / 已点赞」间切换，点赞数同步 +1 / -1，按钮样式在主色与描边之间切换，并 toast 提示「点赞成功 / 已取消点赞」。
② 点赞状态仅存在组件内存，不调用接口、不写 localStorage，刷新即恢复。`,
    },
    {
      id: 'story-detail.share-btn',
      target: '「分享」按钮',
      logic: `① 点击把当前页面 URL（window.location.href）写入剪贴板并 toast 提示「分享链接已复制」。
② 剪贴板权限被拒时无异常兜底（原型未处理失败分支）。`,
    },
    {
      id: 'story-detail.comment-area',
      target: '评论区（发布 / 列表）',
      logic: `① 点「评论」按钮展开/收起输入框；支持回车或点击发送按钮提交。
② 空评论（仅空格）直接拦截不提交；提交成功后追加到评论列表、清空输入框并 toast 提示。
③ 评论列表初始带 2 条演示评论；新评论仅保存在组件内存，不持久化，刷新即丢失；评论数统计随列表长度实时变化。`,
    },
  ],
};
