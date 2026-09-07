import type { PageAnnotations } from './types';

/**
 * 敏感词库页（/admin/sensitive-words）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const sensitiveWordsAnnotations: PageAnnotations = {
  page: 'sensitive-words',
  pageName: '敏感词库',
  route: '/admin/sensitive-words',
  items: [
    {
      id: 'sensitive-words.filter',
      target: '词库筛选（分类 / 处置方式 / 状态 / 关键词）',
      logic: `① 页面加载时调 sensitiveWordsApi.list（GET /api/admin/sensitive-words）拉取词库，按更新时间倒序展示。
② 分类、处置方式、状态（启用/停用）下拉和关键词搜索均为纯前端本地过滤，不调接口；顶部统计卡（词库总数 / 启用中 / 直接拦截 / 转人工复核）由当前列表实时计算。
③ 操作列支持编辑、停用/启用、删除；停用/启用调 toggleStatus（PATCH .../status）后局部更新，删除需二次确认。`,
    },
    {
      id: 'sensitive-words.table',
      target: '敏感词列表',
      logic: `① 表格展示敏感词、分类、处置方式、状态、累计命中、更新时间与操作；分类与处置方式以中文徽标展示，自动替换类词条在处置方式下方显示替换文案。
② 数据存储在 localStorage（cj_mock_sensitive_words），首次访问时写入种子数据。
③ 筛选无结果时显示空态提示。`,
    },
    {
      id: 'sensitive-words.form',
      target: '新增敏感词（批量录入弹窗）',
      logic: `① 点击「新增敏感词」打开弹窗，textarea 支持批量录入：每行一个或用顿号、逗号分隔；提交时后端 trim、去空并与现有词（含本次批内）去重。
② 分类六选一；处置方式三选一（直接拦截=内容直接拦截不展示 / 转人工复核=内容标记后转人工复核 / 自动替换=自动替换为指定字符），选择自动替换时需填写替换文案（默认 **）。
③ 提交调 createBatch（POST /api/admin/sensitive-words），接口返回新增后的完整列表并整体刷新；编辑复用同一表单（单条），调 update（PUT .../:id）。`,
    },
  ],
};

/**
 * 敏感词命中页（/admin/sensitive-hits）的逻辑标注。
 */
export const sensitiveHitsAnnotations: PageAnnotations = {
  page: 'sensitive-hits',
  pageName: '敏感词命中',
  route: '/admin/sensitive-hits',
  items: [
    {
      id: 'sensitive-hits.filter',
      target: '命中筛选（状态 / 来源类型 / 关键词）',
      logic: `① 页面加载时调 sensitiveWordsApi.hitList（GET /api/admin/sensitive-hits）拉取命中记录，按命中时间倒序展示。
② 状态（待复核/已拦截/已放行）、来源类型（传记章节/数字馆留言/采访转写/用户评论）下拉和关键词搜索（匹配命中词/来源/上下文）均为纯前端本地过滤。
③ 顶部统计卡展示今日命中 / 待复核 / 已拦截 / 已放行，由当前列表实时计算。`,
    },
    {
      id: 'sensitive-hits.table',
      target: '敏感词命中记录与复核处置',
      logic: `① 表格展示命中词、分类、来源类型、来源内容、命中上下文（命中词红色加粗高亮）、提交用户、命中时间与状态徽标。
② 仅「待复核」记录显示操作：放行 / 拦截均需 confirm 二次确认，调 processHit（PATCH /api/admin/sensitive-hits/:id），写入处理人 id 与处理时间，成功后局部更新该行为对应状态；已处理记录操作列显示「已处理」。
③ 数据存储在 localStorage（cj_mock_sensitive_hits），首次访问时写入种子数据。`,
    },
  ],
};
