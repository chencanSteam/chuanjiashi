import type { PageAnnotations } from './types';

/**
 * 传记大纲页（/biography/outline）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const biographyOutlineAnnotations: PageAnnotations = {
  page: 'biography-outline',
  pageName: '传记大纲',
  route: '/biography/outline',
  items: [
    {
      id: 'biography-outline.rebuild',
      target: '「AI 重新规划」按钮',
      logic: `① 点击先弹确认框：AI 将基于当前已确认的时间轴素材重新规划大纲，现有编辑会被覆盖。
② 确认后 buildDraftOutline 重新生成草案，状态回到草稿并标记「有未确认的修改」，必须重新「确认大纲」才会生效。`,
    },
    {
      id: 'biography-outline.confirm',
      target: '「确认大纲」按钮',
      logic: `① 校验：存在未命名章节（标题为空）时拦截并提示。
② 通过后版本号 +1、状态置 confirmed、按档案写入 localStorage（saveOutline）。
③ 已确认的大纲决定 /biography 生成传记的章节结构：生成页检测到大纲升版会按新大纲重建章节目录（同名章节保留内容）。
④ 确认后再做任何修改都会标记「有未确认的修改」，需再次确认生成新版本。`,
    },
    {
      id: 'biography-outline.status-bar',
      target: '大纲状态栏',
      logic: `① 徽标两态：「已确认 · vN」或「草稿」；确认后又有改动时草稿态追加「（有未确认的修改）」。
② 右侧统计章节数、时间轴素材总数与待分配条数；有待分配素材时数字高亮警示。
③ 素材来自人生档案时间轴（loadTimelineEvents，按当前档案读取）。`,
    },
    {
      id: 'biography-outline.chapters',
      target: '章节列表（改名 / 主旨 / 排序 / 增删）',
      logic: `① 每章可改名称、填写本章主旨（AI 生成正文时作为写作指引）、上移/下移、删除；删除章节后其关联素材自动退回待分配池。
② 「添加章节」固定插入在最后一章（后记）之前。
③ 所有修改只改内存草稿：已确认大纲会被标记为「有未确认的修改」（dirty），不自动保存，必须点「确认大纲」才生效。`,
    },
    {
      id: 'biography-outline.pool',
      target: '待分配素材池',
      logic: `① 列出尚未分配到任何章节的时间轴素材（按事件标题比对得出）。
② 通过下拉把素材分配到指定章节，分配后立即从池中消失；章节内点素材上的 × 可移回池中。
③ 全部素材分配完后整个卡片不再渲染。`,
    },
  ],
};
