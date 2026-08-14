import type { PageAnnotations } from './types';

/**
 * 移动端档案页（/m/archive）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const mobileArchiveAnnotations: PageAnnotations = {
  page: 'mobile-archive',
  pageName: '移动端档案',
  route: '/m/archive',
  items: [
    {
      id: 'mobile-archive.profile-card',
      target: '传主档案卡片',
      logic: `① 展示当前档案（localStorage「cj_current_archive_id」对应「cj_archives」中的记录）：姓名、出生年份、籍贯、职业、性别。
② 头像取姓名首字；性别缺失时显示「未知」。
③ 本页为只读展示，编辑入口在 Web 端人生档案页。`,
    },
    {
      id: 'mobile-archive.timeline',
      target: '人生时间轴',
      logic: `① 事件与 Web 端人生档案同源：通过 loadStoredEventsForArchive 读取 localStorage「cj_events_{档案id}」；默认档案（无 id 时）回退到张明远样例数据。
② 事件按年份升序排列；有结束年且与起始年不同的时间段事件显示为「起始年 - 结束年」区间。
③ 移动端只读；事件的新增、编辑、采访同步均在 Web 端完成。`,
    },
    {
      id: 'mobile-archive.no-events',
      target: '无事件空态',
      logic: `① 当前档案下没有任何时间轴事件时显示「还没有记录」。
② 引导路径：先去 AI 采访（/m/interview）积累素材，采访整理后事件会自动同步到时间轴。`,
    },
    {
      id: 'mobile-archive.no-archive',
      target: '无档案空态',
      logic: `① 触发条件：没有当前档案 id，或 id 在档案列表中匹配不到（数据被清空/损坏时解析失败同样走此分支）。
② 空态仅提示「暂无档案」，正式版应引导去创建档案。`,
    },
  ],
};
