import type { PageAnnotations } from './types';

/** 消息通知管理页（/admin/notifications）的逻辑标注 */
export const adminNotificationsAnnotations: PageAnnotations = {
  page: 'admin-notifications',
  pageName: '消息通知管理',
  route: '/admin/notifications',
  items: [
    {
      id: 'admin-notifications.compose',
      target: '发布新通知表单',
      logic: `① 标题、内容必填，为空时拦截并提示。
② 类型：系统公告 / 活动通知 / 维护通知；发送对象：全部用户 / 近 30 天活跃用户 / 付费用户。
③ 点击发布后 600ms 模拟接口耗时，成功后将通知插入历史列表顶部并清空表单；发布中按钮防重复提交。
④ 正式版：发布后按「发送对象」规则圈选用户，推送到用户端消息中心（顶栏铃铛）。`,
    },
    {
      id: 'admin-notifications.history',
      target: '历史通知列表',
      logic: `① 按发布时间倒序展示，含类型标签、发送对象、发布状态。
② 状态分「已发布 / 草稿」；当前演示数据均为已发布。
③ 正式版应支持撤回已发布通知（用户端同步删除）与草稿二次编辑。`,
    },
  ],
};
