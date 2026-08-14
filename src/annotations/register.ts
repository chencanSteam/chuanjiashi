import type { PageAnnotations } from './types';

/**
 * 注册页（/register）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const registerAnnotations: PageAnnotations = {
  page: 'register',
  pageName: '注册',
  route: '/register',
  items: [
    {
      id: 'register.send-code',
      target: '获取验证码',
      logic: `① 手机号须为 1 开头 11 位数字，格式不符直接拦截提示，不发送验证码。
② 验证码为本地随机 6 位数，通过提示直接展示（演示环境不真实发短信）；发送后 60 秒倒计时内按钮禁用。`,
    },
    {
      id: 'register.agreement',
      target: '协议勾选',
      logic: `① 未勾选《用户协议》《隐私协议》时点注册会被拦截并提示，协议勾选是注册的前置条件。
② 本页协议无弹窗查看入口，协议全文可在登录页查看。`,
    },
    {
      id: 'register.submit',
      target: '注册提交',
      logic: `① 校验顺序：协议勾选 → 手机号格式 → 已获取验证码 → 验证码一致，任一不满足即拦截。
② 提交中按钮禁用并显示「注册中…」，防止重复提交。
③ 调用 login(isRegister: true) 创建账号：自动标记为新用户（isNewUser）、分配角色并生成邀请码；成功 toast 后跳转 /onboarding 新手引导。`,
    },
    {
      id: 'register.back',
      target: '返回登录',
      logic: `① 放弃注册返回登录页（/login）。
② 返回后本页表单状态（手机号、已发送的验证码）不保留，重新进入需重新获取验证码。`,
    },
  ],
};
