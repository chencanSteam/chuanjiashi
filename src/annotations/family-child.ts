import type { PageAnnotations } from './types';

/**
 * 家风少年·亲子成长档案页（/family/child）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyChildAnnotations: PageAnnotations = {
  page: 'family-child',
  pageName: '家风少年',
  route: '/family/child',
  items: [
    {
      id: 'family-child.child-cards',
      target: '子女档案卡片区',
      logic: `① 当前为演示数据：页面顶部写死 3 名子女（姓名、出生日期、年龄），每名子女一张卡片。
② 正式逻辑：按当前档案（localStorage 的 cj_current_archive_id）拉取家庭成员中「子女」角色的成员列表，每人一卡。
③ 年龄由出生日期动态计算，不是存储字段。`,
    },
    {
      id: 'family-child.category-entry',
      target: '档案分类入口（成长/学习/健康/兴趣）',
      logic: `① 四类固定入口：成长记录 growth、学习档案 study、健康档案 health、兴趣特长 hobby。
② 点击跳转 /family/child/:key（如 /family/child/study），进入对应分类的时间轴明细页。
③ 正式逻辑：入口上应展示该子女在该分类下的记录条数或最近一条动态，无记录时置灰或引导新建。`,
    },
  ],
};
