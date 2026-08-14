import type { PageAnnotations } from './types';

/**
 * 个人中心页（/profile）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const profileAnnotations: PageAnnotations = {
  page: 'profile',
  pageName: '个人中心',
  route: '/profile',
  items: [
    {
      id: 'profile.hero',
      target: '用户信息卡',
      logic: `① 展示名优先级：实名姓名 > 昵称 > 手机号 > 默认「用户」；头像按展示名自动生成。
② 实名状态徽标读取 localStorage \`cj_security_<手机号>\`，切换账号（手机号变化）时重新加载。
③ 「完善资料」仅完整版显示，跳转 /settings/account；MVP 模式隐藏。`,
    },
    {
      id: 'profile.realname',
      target: '实名认证',
      logic: `① 未实名时点击弹出认证弹窗；已实名后该项不可再点击，身份证号脱敏展示（前 4 位 + 后 4 位）。
② 真实姓名必填，身份证号须为 18 位（末位可为 X/x），格式不符拦截提示。
③ 认证通过写入 localStorage \`cj_security_<手机号>\`，并把实名姓名同步为账号姓名（优先级高于昵称）。`,
    },
    {
      id: 'profile.wechat',
      target: '绑定微信',
      logic: `① 点击即在绑定 / 解绑间切换，状态写入 localStorage \`cj_security_<手机号>\`，刷新后保留。
② 演示环境为本地状态切换，未对接真实微信授权。`,
    },
    {
      id: 'profile.phone-change',
      target: '绑定 / 更换手机号',
      logic: `① 新手机号须为 1 开头 11 位数字才能发送验证码；验证码本地生成并通过提示展示，60 秒倒计时内不可重发。
② 确认绑定校验：已获取验证码 → 验证码一致，任一不满足即拦截。
③ 更换成功后，实名与微信绑定等安全信息从旧手机号 key 迁移到 \`cj_security_<新手机号>\`，旧 key 删除，同时更新登录账号的手机号。`,
    },
    {
      id: 'profile.menu-list',
      target: '功能菜单（传记 / 订单 / 额度 / 邀请 / 账户）',
      logic: `① 整组菜单仅完整版显示，MVP 模式隐藏。
② 分别跳转 /my-works（我的传记）、/my-orders（我的订单）、/settings/quota（AI 额度）、/settings/invite（我的邀请）、/settings/account（账户设置）。`,
    },
    {
      id: 'profile.logout',
      target: '退出登录',
      logic: `① 清除登录态（localStorage \`cj_user\` / \`cj_token\` / \`cj_mock_current_user\`），replace 跳转 /login，不可通过浏览器后退回到已登录页面。
② 本地档案、采访记录等业务数据保留，再次登录后可继续使用。`,
    },
  ],
};
