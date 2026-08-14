import type { PageAnnotations } from './types';

/**
 * 提现审核页（/admin/withdrawals）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const withdrawalManagementAnnotations: PageAnnotations = {
  page: 'withdrawal-management',
  pageName: '提现审核',
  route: '/admin/withdrawals',
  items: [
    {
      id: 'withdrawal-management.stats',
      target: '统计卡（待审核 / 已打款 / 笔数）',
      logic: `① 待审核金额、已打款金额由当前全部提现记录按状态实时汇总，提现笔数为记录总数。
② 统计不受下方搜索/筛选影响，始终按全量数据计算。`,
    },
    {
      id: 'withdrawal-management.filter',
      target: '搜索与状态筛选',
      logic: `① 搜索框匹配合伙人姓名、合伙人ID，纯前端本地过滤。
② 状态下拉：全部 / 待审核 / 已通过 / 已打款 / 已拒绝，与搜索关键词为「且」关系。`,
    },
    {
      id: 'withdrawal-management.list',
      target: '提现记录列表',
      logic: `① 数据来自 commissionApi.adminWithdrawals，展示合伙人、提现金额、申请时间与状态。
② 提现金额来自合伙人可提现余额（佣金过 15 天冻结期后转入）。
③ 无匹配数据时显示「暂无提现记录」；每次审核操作后通过 refresh 计数器重拉列表。`,
    },
    {
      id: 'withdrawal-management.review',
      target: '确认打款 / 拒绝按钮',
      logic: `① 仅「待审核」状态的记录显示操作按钮，已处理的只读。
② 确认打款：状态直接置为 paid 并记录打款时间，同时扣减该合伙人的可提现余额（线下完成转账后点此按钮）。
③ 拒绝：状态置为 rejected，不发生余额变动。
④ 接口仅接受 approved / rejected / paid 三种状态流转，非法状态报错拦截。`,
    },
  ],
};
