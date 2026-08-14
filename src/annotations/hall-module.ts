import type { PageAnnotations } from './types';

/**
 * 家风馆模块页（/family-hall/project/:name/:module）的逻辑标注。
 * 该页按 module 参数渲染五个子模块之一，同一时刻只显示一个模块，编号按数组顺序生成。
 */
export const hallModuleAnnotations: PageAnnotations = {
  page: 'hall-module',
  pageName: '家风馆模块页',
  route: '/family-hall/project',
  items: [
    {
      id: 'hall-module.router',
      target: '模块内容区（按路由渲染子模块）',
      logic: `① 按路由参数 :module 映射子模块：rules→家训家规、stories→家风故事、courses→家风课程、election→最美家庭、mentor→AI家风导师。
② 模块名无法匹配时渲染「模块不存在」兜底页（仅返回按钮）。
③ 根节点带 key={module}，切换模块时强制重新挂载，各子模块表单与弹窗状态互不残留。`,
    },
    {
      id: 'hall-module.rules',
      target: '家训家规模块',
      logic: `① 家训列表持久化在 localStorage「cj_hall_rules」，首次进入用 3 条初始数据，新增/删除即时写入，刷新后保留。
② 新建家训：标题与内容均必填，去空格后任一为空则拦截提示；新增项 id 取 Date.now()，标签固定「家训」，追加到列表末尾。
③ 删除直接按 id 过滤；「保存排序」仅记录时间并提示（原型未实现拖拽排序）。`,
    },
    {
      id: 'hall-module.stories',
      target: '家风故事模块',
      logic: `① 故事列表持久化在 localStorage「cj_hall_stories」，规则同家训：新增/删除/点赞即时写入，刷新保留。
② 发布故事：标题与摘要必填，作者留空默认「佚名」，日期取当天，新故事插入列表顶部，初始 0 赞。
③ 点赞为开关式：已赞再点取消，计数 ±1；删除按 id 过滤。`,
    },
    {
      id: 'hall-module.courses',
      target: '家风课程模块',
      logic: `① 课程数据仅存内存 state（未持久化），刷新后还原为 3 条初始课程。
② 新建课程：课程名称必填，课时数取整，空值/非数字兜底为 1；新课程默认「草稿」状态、0 人在学，插入列表顶部。
③ 「发布/下架」按钮在「草稿 ↔ 已发布」间切换，按钮样式随状态变化。`,
    },
    {
      id: 'hall-module.election',
      target: '最美家庭模块',
      logic: `① 参评家庭数据仅存内存，刷新还原；汇总区实时计算参评家庭数与累计投票。
② 添加参评家庭：家庭名称必填，事迹简介可空；新家庭 0 票，追加到列表末尾。
③ 投票：该家庭 +1 票后整个列表按票数降序重排，名次（左侧序号）与得票条宽度（占总票比例，上限 100%）随之实时变化。
④ 移除按 id 过滤，无二次确认。`,
    },
    {
      id: 'hall-module.mentor-test',
      target: 'AI家风导师对话测试',
      logic: `① 输入为空（或全空格）时点击提问不响应；支持回车提交。
② 匹配规则为双向模糊匹配：提问包含知识库问题、或知识库问题包含提问，命中即返回对应答案。
③ 未命中返回固定兜底文案「这个问题超出了当前知识库…」，提示补充家风资料；匹配结果不回写知识库。`,
    },
    {
      id: 'hall-module.mentor-qa',
      target: 'AI家风导师知识库',
      logic: `① 问答知识仅存内存 state，刷新后还原为 3 条初始问答。
② 添加知识：问题与答案均必填，去空格后任一为空则拦截提示；新增项 id 取 Date.now()，追加到列表末尾。
③ 删除按 id 过滤，无二次确认；「保存」按钮仅记录时间并提示。`,
    },
  ],
};
