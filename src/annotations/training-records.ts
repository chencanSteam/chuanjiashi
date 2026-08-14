import type { PageAnnotations } from './types';

/**
 * 训练记录页（/digital-person/training-records）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const trainingRecordsAnnotations: PageAnnotations = {
  page: 'training-records',
  pageName: '训练记录',
  route: '/digital-person/training-records',
  items: [
    {
      id: 'training-records.summary',
      target: '顶部训练统计卡',
      logic: `① 三项统计由记录列表实时计算：总训练次数 = 记录条数；累计时长 = 各条时长按 parseInt 取分钟数求和（非数字按 0 计）；已完成 = 状态为「已完成」的条数。
② 新建、继续完成、删除记录后统计自动重算。`,
    },
    {
      id: 'training-records.filter',
      target: '状态筛选（全部 / 已完成 / 训练中）',
      logic: `① 前端按记录的 status 字段过滤，「全部」不过滤。
② 当前筛选下无记录时，列表区显示「该分类下暂无训练记录」空态。`,
    },
    {
      id: 'training-records.new-training',
      target: '「新建训练」按钮',
      logic: `① 点击在列表顶部插入一条「新一轮人格综合训练」：状态「训练中」、进度 0、时长 0 分钟；2 秒后自动置为 100%「已完成」、时长 10 分钟。
② 训练进行中按钮禁用并显示「训练中…」，防止并发发起多轮训练。
③ 记录仅存于页面 state，刷新后恢复为 5 条默认演示数据。`,
    },
    {
      id: 'training-records.record-list',
      target: '训练记录列表（继续 / 删除）',
      logic: `① 状态为「训练中」的记录显示「继续」按钮：点击后 2 秒模拟训练完成，进度置 100%、状态转「已完成」、时长 +5 分钟；进行中的那条按钮显示加载图标并禁用。
② 垃圾桶图标直接删除该条记录（无二次确认，仅删当前页面 state）。
③ 状态徽标按「已完成 / 训练中」分别显示对勾图标与旋转加载图标。`,
    },
  ],
};
