import type { PageAnnotations } from './types';

/**
 * 训练报告页（/digital-person/training-report）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const trainingReportAnnotations: PageAnnotations = {
  page: 'training-report',
  pageName: '训练报告',
  route: '/digital-person/training-report',
  items: [
    {
      id: 'training-report.actions',
      target: '打印 / 下载报告',
      logic: `① 「打印」直接调用浏览器 window.print() 打印当前页。
② 「下载报告」延迟 600ms 后用综合得分与生成时间拼出纯文本 Blob，以「训练报告.txt」触发浏览器下载；生成期间按钮禁用并显示「生成中…」。`,
    },
    {
      id: 'training-report.overall',
      target: '综合训练得分卡',
      logic: `① 综合训练得分 = 五项能力维度分值的算术平均，四舍五入取整。
② 评估描述文案为静态演示内容，原型阶段不随训练数据变化。`,
    },
    {
      id: 'training-report.metrics',
      target: '能力维度',
      logic: `① 五个维度（语言风格学习 / 情感记忆 / 价值观建模 / 一致性测试 / 安全边界）及分值为静态演示数据。
② 每行进度条按 value% 渲染，使用各自配色。`,
    },
    {
      id: 'training-report.trend',
      target: '训练趋势图',
      logic: `① 柱状图展示最近 6 次训练得分，柱高 = 得分 / 100 × 160px；最新一根不透明，其余 0.6 透明度。
② 「最高分」取趋势数组最大值动态计算；「近 7 天提升 +13」为静态文案。`,
    },
    {
      id: 'training-report.summary',
      target: '训练总结',
      logic: `① 四条总结为静态演示文案，正式版由 AI 按训练结果生成；原型阶段不随数据变化。`,
    },
  ],
};
