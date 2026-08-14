import type { PageAnnotations } from './types';

/**
 * 数字家谱页（/genealogy）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const genealogyAnnotations: PageAnnotations = {
  page: 'genealogy',
  pageName: '数字家谱',
  route: '/genealogy',
  items: [
    {
      id: 'genealogy.tabs',
      target: '功能页签（家谱树 / 世系表 / 迁徙图 / 姓氏文化 / 修谱协作 / 家谱导出）',
      logic: `① 页签仅做前端状态切换（activeTab），不跳转路由，默认展示「家谱树」。
② 「迁徙图 / 姓氏文化 / 修谱协作」三个页签当前共用同一个「家谱文献库」内容区，属待细化的占位实现。
③ 「世系表」页签展示精简预览并可跳转完整世系表；「家谱导出」页签展示三类输出入口。`,
    },
    {
      id: 'genealogy.stats',
      target: '家族统计概览卡（5 张）',
      logic: `① 收录成员 / 家族分支 / 已补全世代 / 文献资料 / 协作修谱人数均为写死的演示数据，「较上月」趋势同。
② 点击卡片按顺序分别跳转：成员列表（/family/members）、家族关系（/family/relations）、家族主页（/family）、家谱文献（/genealogy/documents）、家族关系。`,
    },
    {
      id: 'genealogy.search',
      target: '家谱检索（关键词 / 姓氏筛选 / 高级检索）',
      logic: `① 关键词实时过滤：成员姓名或世代名包含关键字即保留，输入即生效，无需确认。
② 姓氏筛选：按姓名前缀匹配所选姓氏，「全部」不过滤。
③ 高级检索：输入字/号/籍贯后须点「检索」按钮才生效，匹配范围含姓名、世代、生卒年，完成后 Toast 提示命中人数。
④ 三类条件叠加取交集；无匹配时家谱树区域显示「未找到匹配的成员」空态。`,
    },
    {
      id: 'genealogy.tree-tools',
      target: '家谱树工具栏（缩放 / 全屏 / 筛选）',
      logic: `① 缩放步进 0.1，下限 0.5、上限 2，通过 CSS transform scale 实现，超出范围不再变化。
② 全屏为页内伪全屏（切换卡片 fullscreen 样式），未使用浏览器 Fullscreen API。
③ 「筛选」仅展开男性/女性/已故勾选条，勾选当前不改变树内容（占位实现）。`,
    },
    {
      id: 'genealogy.tree',
      target: '家谱树成员区（成员卡 / 添加成员）',
      logic: `① 成员按世代分组渲染，列表受左侧检索条件实时过滤。
② 点击成员卡跳转成员详情页（/family/members/:name，姓名经 URL 编码作为路径参数）。
③ 「+ 添加成员」弹窗输入姓名，非空即加入「新录入」分组；仅前端内存态，刷新即丢失；输入为空则不处理。`,
    },
    {
      id: 'genealogy.pending',
      target: '待补全成员',
      logic: `① 列表为静态演示数据，逐条提示成员缺失的信息（配偶、子女、生卒等）。
② 点击整行跳转该成员详情页（/family/members/:name）。
③ 点击「补全信息」按钮阻止事件冒泡（不触发整行跳转），仅 Toast 提示进入补全流程。`,
    },
    {
      id: 'genealogy.table-preview',
      target: '世系表预览',
      logic: `① 仅展示前 5 代代表人物的精简数据（世代/代表人物/生卒年/配偶/子女数）。
② 点击行跳转对应成员详情页（/family/members/:name）。
③ 「查看完整世系表」跳转 /genealogy/table 查看全量世系数据。`,
    },
    {
      id: 'genealogy.export',
      target: '家谱输出（PDF导出 / 印刷排版 / 分享链接）',
      logic: `① 三类输出共用同一模拟流程：点击后按钮进入「导出中/生成中…」禁用态，约 1.2 秒后 Toast 提示完成并恢复可点击。
② 各按钮按类型独立维护 loading 状态，互不影响，可同时触发。
③ 原型不生成真实文件，正式版 PDF/排版文件应生成后可下载，分享链接应生成带授权的访问地址。`,
    },
  ],
};
