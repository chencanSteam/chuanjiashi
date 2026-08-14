import type { PageAnnotations } from './types';

/**
 * 合伙人申请管理页（/admin/partner-applications）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const adminPartnerApplicationsAnnotations: PageAnnotations = {
  page: 'admin-partner-applications',
  pageName: '合伙人申请管理',
  route: '/admin/partner-applications',
  items: [
    {
      id: 'admin-partner-applications.filter',
      target: '搜索与状态筛选',
      logic: `① 搜索框匹配姓名、手机号、区域名，纯前端本地过滤，不调接口。
② 状态下拉：全部 / 待审核 / 已通过 / 已拒绝，与搜索关键词为「且」关系。`,
    },
    {
      id: 'admin-partner-applications.list',
      target: '申请列表',
      logic: `① 数据来自 partnerApi.adminApplications，卡片展示申请人、联系方式、申请区域、合伙人类型、申请理由与申请时间。
② 无匹配数据时显示「暂无申请记录」。
③ 每次审核操作后通过 refresh 计数器重新拉取全量列表，保证状态及时更新。`,
    },
    {
      id: 'admin-partner-applications.review',
      target: '通过 / 拒绝按钮',
      logic: `① 仅「待审核」状态的申请显示操作按钮，已处理的只读。
② 通过：申请置为 approved，同时按申请信息（类型、区域）为其生成合伙人账号；拒绝：置为 rejected，不生成账号。
③ 调 partnerApi.processApplication 后刷新列表，toast 提示处理结果；接口校验仅接受 approved / rejected 两种状态。`,
    },
  ],
};
