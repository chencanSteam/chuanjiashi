import type { PageAnnotations } from './types';

/**
 * 家风测评页（/family-hall/assessment）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyAssessmentAnnotations: PageAnnotations = {
  page: 'family-assessment',
  pageName: '家风测评',
  route: '/family-hall/assessment',
  items: [
    {
      id: 'family-assessment.create-button',
      target: '「创建测评」按钮',
      logic: `① 点击在列表顶部展开创建表单；「取消」收起且不清空已输入的名称。
② 正式版创建测评应进入题库编辑流程（添加题目、选项与计分规则），原型仅录名称。`,
    },
    {
      id: 'family-assessment.create-form',
      target: '创建测评表单',
      logic: `① 校验规则：测评名称必填，为空时拦截并提示「请输入测评名称」。
② 创建成功后新测评置顶插入列表，初始为 0 题、0 人参与、平均分 0。
③ 原型数据仅存内存，刷新恢复初始示例；正式版需提交后端生成测评记录。`,
    },
    {
      id: 'family-assessment.publish',
      target: '「发布」按钮',
      logic: `① 点击后该测评标记为已发布：按钮禁用、文案变为「已发布」，不可重复发布。
② 状态流转：草稿 → 已发布；正式版发布后家族成员才可在小程序/链接中填写，且应校验题目数大于 0 才允许发布。
③ 原型发布状态仅存内存（Set 结构），刷新后复位。`,
    },
    {
      id: 'family-assessment.stats',
      target: '「统计」按钮',
      logic: `① 点击弹出该测评的统计弹窗：题目数、参与人数、平均分三项指标；点遮罩或右上角 × 关闭。
② 原型统计直接读取列表项上的静态字段；正式版应由后端按答卷数据实时聚合（含得分分布、每题正确率等）。
③ 若弹窗打开期间该测评被删除，弹窗内容为空态（不报错）。`,
    },
    {
      id: 'family-assessment.delete',
      target: '删除按钮',
      logic: `① 点击立即从列表移除该测评，原型无二次确认；正式版应弹确认框，已发布/已有答卷的测评应禁止删除或仅允许下线。
② 删除仅影响前端内存列表，刷新恢复初始示例。`,
    },
  ],
};
