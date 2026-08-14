import type { PageAnnotations } from './types';

/** AI 使用情况页（/admin/ai-usage）的逻辑标注 */
export const aiUsageAnnotations: PageAnnotations = {
  page: 'ai-usage',
  pageName: 'AI使用情况',
  route: '/admin/ai-usage',
  items: [
    {
      id: 'ai-usage.overview',
      target: '平台 Token 总消耗卡',
      logic: `① 数据来自 quotaApi.adminSummary()，汇总全平台 Token 消耗与调用次数。
② 「较上周 +18.2%」为写死的演示数据，正式版需按周环比计算。
③ 加载失败 toast 提示并显示空态。`,
    },
    {
      id: 'ai-usage.stat-cards',
      target: '分类型 Token 统计卡',
      logic: `① 按业务类型拆分：传记生成 / 采访问题 / 数字人对话 / 追问互动，各自显示 Token 消耗与调用次数。
② 数字超过 1000 显示为 K、超过百万显示为 M（formatTokens）。
③ 各类型消耗与用户套餐额度共用同一套 quota 数据。`,
    },
    {
      id: 'ai-usage.user-rank',
      target: '用户 Token 使用排行',
      logic: `① 按用户累计 Token 降序排列，名次随数据变化。
② 每行的占比进度条 = 该用户 Token / 平台总 Token。
③ 含各业务类型分列与素材存储占用，用于运营识别重度用户与配额调整依据。`,
    },
  ],
};
