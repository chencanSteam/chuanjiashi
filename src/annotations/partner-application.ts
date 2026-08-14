import type { PageAnnotations } from './types';

/**
 * 合伙人申请页（/partner/apply）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const partnerApplicationAnnotations: PageAnnotations = {
  page: 'partner-application',
  pageName: '合伙人申请',
  route: '/partner/apply',
  items: [
    {
      id: 'partner-application.back',
      target: '「返回首页」按钮',
      logic: `① 点击直接跳转 /home，不校验表单是否已填写，未提交的内容直接丢弃。
② 仅为演示导航，正式版建议增加「表单未提交」的二次确认。`,
    },
    {
      id: 'partner-application.apply-form',
      target: '合伙人申请表单（填写 / 校验 / 提交）',
      logic: `① 表单为共用组件 PartnerApplyForm（合伙人中心空态弹窗内也是同一套），本页独占展示。
② 必填校验仅两项：姓名、手机号，任一为空拦截并提示；邮箱、申请理由选填。
③ 合伙人类型四选一：省级 / 市级 / 县级 / 邀请码合伙人；类型决定「代理区域」下拉的联动层级——省级只显示省、市级到市、县级到区县，邀请码合伙人不显示代理区域。
④ 提交时按类型取对应行政编码与名称（regionCode / regionName）调 partnerApi.apply()；原型环境 mock 为「提交即通过审核」。
⑤ 成功后给当前账号追加 partner 角色（addRole），toast 提示后约 1.2 秒自动跳转合伙人中心（/partner，replace 替换历史记录，返回键不会回到申请表单）；提交中按钮置为「提交中...」防重复点击。`,
    },
  ],
};
