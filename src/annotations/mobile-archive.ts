import type { PageAnnotations } from './types';

/**
 * 移动端档案页（/m/archive）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const mobileArchiveAnnotations: PageAnnotations = {
  page: 'mobile-archive',
  pageName: '移动端档案',
  route: '/m/archive',
  items: [
    {
      id: 'mobile-archive.profile-card',
      target: '传主档案卡片与档案切换',
      logic: `① 展示当前档案（localStorage「cj_current_archive_id」对应「cj_archives」中的记录）：姓名、出生年份、籍贯、职业、性别。
② 顶部选择器可切换当前展示档案；「新建」进入 /onboarding 创建第二个及更多档案。
③ 点击「编辑」打开移动端编辑弹窗，保存后通过 archiveApi.update 同步 mock 档案，并更新 cj_archives。`,
    },
    {
      id: 'mobile-archive.timeline',
      target: '可编辑人生时间轴',
      logic: `① 时间轴数据来自 localStorage「cj_events_<档案id>」，按开始年份升序展示；默认档案无本地数据时回退张明远样例。
② 「添加事件」和每条事件的编辑操作都打开弹窗，校验开始年份为 4 位数字、标题必填、结束年份不得早于开始年份，且不同事件的开始年份不可重复。
③ 保存后更新 cj_events_<档案id>，并同步写入 event-<档案id>-<年份> 详情缓存；编辑年份或标题时，已关联素材的阶段名同步更新。
④ 删除前需确认，删除事件详情缓存但保留原已上传素材在素材库中。`,
    },
    {
      id: 'mobile-archive.no-events',
      target: '无事件空态',
      logic: `① 当前档案没有任何时间轴事件时显示空态和「添加第一个事件」按钮。
② 添加成功后立即进入时间轴列表并选中新事件，可继续上传该阶段资料。`,
    },
    {
      id: 'mobile-archive.no-archive',
      target: '无档案空态',
      logic: `① 触发条件：没有当前档案 id，或 id 在档案列表中匹配不到。
② 空态提供「创建人生档案」入口，进入 /onboarding；完成建档后返回移动端档案页。`,
    },
  ],
};
