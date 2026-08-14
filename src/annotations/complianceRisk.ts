import type { PageAnnotations } from './types';

/**
 * 合规风控页（/admin/compliance）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const complianceRiskAnnotations: PageAnnotations = {
  page: 'compliance-risk',
  pageName: '合规风控',
  route: '/admin/compliance',
  items: [
    {
      id: 'compliance-risk.tabs',
      target: '合规风控标签页',
      logic: `① 三个标签页互斥切换，仅为前端状态，不跳转路由。
② 「授权记录」在切入标签或筛选条件变化时重新请求；「协议配置」「风险预警」在切入时各请求一次。
③ 请求失败统一降级为空列表，展示「暂无」占位，不报错中断。`,
    },
    {
      id: 'compliance-risk.record-filters',
      target: '授权记录筛选（类型 / 状态）',
      logic: `① 类型筛选：全部 / 传记公开授权 / 肖像授权 / 声音授权；状态筛选：全部 / 有效 / 已过期 / 已撤销。
② 任一下拉变更即调 complianceApi.records({ type, status })（GET /api/admin/compliance/records，带 query）重新查询，无需点确认按钮。
③ 两个筛选条件为「与」关系，同时生效。`,
    },
    {
      id: 'compliance-risk.record-list',
      target: '授权记录列表',
      logic: `① 展示授权类型、对象、授权人、授权时间、状态五列，授权类型带图标徽标。
② 状态徽标按 valid / expired / revoked 渲染不同样式：有效 / 已过期 / 已撤销。
③ 筛选后无记录时显示「暂无授权记录」占位。`,
    },
    {
      id: 'compliance-risk.agreements',
      target: '协议配置（查看协议全文）',
      logic: `① complianceApi.agreements()（GET /api/admin/compliance/agreements）拉取协议版本列表，含协议名称、版本号、更新时间。
② 「查看」打开弹窗展示该版本协议全文（content 按空行分段渲染）；点遮罩或右上角 × 关闭。
③ 协议为只读配置，本页不提供编辑 / 发布入口，版本由后台维护。`,
    },
    {
      id: 'compliance-risk.alerts',
      target: '分销合规提示 + 私单预警',
      logic: `① 顶部提示卡为静态规则说明：分销仅支持一级直推佣金，禁止多层级计酬与团队计酬；传记师订单须平台签约付款，引导线下私单将冻结佣金并终止合作。
② 私单预警列表调 complianceApi.alerts()（GET /api/admin/compliance/alerts）拉取，展示传记师、涉及客户、预警原因、风险等级（低 / 中 / 高）、状态与时间。
③ 状态仅 resolved 显示「已处理」，其余一律「待处理」；当前原型无处置操作入口。`,
    },
  ],
};
