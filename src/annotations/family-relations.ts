import type { PageAnnotations } from './types';

/**
 * 家庭关系维护页（/family/relations）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyRelationsAnnotations: PageAnnotations = {
  page: 'family-relations',
  pageName: '家庭关系',
  route: '/family/relations',
  items: [
    {
      id: 'family-relations.data-load',
      target: '关系数据加载（按档案隔离）',
      logic: `① 进入页面时从 localStorage 读 cj_current_archive_id 得到当前档案 id，缺省为 'default'。
② 并行调 familyApi.relations(archiveId)（GET /api/families/:id/relations）和 familyApi.members(archiveId)（GET /api/families/:id/members）。
③ 任一接口失败时静默回退为空列表，页面显示空态而不是报错。`,
    },
    {
      id: 'family-relations.add-button',
      target: '「添加关系」按钮',
      logic: `① 点击展开页面顶部的新增表单（甲方姓名 / 关系类型 / 乙方姓名）。
② 表单展开期间再次添加新关系前，旧输入保留；点 × 关闭时清空两个姓名输入。`,
    },
    {
      id: 'family-relations.add-form',
      target: '新增关系表单',
      logic: `① 姓名输入带 datalist 联想：候选 = 成员名单 ∪ 已有关系中出现过的所有人名（去重），也允许输入全新姓名。
② 校验规则：双方姓名必填 → 不允许与自己建立关系 → 不允许重复（AB 与 BA 视为同一条，双向去重），三种拦截分别 toast 提示。
③ 关系类型下拉选项来自 relationTypeOptions（夫妻、父子、母子等固定枚举）。
④ 提交调 familyApi.addRelation（POST /api/families/:id/relations），成功后追加到列表、重置表单并关闭；接口异常 toast 展示后端错误信息。`,
    },
    {
      id: 'family-relations.relation-list',
      target: '关系列表（点击 / 删除）',
      logic: `① 每行展示「甲方 — 关系 — 乙方」，点击任一方头像/姓名跳转该成员详情页 /family/members/:name（name 经 encodeURIComponent 编码）。
② 删除按钮调 familyApi.removeRelation（DELETE /api/families/:id/relations/:relationId），成功后从列表移除；暂无二次确认，正式版建议加确认弹窗。
③ 列表为空时显示空态文案「暂无关系，点击右上角添加」。`,
    },
  ],
};
