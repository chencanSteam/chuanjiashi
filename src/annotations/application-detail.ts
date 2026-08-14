import type { PageAnnotations } from './types';

/**
 * 申报详情页（/government/application/:id）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const applicationDetailAnnotations: PageAnnotations = {
  page: 'application-detail',
  pageName: '申报详情',
  route: '/government/application',
  items: [
    {
      id: 'application-detail.data',
      target: '申报信息（标题 / 编号）',
      logic: `① 从路由参数 :id 取业务编号并 decodeURIComponent 解码，用编号在页面内置数据表中查找对应办件。
② 查不到（含从看板以办件标题跳转过来的情况）时回退到默认办件 ZJ-20260618-001，但页面编号仍按 URL 参数原样展示。
③ 顶部状态徽标按状态映射样式：审核中→pending、待补充→need、其他（已办结）→done。`,
    },
    {
      id: 'application-detail.timeline',
      target: '办理进度时间轴',
      logic: `① 四个节点（提交申请 → AI 智能核验 → 人工复核 → 结果下发）的完成态完全由当前状态推导：
- 「待补充」：仅第一步 done；
- 「审核中」：前两步 done，人工复核 active；
- 「已办结」：四步全部 done。
② 原型中状态来自静态数据，正式版应随办件流转实时更新。`,
    },
    {
      id: 'application-detail.actions',
      target: '操作按钮（查看证明 / 打印 / 下载）',
      logic: `① 查看证明：打开电子证明弹窗，展示业务类型、编号、申请人、状态；点遮罩或关闭按钮收起。
② 打印：直接调浏览器 window.print()。
③ 下载：前端用 Blob 拼接证明文本（类型/编号/申请人/状态）生成 .txt 触发浏览器下载，并 toast 提示。`,
    },
  ],
};
