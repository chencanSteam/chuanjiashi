import type { PageAnnotations } from './types';

/**
 * 客户归属管理页（/admin/partner-customers）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const adminPartnerCustomersAnnotations: PageAnnotations = {
  page: 'admin-partner-customers',
  pageName: '客户归属',
  route: '/admin/partner-customers',
  items: [
    {
      id: 'admin-partner-customers.bind-form',
      target: '手动绑定表单（合伙人 / 客户信息）',
      logic: `① 合伙人下拉来自 partnerApi.listPartners 全量列表，选项附带合伙人类型（省级 / 市级 / 区县 / 邀请码）。
② 「客户ID/手机号」必填，「客户姓名」选填（留空则不写入）。
③ 同手动绑定外，客户归属还可由邀请码绑定、区域自动归属两种方式产生（见下方列表「绑定方式」列）。`,
    },
    {
      id: 'admin-partner-customers.bind-action',
      target: '「绑定」按钮',
      logic: `① 前端先校验：未选合伙人或未填客户ID即拦截提示。
② 后端二次校验：合伙人不存在、该客户已归属此合伙人，分别报错拦截。
③ 成功后写入一条 bindType 为 manual、未付费、累计订单为 0 的归属记录，清空输入框并刷新列表。`,
    },
    {
      id: 'admin-partner-customers.filter',
      target: '搜索与合伙人筛选',
      logic: `① 搜索框匹配客户ID、客户姓名、手机号，纯前端本地过滤。
② 合伙人下拉按归属合伙人过滤，与搜索关键词为「且」关系；选「全部合伙人」不过滤。`,
    },
    {
      id: 'admin-partner-customers.list',
      target: '客户归属列表',
      logic: `① 归属记录来自 partnerApi.adminCustomers；归属合伙人列用 partnerId 在合伙人列表中联查，查不到时显示「未知」。
② 绑定方式三类：邀请码（客户注册时填写邀请码）、区域自动（按客户所在区域自动归属该区域合伙人）、手动（上方表单登记）。
③ 付费状态与累计订单金额反映该客户的消费情况，是分润结算的依据。
④ 每次绑定操作后通过 refresh 计数器同时重拉客户与合伙人列表。`,
    },
  ],
};
