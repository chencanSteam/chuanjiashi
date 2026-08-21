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
      id: 'mobile-profile.orders',
      target: '订单快捷栏',
      logic: `① 页面加载时并行调用 orderApi.list 与 biographerApi.orders，统计普通订单的全部、待支付、服务中数量，以及普通订单退款记录和传记师订单「售后中」的售后数量；接口失败时数字降级为 0，不影响入口使用。
② 全部订单跳 /my-orders；待支付、服务中、售后/退款分别以 ?status=pending_pay、?status=delivering、?status=refunded 预设订单筛选。`,
    },
    {
      id: 'mobile-profile.services',
      target: '我的服务',
      logic: `① 传家商城跳 /store，复用现有商品浏览、收货地址、创建订单与微信支付原型流程。
② 我的订单跳 /my-orders；售后服务跳 /my-orders?status=refunded，订单详情页中仍可按状态发起退款、查看退款原因与处理记录。`,
    },
    {
      id: 'mobile-profile.security',
      target: '账号安全',
      logic: `① 点击弹出「账号安全」弹窗：读取 localStorage「cj_security_{手机号}」展示实名认证状态（含脱敏身份证号）、微信绑定状态、绑定手机号与登录方式，与 Web 端个人中心数据一致。
② 正式版应支持换绑手机号（需短信验证码校验原/新号码）与设置密码。`,
    },
    {
      id: 'mobile-profile.edit',
      target: '个人资料',
      logic: `① 点击弹出编辑弹窗，可修改昵称；保存走 useAuth 的 updateUser，与 Web 端设置-账户信息同一逻辑，头像与展示名同步更新。
② 手机号只读展示。`,
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
