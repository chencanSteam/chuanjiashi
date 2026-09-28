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
      logic: `① 点击打开新增弹窗并重置为空表单（editing 置空），与「编辑」共用同一个弹窗组件。
② 既有传记师的主页审核、押金、违规处罚沿用原列表操作。
③ 入驻审核只更新本地 Enrollment。审核通过未付押金的申请保持待付押金；已付押金点击「生成账号」跳转本页并打开同一新增表单，自动回填资料，确认前不生成，取消不改变申请状态。生成账号仅保存本地 accountProfile，不创建用户、不调用开户接口、不修改登录角色。`,
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
      logic: `① 列表为共享 admin-table 普通表格；点击传记师姓名/头像区域，弹出该传记师的个人档案弹窗（BiographerProfile 嵌入模式）。
② 「待审核」状态的行额外显示「通过 / 驳回」文字操作：通过直接生效；驳回弹出输入框要求填写驳回原因，取消输入则不操作；审核调 biographerApi.review 后刷新列表。
③ 主页审核并入列表：主页修改待审核（profileReviewStatus 为 pending）的行，状态列显示「主页待审核」徽标，操作列出现「主页审核」文字按钮，点击弹出主页预览并可通过 / 驳回（驳回必须填写原因）。
④ 押金并入列表行操作：按传记师匹配押金记录，「已缴纳」显示「退押」「扣押」文字按钮（二次确认后调 refundDeposit / deductDeposit 并刷新），已退还 / 已扣除的显示对应文字、不可再操作。
⑤ 违规处罚并入列表行操作：点击「处罚」打开处罚弹窗并预选该传记师，弹窗顶部展示其历史处罚记录。
⑥ 编辑：回填数据打开同一表单弹窗；停用需二次确认，停用后显示启用。已生成的本地账号（含旧版已开通记录）复用常规行的列格式、认证徽章、年限和操作，编辑及启停只保存本地 Enrollment；点击其姓名打开编辑表单。
⑦ 状态映射：底层数据 approved / suspended / rejected / pending 分别映射为页面的 已启用 / 已停用 / 待审核。`,
    },
    {
      id: 'admin-biographers.penalty-form',
      target: '新增处罚弹窗',
      logic: `① 从列表行「违规处罚」按钮进入，打开时已预选该传记师，弹窗顶部列出其历史处罚记录。
② 校验：传记师必选、处罚原因必填、扣款金额不得为负，任一不满足即拦截提示。
③ 扣款金额填 0 表示不扣款，仅记录处罚（警告等）。
④ 提交调 biographerEarningsApi.createPenalty；金额大于 0 时同步扣减该传记师的可结算金额并写入其违规扣款记录。
⑤ 提交期间按钮禁用并显示「提交中…」，防止重复提交。`,
    },
    {
      id: 'admin-biographers.biographer-form',
      target: '新增 / 编辑传记师弹窗',
      logic: `① 姓名、手机号必填，为空即拦截提示；邮箱、简介等其余字段选填。
② 头像仅接受图片文件且不超过 2MB，超限拦截；上传后本地转 base64 预览，可更换或移除。
③ 表单字段：头像、姓名、手机号、邮箱、从业年限、状态、认证等级、个人简介；申请的专长数据随回填保留，从业年限以数字展示。
④ 原有手工新增 / 编辑分别调 biographerApi.create / update；申请生成与本地账号编辑复用同一表单但只写本地 Enrollment。认证等级（金牌 / 银牌 / 标准）在列表姓名旁以徽章展示。`,
    },
  ],
};
