import type { PageAnnotations } from './types';

/**
 * 移动端人生事件详情页（/m/archive/event/:year）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const mobileEventDetailAnnotations: PageAnnotations = {
  page: 'mobile-event-detail',
  pageName: '移动端事件详情',
  route: '/m/archive/event',
  items: [
    {
      id: 'mobile-event-detail.info',
      target: '人生事件详情卡片',
      logic: `① 从移动端档案页点击时间轴事件卡片进入，路由参数为事件开始年份（同一年份不允许重复，可唯一标识事件）。
② 数据来自 localStorage「cj_events_<档案id>」，按年份匹配当前事件；档案取当前档案（cj_current_archive_id）。
③ 年份不存在（事件已删除或地址错误）时显示空态，可返回档案页。
④ 在档案页新增事件保存成功后，会直接跳转到该事件的详情页。`,
    },
    {
      id: 'mobile-event-detail.media',
      target: '事件关联资料与上传',
      logic: `① 关联资料来自 localStorage「cj_media_<档案id>」，按阶段名「年份·标题」匹配本事件。
② 「上传资料」一次最多 5 个文件、单个不超过 5MB，图片以 dataURL 存本机原型；上传后阶段名固定关联到当前事件。
③ 图片以缩略图网格展示，全部类型素材在下方列表展示，可单个删除（立即生效）。
④ 无任何关联资料时显示「暂未关联资料」。`,
    },
  ],
};
