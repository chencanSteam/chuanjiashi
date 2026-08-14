import type { PageAnnotations } from './types';

/** 后台系统设置页（/admin/settings）的逻辑标注 */
export const adminSettingsAnnotations: PageAnnotations = {
  page: 'admin-settings',
  pageName: '后台系统设置',
  route: '/admin/settings',
  items: [
    {
      id: 'admin-settings.platform-info',
      target: '平台基础信息表单',
      logic: `① 平台名称为必填项，为空时拦截保存。
② 保存写入 localStorage（admin_platform_info），刷新后保留；正式版落库并展示在用户端页脚/关于页。
③ 备案号、客服电话等信息面向 C 端展示，修改需谨慎。`,
    },
    {
      id: 'admin-settings.role-matrix',
      target: '后台角色权限矩阵',
      logic: `① 只读展示：超级管理员 / 运营 / 审核 / 财务 四个角色在各模块的权限。
② 当前为静态演示；细粒度编辑入口在「系统管理 - 角色权限」（/admin/roles）。
③ 正式版：权限变更实时生效，涉及财务与审核模块的变更需二次确认并记录操作日志。`,
    },
    {
      id: 'admin-settings.notify-config',
      target: '消息通知配置（短信 / 站内信）',
      logic: `① 开关即改即存（localStorage admin_notify_config），无需点保存。
② 短信通知面向运营/审核/财务人员；站内信面向 C 端用户。
③ 正式版：短信通道需对接短信服务商并受频次与费用控制；站内信与用户端消息中心联动。`,
    },
  ],
};
