import type { PageAnnotations } from './types';

/**
 * 家庭角色权限页（/family/roles）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyRolesAnnotations: PageAnnotations = {
  page: 'family-roles',
  pageName: '家庭角色',
  route: '/family/roles',
  items: [
    {
      id: 'family-roles.add-role',
      target: '「+ 新增角色」按钮',
      logic: `① 点击以「新增模式」打开角色弹窗：表单清空，editingIndex 置 null。
② 与每行「编辑」共用同一个弹窗，靠 editingIndex 区分新增还是编辑。`,
    },
    {
      id: 'family-roles.roles-table',
      target: '角色列表表格',
      logic: `① 首次进入用内置默认角色（家主/管理员/编辑者/观察者），之后从 localStorage 的 cj_family_roles 读取，读取失败（JSON 解析异常）回退默认。
② 角色数组任何变化都会自动整体写回 cj_family_roles（useEffect 监听），刷新后保留。
③ 成员列为空时显示「—」；成员的指派/移除不在本页操作。`,
    },
    {
      id: 'family-roles.edit',
      target: '行内「编辑」按钮',
      logic: `① 点击以「编辑模式」打开弹窗：把该行角色的名称、称谓、权限说明回填进表单，并记录行下标 editingIndex。
② 弹窗标题随模式切换：新增显示「新增角色」，编辑显示「编辑角色」。`,
    },
    {
      id: 'family-roles.role-form',
      target: '角色编辑弹窗',
      logic: `① 校验：角色名必填（去空格后为空则拦截并提示）；称谓、权限说明选填。
② 新增：称谓缺省取角色名，权限缺省为「只读访问」，成员列表初始为空。
③ 编辑：称谓缺省取角色名，权限留空时保留原权限不覆盖。
④ 保存后写入状态并触发自动持久化到 cj_family_roles，弹窗关闭并 toast 提示新增/更新成功；取消不改动任何数据。`,
    },
  ],
};
