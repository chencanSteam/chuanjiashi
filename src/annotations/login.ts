import type { PageAnnotations } from './types';

/**
 * 登录页（/）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const loginAnnotations: PageAnnotations = {
  page: 'login',
  pageName: '登录',
  route: '/',
  items: [
    {
      id: 'login.version-switch',
      target: 'MVP / 完整版切换开关',
      logic: `① 点击开关在「MVP 模式 / 完整版」间切换，调用 setAppVersion 并写入 localStorage \`cj_app_version\`，刷新后保持。
② MVP 模式仅显示用户端、管理后台两个入口；完整版额外开放合伙人中心、传记师端、移动端。`,
    },
    {
      id: 'login.portal-grid',
      target: '各端登录入口（端口卡片）',
      logic: `① 点击任一卡片即用对应演示账号直接登录：用户端/合伙人/移动端用 13800138003（姓名「张明远」），管理后台/传记师端用 13800138000，密码固定 123456。
② 进入合伙人中心、传记师端时通过 addRole 追加对应角色，控制后续页面权限。
③ 本地无档案时自动写入默认演示档案（localStorage \`cj_archives\` + \`cj_current_archive_id\`）。
④ 已登录状态访问本页会自动跳转：有档案进 /home，无档案进 /onboarding。
⑤ URL 携带 ?invite=xxx 邀请码时，登录成功后写入 localStorage \`cj_invite_code\`，供佣金体系结算。`,
    },
    {
      id: 'login.agreement',
      target: '协议勾选与查看',
      logic: `① 未勾选协议时，点「微信授权登录」或提交手机号登录都会被拦截并提示。
② 点击《用户协议》《隐私协议》弹窗查看全文；弹窗内点「我已阅读并同意」会自动勾选复选框。`,
    },
    {
      id: 'login.phone-login',
      target: '手机号验证码登录',
      logic: `① 点「手机号登录」展开表单；手机号须为 1 开头 11 位数字，否则无法发送验证码。
② 验证码为本地随机 6 位数，通过提示直接展示（演示环境不真实发短信），发送后 60 秒倒计时内不可重发。
③ 提交校验顺序：协议勾选 → 已获取验证码 → 验证码一致，任一不满足即拦截。
④ 登录成功后按 localStorage \`cj_archives\` 是否有档案分流：有档案进 /home，无档案进 /onboarding；「立即注册」跳转 /register。`,
    },
    {
      id: 'login.wechat-login',
      target: '微信授权登录',
      logic: `① 以演示账号 13800138003（张明远）模拟微信授权登录，无需验证码，但同样要求先勾选协议。
② 登录成功后执行默认档案初始化，并按有无档案分流 /home 或 /onboarding。`,
    },
  ],
};
