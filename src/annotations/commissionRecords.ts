import type { PageAnnotations } from './types';

/**
 * 分润管理页（/admin/commission-records）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const commissionRecordsAnnotations: PageAnnotations = {
  page: 'commission-records',
  pageName: '分润管理',
  route: '/admin/commission-records',
  items: [
    {
      id: 'commission-records.tabs',
      target: '标签页（流水 / 规则 / 服务商 / 对账 / 风控）',
      logic: `① 五个标签：分润流水、规则配置、服务商分成、财务对账、风控。
② 分润流水与规则配置走真实接口（commissionApi.adminList / rules）；服务商分成、财务对账、风控中的扣回记录当前为前端静态演示数据，正式版接对应后台接口。`,
    },
    {
      id: 'commission-records.flow-filter',
      target: '流水搜索与合伙人筛选',
      logic: `① 搜索框匹配订单号、客户ID，纯前端本地过滤。
② 合伙人下拉按 partnerId 过滤，与搜索关键词为「且」关系。
③ 上方统计（分佣总额、订单总额、流水笔数）按当前筛选结果实时汇总，会随筛选条件变化。`,
    },
    {
      id: 'commission-records.flow-table',
      target: '分润流水列表',
      logic: `① 每笔订单完成且归属明确后生成一条分润流水：订单金额 × 合伙人分佣比例 = 佣金。
② 合伙人列用 partnerId 联查合伙人列表，查不到显示「未知」；服务类型由订单类型映射（AI 采访 / 传记生成 / 数字人 / 会员订阅 / 实体书印刷等）。
③ 状态流转：订单完成 → 冻结中（15 天冻结期）→ 可结算 / 已提现；冻结期内退款或违规则佣金被扣回（见「风控」标签）。`,
    },
    {
      id: 'commission-records.rules-form',
      target: '分润规则配置',
      logic: `① 四项比例：直推佣金、平台毛利池、书架收益分配、传记师订单分润，均以百分比录入。
② 保存校验：任一项非数字或超出 0-100 即拦截提示。
③ 保存调 commissionApi.saveRules；规则变更只影响之后新产生的订单，历史流水不追溯。`,
    },
    {
      id: 'commission-records.partner-shares',
      target: '服务商分成核算',
      logic: `① 按周期核算三级服务商分成：县区服务商分成（按月）、市级扶持金（按季度）、省级年度奖励（按年）。
② 状态分「待核算 / 已发放」；当前为静态演示数据，正式版由结算引擎按 GMV 与分成配置自动生成。`,
    },
    {
      id: 'commission-records.reconcile',
      target: '财务对账（月度）',
      logic: `① 按月汇总：订单总额、分润总额、平台毛利（订单总额 − 分润总额）。
② 状态流转：待对账 → 对账中 → 已对账；当前为静态演示数据，正式版对接支付渠道账单自动核对。`,
    },
    {
      id: 'commission-records.risk',
      target: '佣金冻结与违规扣回',
      logic: `① 冻结规则：佣金自订单完成起冻结 15 天，冻结期内发生退款或违规则对应佣金被扣回；冻结期满且无售后纠纷的佣金自动转入可提现余额。
② 扣回记录展示对象、关联订单、扣回原因与金额；传记师私单引流等违规为全额扣回。
③ 当前列表为静态演示数据，正式版由风控/售后流程自动写入。`,
    },
  ],
};
