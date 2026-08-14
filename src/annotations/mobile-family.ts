import type { PageAnnotations } from './types';

/**
 * 移动端家庭页（/m/family）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const mobileFamilyAnnotations: PageAnnotations = {
  page: 'mobile-family',
  pageName: '移动端家庭',
  route: '/m/family',
  items: [
    {
      id: 'mobile-family.hero',
      target: '家庭信息头',
      logic: `① 当前家庭「张氏家庭」为演示数据；正式版按当前账号所属家庭加载，无家庭时引导创建或加入家庭。`,
    },
    {
      id: 'mobile-family.module-list',
      target: '家庭模块列表',
      logic: `① 五个模块为固定入口：家庭成员、家训家规、家族相册、家族故事、家族活动，每项显示名称与摘要（成员数/家训/照片数等，当前为演示数据）。
② 手风琴交互：点击展开/收起详情，同一时刻只展开一个模块，再点已展开项则收起；右侧箭头随展开状态旋转并变色。`,
    },
    {
      id: 'mobile-family.module-detail',
      target: '模块详情（展开区）',
      logic: `① 详情当前全部为写死的演示数据：成员列表含角色（家主/管理员/成员）、家训全文、5 个家族故事、1 场近期活动等。
② 家族相册明确标注「即将上线」——正式版需对接相册功能，其余模块对接家庭空间后端数据。
③ 正式版权限规划：家主/管理员可编辑模块内容，普通成员只读。`,
    },
    {
      id: 'mobile-family.activity',
      target: '家庭动态',
      logic: `① 当前为固定空态「暂无动态」；正式版聚合家庭成员的操作动态（新成员加入、相册更新、活动发布等），按时间倒序展示。`,
    },
  ],
};
