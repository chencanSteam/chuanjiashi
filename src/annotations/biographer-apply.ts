import type { PageAnnotations } from './types';

/**
 * 入驻认证（传记师端 /biographer/apply；用户端独立申请页 /biographer-apply，同一组件 standalone 模式多一个「返回首页」按钮）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const biographerApplyAnnotations: PageAnnotations = {
  page: 'biographer-apply',
  pageName: '入驻认证',
  route: '/biographer/apply',
  items: [
    {
      id: 'biographer-apply.form',
      target: '实名信息表单',
      logic: `① 提交前前端逐项校验：真实姓名必填；身份证号须为 15 位或 18 位（末位可为 X/x）；手机号须为 1 开头 11 位；服务城市必填。
② 任一校验不通过即拦截提交并 toast 提示，不发起任何请求。
③ 身份证号、手机号输入框分别限制最大长度 18 / 11。`,
    },
    {
      id: 'biographer-apply.specialties',
      target: '擅长领域选择',
      logic: `① 8 个预设领域（人物传记、家族史、企业家传记等）点击切换选中态，多选。
② 至少选择 1 个才能提交申请，未选择时提交被拦截并提示。
③ 选中项作为 specialties 数组随申请一并提交（biographerApi.apply）。`,
    },
    {
      id: 'biographer-apply.upload',
      target: '资质资料上传',
      logic: `① 支持图片 / PDF 多选，单个文件超过 5MB 直接跳过并 toast 提示「超过 5MB，已跳过」。
② 图片用 FileReader 转 base64 本地预览，PDF 显示文件图标；已选文件可逐个删除。
③ 注意：原型中附件仅存于页面内存，提交申请时不随表单上传（仅提交姓名/证件/城市/领域），刷新即丢失——正式版需接入文件上传并在审核记录中可查。`,
    },
    {
      id: 'biographer-apply.deposit',
      target: '押金缴纳',
      logic: `① 入驻押金 ¥500，点击调 biographerApi.payDeposit()（POST /api/biographer/deposit）模拟支付，成功后显示「已缴纳」。
② 未缴纳押金时提交申请会被拦截，提示「请先缴纳入驻押金」。
③ 缴纳状态与申请状态一起由 biographerApi.applyStatus() 读取，刷新后保留；押金托管与退还/扣除规则见结算与管理端。`,
    },
    {
      id: 'biographer-apply.submit',
      target: '「提交入驻申请」按钮',
      logic: `① 依次校验：实名信息四项 → 擅长领域 ≥1 → 押金已缴纳，全部通过后调 biographerApi.apply()（POST /api/biographer/apply）提交。
② 成功后刷新状态，整页切换为「审核中」视图，进入平台审核流程；提交中按钮禁用防重复。
③ 提交失败（如已有待审核申请）toast 展示接口返回的错误信息。`,
    },
    {
      id: 'biographer-apply.status',
      target: '审核状态卡片（已提交后）',
      logic: `① 已有申请记录时整页切换为状态视图：pending 审核中 / approved 审核通过 / rejected 审核驳回（驳回时展示平台填写的驳回原因）。
② 审核中每 5 秒轮询 biographerApi.applyStatus()，管理端（biographerApi.review）审核后用户端自动刷新，无需手动操作。
③ 驳回时可点「修改资料重新提交」清空当前记录、回到表单重新填写；审核通过则引导前往传记师中心完善主页接单。`,
    },
  ],
};
