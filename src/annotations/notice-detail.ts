import type { PageAnnotations } from './types';

/**
 * 家讯详情页（/family/notice/:index）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const noticeDetailAnnotations: PageAnnotations = {
  page: 'notice-detail',
  pageName: '家讯详情',
  route: '/family/notice',
  items: [
    {
      id: 'notice-detail.notice-content',
      target: '通知内容区',
      logic: `① 按路由参数 :index 取内置 notices 数组（3 条写死的演示通知）中的对应项。
② index 缺失、非数字或越界时统一回退展示第 1 条通知，页面不报错。
③ 通知的标题、时间、正文均为静态演示数据，不与消息中心联动。`,
    },
    {
      id: 'notice-detail.mark-read-btn',
      target: '「标记为已读」按钮',
      logic: `① 点击后按钮文案变为「已读」并置为 disabled，不可重复点击，同时 toast 提示「已标记为已读」。
② 已读状态仅存在组件内存，不写 localStorage、不同步到通知列表页，刷新或从「更多通知」再次进入后恢复未读。`,
    },
    {
      id: 'notice-detail.share-btn',
      target: '「分享」按钮',
      logic: `① 点击弹出分享弹窗，展示按通知序号拼出的固定链接（https://chuanjiashi.cn/notice/:index）。
② 「复制链接」调用 navigator.clipboard 写入剪贴板并 toast 提示；权限被拒时无异常兜底。
③ 点击遮罩或 × 关闭弹窗。`,
    },
    {
      id: 'notice-detail.more-list',
      target: '「更多通知」列表',
      logic: `① 固定展示全部 3 条演示通知（包含当前正在查看的那条，不做排除）。
② 点击某条跳转 /family/notice/:index，路由参数变化后上方详情区同步切换为对应通知。`,
    },
  ],
};
