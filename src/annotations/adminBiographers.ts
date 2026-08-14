import type { PageAnnotations } from './types';

/**
 * 传记师管理页（/admin/biographers）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const adminBiographersAnnotations: PageAnnotations = {
  page: 'admin-biographers',
  pageName: '传记师管理',
  route: '/admin/biographers',
  items: [
    {
      id: 'admin-biographers.add-biographer',
      target: '「新增传记师」按钮',
      logic: `① 仅「传记师列表」标签页显示；切到「违规处罚」标签时同位置变为「新增处罚」按钮。
② 点击打开新增弹窗并重置为空表单（editing 置空），与「编辑」共用同一个弹窗组件。`,
    },
    {
      id: 'admin-biographers.tabs',
      target: '标签页（列表 / 押金 / 处罚）',
      logic: `① 三个标签：传记师列表、押金管理、违规处罚。
② 传记师列表进页面即加载（biographerApi.adminList）；押金、处罚数据切到对应标签时才按需拉取（biographerEarningsApi.adminDeposits / adminPenalties）。
③ 接口失败时降级为空列表，页面不报错。`,
    },
    {
      id: 'admin-biographers.list-filter',
      target: '搜索与状态筛选',
      logic: `① 搜索框匹配姓名、手机号、邮箱、简介，纯前端本地过滤，不调接口。
② 状态下拉：全部 / 已启用 / 待审核 / 已停用，与搜索关键词为「且」关系。
③ 上方统计卡（总数 / 已启用 / 待审核 / 已停用）由全量列表实时汇总，不受筛选条件影响。`,
    },
    {
      id: 'admin-biographers.list-table',
      target: '传记师列表与行操作',
      logic: `① 点击传记师姓名/头像区域，弹出该传记师的个人档案弹窗（BiographerProfile 嵌入模式）。
② 「待审核」状态的行额外显示审核通过 / 驳回按钮：通过直接生效；驳回弹出输入框要求填写驳回原因，取消输入则不操作；审核调 biographerApi.review 后刷新列表。
③ 编辑：回填数据打开同一表单弹窗；删除：二次确认后调 biographerApi.delete，删除后不可恢复。
④ 状态映射：底层数据 approved / suspended / rejected / pending 分别映射为页面的 已启用 / 已停用 / 待审核。`,
    },
    {
      id: 'admin-biographers.deposit-table',
      target: '押金管理列表',
      logic: `① 仅「已缴纳」状态的押金显示「退还押金」「扣除押金」按钮，已退还 / 已扣除的显示「已处理」、不可再操作。
② 两个操作都先弹 confirm 二次确认，确认后调 biographerEarningsApi.refundDeposit / deductDeposit 并刷新列表。
③ 扣除押金用于违规赔付等场景，与「违规处罚」中的扣款记录联动。`,
    },
    {
      id: 'admin-biographers.penalty-table',
      target: '违规处罚列表',
      logic: `① 数据来自 biographerEarningsApi.adminPenalties，切换到本标签时才加载。
② 扣款金额为 0 时显示「-」；状态 effective 显示「生效中」，其余显示「已撤销」。
③ 处罚登记入口为页面头部「新增处罚」按钮（仅此标签页显示），本列表只读。`,
    },
    {
      id: 'admin-biographers.penalty-form',
      target: '新增处罚弹窗',
      logic: `① 校验：传记师必选、处罚原因必填、扣款金额不得为负，任一不满足即拦截提示。
② 扣款金额填 0 表示不扣款，仅记录处罚（警告等）。
③ 提交调 biographerEarningsApi.createPenalty；金额大于 0 时同步扣减该传记师的可结算金额并写入其违规扣款记录。
④ 提交期间按钮禁用并显示「提交中…」，防止重复提交。`,
    },
    {
      id: 'admin-biographers.biographer-form',
      target: '新增 / 编辑传记师弹窗',
      logic: `① 姓名、手机号必填，为空即拦截提示；邮箱、简介等其余字段选填。
② 头像仅接受图片文件且不超过 2MB，超限拦截；上传后本地转 base64 预览，可更换或移除。
③ 专长标签：输入后回车或点「添加」录入，重复标签拦截，可逐个删除。
④ 新增 / 编辑分别调 biographerApi.create / update，成功后重新拉取列表并关闭弹窗；认证等级（金牌 / 银牌 / 标准）在列表姓名旁以徽章展示。`,
    },
  ],
};
