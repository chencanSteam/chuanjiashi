import type { PageAnnotations } from './types';

/**
 * 移动端我的页（/m/profile）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const mobileProfileAnnotations: PageAnnotations = {
  page: 'mobile-profile',
  pageName: '移动端我的',
  route: '/m/profile',
  items: [
    {
      id: 'mobile-profile.user-card',
      target: '用户信息卡',
      logic: `① 数据来自登录态（useAuth）：头像取姓名（或手机号）首字，名称缺省时显示「用户 + 手机号后 4 位」。
② 手机号缺失时显示「未绑定手机号」。`,
    },
    {
      id: 'mobile-profile.security',
      target: '账号安全',
      logic: `① 点击弹出「账号安全」弹窗：展示绑定手机号（只读，未绑定显示「未绑定」）与当前登录方式（短信验证码登录）。
② 正式版应支持换绑手机号（需短信验证码校验原/新号码）与设置密码。`,
    },
    {
      id: 'mobile-profile.privacy',
      target: '隐私协议',
      logic: `① 点击弹出隐私协议全文弹窗，内容为静态文案（信息收集、使用、保护、用户权利、协议更新五条）。
② 正式版协议内容应由运营后台可配置，并按法规要求记录用户同意版本与时间。`,
    },
    {
      id: 'mobile-profile.logout',
      target: '退出登录',
      logic: `① 调用 useAuth 的 logout() 清除登录态（token/用户信息），完成后跳转登录页（/）。
② 退出后受保护路由（/m 下各页）再由路由守卫拦截回登录页。`,
    },
  ],
};
