import type { PageAnnotations } from './types';

/**
 * 合伙人管理页（/admin/partners）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const adminPartnersAnnotations: PageAnnotations = {
  page: 'admin-partners',
  pageName: '合伙人管理',
  route: '/admin/partners',
  items: [
    {
      id: 'admin-partners.add-partner',
      target: '「新增合伙人」按钮',
      logic: `① 仅「合伙人列表」标签页显示，点击打开新增弹窗（与「编辑」共用同一弹窗，editing 置空即为新增模式）。
② 新增成功后系统为合伙人生成邀请码，用于客户绑定归属。`,
    },
    {
      id: 'admin-partners.tabs',
      target: '标签页（列表 / 费用 / 分成 / 奖励 / 考核）',
      logic: `① 五个标签：合伙人列表、费用记录、分成配置、奖励配置、考核管理。
② 合伙人列表进页面即加载（partnerApi.listPartners）；其余四个标签切到时才按需加载：adminFees / shareConfigs / rewardConfigs / adminAssessments。
③ 各接口失败时降级为空列表，页面不报错。`,
    },
    {
      id: 'admin-partners.list-filter',
      target: '搜索与类型筛选',
      logic: `① 搜索框匹配姓名、手机号、邀请码、区域名，纯前端本地过滤。
② 类型下拉：省级 / 市级 / 区县 / 邀请码合伙人，与搜索关键词为「且」关系。
③ 顶部统计卡（总数及各类型数量）按全量列表实时汇总，不受筛选影响。`,
    },
    {
      id: 'admin-partners.list-table',
      target: '合伙人列表与行操作',
      logic: `① 邀请码旁的分享按钮一键复制邀请码到剪贴板，用于客户填写/扫码绑定归属。
② 分佣列按 commissionRate × 100 取整显示百分比；累计收益为该合伙人名下分润汇总。
③ 编辑：回填数据打开表单弹窗；删除：二次确认后调 partnerApi.deletePartner，删除后不可恢复。`,
    },
    {
      id: 'admin-partners.fee-table',
      target: '费用记录',
      logic: `① 费用类型三类：区域授权费、SaaS 系统使用费、履约保证金。
② 状态分已缴纳 / 待缴纳 / 已退还；本页只读展示，缴费与退还动作由线下或其他流程触发后回写。`,
    },
    {
      id: 'admin-partners.share-config',
      target: '分成配置',
      logic: `① 按「区域 + 合伙人」维度配置分成比例，底层存 0-1 小数，界面显示为百分比。
② 点编辑弹出修改弹窗：比例非数字或超出 0-1 即拦截；保存调 partnerApi.updateShareConfig 后刷新列表。
③ 生效时间用于新旧比例切换：生效日之后的订单按新比例分润，之前的不追溯。`,
    },
    {
      id: 'admin-partners.reward-config',
      target: '奖励配置',
      logic: `① 奖励分市级扶持金、省级年度奖励两档，每档配置「档位条件 + 奖励金额 + 启停状态」。
② 编辑校验：档位条件必填、金额不得为负，不满足即拦截；保存调 partnerApi.updateRewardConfig。
③ 停用后该档位不再参与年度核算，历史已发放记录不受影响。`,
    },
    {
      id: 'admin-partners.partner-form',
      target: '新增 / 编辑合伙人弹窗',
      logic: `① 姓名、手机号必填，为空即拦截提示。
② 类型决定区域选择：邀请码合伙人无区域；省级固定浙江省；市级选择城市；区县级走城市-区县两级联动，切换城市时自动落到该城市第一个区县，避免残留旧城市编码。
③ 提交时按类型换算区域编码与名称（省级 330000、市级取城市码、区县级取区县码），调 createPartner / updatePartner 后刷新列表。
④ 分佣比例输入 0-1 小数（如 0.2 表示 20%）。`,
    },
  ],
};
