import type { PageAnnotations } from './types';

/**
 * 用户管理（/admin/users）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const adminUsersAnnotations: PageAnnotations = {
  page: 'admin-users',
  pageName: '用户管理',
  route: '/admin/users',
  items: [
    {
      id: 'admin-users.filters',
      target: '搜索与筛选区',
      logic: `① 关键词（昵称、手机号）与账号状态作为参数传给 adminUserApi.list，由 mock 后端过滤；实名状态在前端对返回结果二次过滤。
② 任一条件变化后 300ms 防抖再发请求，避免输入过程频繁调用。
③ 接口失败时列表兜底为空，显示「暂无符合条件的用户」。`,
    },
    {
      id: 'admin-users.user-list',
      target: '用户列表',
      logic: `① 昵称列统一脱敏显示为「用户 + 手机号后 4 位」，不暴露真实昵称。
② 点击整行打开右侧用户详情抽屉；点击「禁用/启用」按钮会拦截行点击（stopPropagation），改为弹出确认框。
③ 状态列：active 显示「正常」、disabled 显示「已禁用」；实名状态分未认证/认证中/已实名/认证失败四档标签。`,
    },
    {
      id: 'admin-users.detail-drawer',
      target: '用户详情抽屉',
      logic: `① 点击列表行后调用 adminUserApi.get(id) 拉取详情，失败时 toast 报错且抽屉不打开。
② 展示基础信息：昵称、手机号、注册时间、实名状态、档案数/订单数、账号状态，均为只读。
③ 点击遮罩或右上角 × 关闭抽屉。`,
    },
    {
      id: 'admin-users.status-confirm',
      target: '禁用 / 启用确认弹窗',
      logic: `① 确认后调用 adminUserApi.updateStatus，将状态切换为相反值（active ↔ disabled）。
② 禁用文案明确提示「将无法登录和使用平台服务」；操作成功 toast 提示并刷新列表，失败 toast 展示后端错误信息。
③ 点击遮罩、× 或「取消」关闭弹窗，不产生任何变更。`,
    },
  ],
};
