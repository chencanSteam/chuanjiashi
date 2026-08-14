import type { PageAnnotations } from './types';

/**
 * 传承交接方案详情页（/family/inherit/:id）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyInheritAnnotations: PageAnnotations = {
  page: 'family-inherit',
  pageName: '传承交接',
  route: '/family/inherit',
  items: [
    {
      id: 'family-inherit.config-detail',
      target: '方案详情 / 当前配置',
      logic: `① 页面按路由参数 id 匹配四类方案：archive 数字档案继承、oral 口述史托管、hall 家风馆授权、privacy 隐私开放权限；id 不认识时静默回退到 archive。
② 右上角状态标签（已设置/云端托管/待设置）为各方案写死的演示状态，「待设置」高亮 pending 样式。
③ 当前配置按方案独立存储：读 localStorage 的 cj_family_inherit_config_{id}，无存档或解析失败回退默认配置（继承人张子涵、范围两项、3 年无登录生效）。`,
    },
    {
      id: 'family-inherit.actions',
      target: '返回继承中心 / 修改配置',
      logic: `① 「返回继承中心」跳转 /family 并携带 state { tab: 'inherit' }，家庭主页据此直接激活「传承交接」页签，而不是默认页签。
② 「修改配置」打开弹窗，打开时把当前已保存配置复制为草稿（draft），弹窗内的修改不影响页面展示，保存才生效。`,
    },
    {
      id: 'family-inherit.edit-form',
      target: '修改继承配置弹窗',
      logic: `① 继承人从家庭成员名单单选；生效条件三选一（连续 3 年无登录 / 连续 1 年无登录 / 本人手动确认后生效）。
② 继承范围为多选（家庭数字档案、口述史音视频、家风馆内容、家族相册），点击复选框切换勾选。
③ 保存校验：至少选择一项继承范围，否则拦截并 toast 提示。
④ 保存成功：草稿写入 localStorage 的 cj_family_inherit_config_{id} 并同步页面展示，关闭弹窗；取消直接丢弃草稿。`,
    },
  ],
};
