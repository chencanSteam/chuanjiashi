import type { PageAnnotations } from './types';

/** 产品套餐管理页（/admin/products）的逻辑标注 */
export const productManagementAnnotations: PageAnnotations = {
  page: 'product-management',
  pageName: '产品套餐管理',
  route: '/admin/products',
  items: [
    {
      id: 'product-management.groups',
      target: '分组产品列表（按类型）',
      logic: `① 产品按类型分组展示：AI 传记 / 数字人 / 短视频 / 码记二维码 / 精装书 / 传记师服务 / 机器人预售。
② 每个分组可单独「新增套餐」；卡片显示权益标签、现价/原价、销量、热销与下架标记。
③ 下架后用户端商城不再展示该套餐，再次点击可重新上架。`,
    },
    {
      id: 'product-management.form',
      target: '新增 / 编辑套餐弹窗',
      logic: `① 名称、价格为必填；价格需为数字（元）。
② 权益逐条添加，重复权益拦截提示；热销标记控制用户端「热销」角标。
③ 编辑时回填原有数据；保存调用 productApi 后刷新列表，用户端商城即时可见。`,
    },
    {
      id: 'product-management.delete',
      target: '删除确认弹窗',
      logic: `① 删除为危险操作，需二次确认。
② 正式版建议：已有订单引用的套餐不允许物理删除，只能下架。`,
    },
  ],
};
