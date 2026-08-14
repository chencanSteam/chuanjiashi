import type { PageAnnotations } from './types';

/**
 * 地点管理页（/archive/places）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const archivePlacesAnnotations: PageAnnotations = {
  page: 'archive-places',
  pageName: '地点管理',
  route: '/archive/places',
  items: [
    {
      id: 'archive-places.map',
      target: '人生足迹地图',
      logic: `① 进入页面时按当前档案 id（cj_current_archive_id，缺省 default）调 familyApi.places 拉取地点数据，失败回退为空列表。
② 地图钉位为演示布局：按数据索引循环计算 left / top 百分比摆放，并非真实地理坐标。`,
    },
    {
      id: 'archive-places.list',
      target: '地点记录列表',
      logic: `① 每个地点展示名称与记录数，记录数缺失时按 1 条计。
② 本页只读，不提供增删改；无数据时显示空态，引导回「人生档案 → 地点足迹」添加。`,
    },
  ],
};
