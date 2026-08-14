import type { PageAnnotations } from './types';

/**
 * 政策列表页（/government/policies）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const policyListAnnotations: PageAnnotations = {
  page: 'policy-list',
  pageName: '政策列表',
  route: '/government/policies',
  items: [
    {
      id: 'policy-list.search',
      target: '政策搜索框',
      logic: `① 输入即过滤（前端本地过滤）：仅按政策标题做子串匹配，不匹配发布单位、日期和标签。
② 清空搜索词即恢复完整列表；无结果时列表区域为空（原型未做空态提示）。`,
    },
    {
      id: 'policy-list.list',
      target: '政策列表',
      logic: `① 政策数据为页面内置静态列表，含标题、发布单位与日期、分类标签。
② 点击政策行打开该政策的详情摘要弹窗。
③ 每行末尾的链接按钮：阻止事件冒泡（不触发弹窗），将 https://chuanjiashi.cn/policy/{序号} 写入剪贴板并 toast 提示「原文链接已复制」；序号为当前过滤结果中的下标，搜索后序号会变化。`,
    },
    {
      id: 'policy-list.detail',
      target: '政策详情弹窗',
      logic: `① 弹窗内容来自点击行选中的政策对象，展示标题、发布单位与日期。
② 正文为固定占位文案（原型未接政策原文接口）。
③ 点遮罩或右上角关闭按钮收起弹窗。`,
    },
  ],
};
