import type { PageAnnotations } from './types';

/**
 * 角色权限（/admin/roles）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const adminRolesAnnotations: PageAnnotations = {
  page: 'admin-roles',
  pageName: '角色权限',
  route: '/admin/roles',
  items: [
    {
      id: 'admin-roles.placeholder',
      target: '角色权限说明卡（占位页）',
      logic: `① 本模块规划用于为后台角色（运营、审核、客服等）分配可访问的功能模块，控制页面查看与操作权限。
② MVP 阶段仅有单一「管理员」角色，默认拥有后台全部权限，故本页为纯说明占位，无任何配置项与数据读写。
③ 多角色创建与细粒度权限分配将在后续版本开放，届时此页替换为角色列表 + 权限矩阵配置。`,
    },
  ],
};
