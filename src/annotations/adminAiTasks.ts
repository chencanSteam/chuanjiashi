import type { PageAnnotations } from './types';

/**
 * AI任务管理（/admin/ai-tasks）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const adminAiTasksAnnotations: PageAnnotations = {
  page: 'admin-ai-tasks',
  pageName: 'AI任务管理',
  route: '/admin/ai-tasks',
  items: [
    {
      id: 'admin-ai-tasks.tabs',
      target: '「任务队列 / Token 成本」页签',
      logic: `① 切到「任务队列」时按当前类型筛选调 aiTaskApi.list；切到「Token 成本」时拉取全部任务用于汇总统计。
② 两个页签都会先过滤掉历史遗留的非大模型任务（如二维码生成），只保留传记生成/数字人/短视频/PDF 排版四类。
③ 接口失败时对应区域兜底为空态。`,
    },
    {
      id: 'admin-ai-tasks.type-filter',
      target: '任务类型筛选',
      logic: `① 仅作用于「任务队列」页签，类型作为参数传给 aiTaskApi.list，切换即重新加载。
② 选项固定四类大模型任务：传记生成、数字人、短视频、PDF 排版，默认「全部类型」。`,
    },
    {
      id: 'admin-ai-tasks.task-list',
      target: '任务队列表格',
      logic: `① 每行展示发起用户（昵称 + 手机号）、任务类型、使用模型、Token 消耗、耗时与创建时间。
② 使用模型：任务未记录模型时按类型兜底显示默认模型（演示数据，如传记生成 → Kimi K2）。
③ 耗时 = 完成时间 - 创建时间；未完成的任务显示「-」，不足 1 分钟显示「不足 1 分钟」。
④ 失败任务在用户列下方红字展示失败原因（failReason）。`,
    },
    {
      id: 'admin-ai-tasks.token-type-stats',
      target: '按类型汇总 Token',
      logic: `① 基于全部任务（不受队列页类型筛选影响）按任务类型分组累加 Token 消耗。
② 同类型下使用过的多个模型以「、」拼接展示；按总消耗从高到低排序。`,
    },
    {
      id: 'admin-ai-tasks.token-user-stats',
      target: '按用户汇总 Token',
      logic: `① 以用户手机号为 key 分组，累加该用户全部任务的 Token 消耗，并归集其使用过的任务类型与模型。
② 按总消耗从高到低排序，用于识别高成本用户；无数据时显示空态。`,
    },
  ],
};
