import type { PageAnnotations } from './types';

/**
 * 家庭空间页（/family）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familySpaceAnnotations: PageAnnotations = {
  page: 'family-space',
  pageName: '家庭空间',
  route: '/family',
  items: [
    {
      id: 'family-space.tabs',
      target: '功能页签（7 个模块）',
      logic: `① 页签为纯前端切换（activeTab 状态），切换不触发任何数据请求；默认显示「家庭空间」聚合页。
② 其余 6 个页签（数字家谱/家庭相册/故事共创/亲子成长档案/数字纪念馆/档案接管与继承）内容均为静态演示数据或本地 state。
③ 数据持久化差异：相册照片、家训读 localStorage，刷新后保留；日历日程、故事点赞、新建故事仅存内存，刷新即还原。`,
    },
    {
      id: 'family-space.member-card',
      target: '家庭成员卡片',
      logic: `① 成员列表为静态演示数据；搜索框按姓名做前端 includes 实时过滤，标题中的 N 随过滤结果变化。
② 点击成员行或「资料」按钮均跳转成员详情页（/family/members/:name，name 经 encodeURIComponent 编码）。
③ 底部三个快捷入口分别跳转 /family/members（家庭成员资料）、/family/relations（关系维护）、/family/roles（角色权限）。
④ 卡片右上角「查看全部」跳转家庭成员列表页（/family/members）。`,
    },
    {
      id: 'family-space.tree-card',
      target: '家谱树卡片',
      logic: `① 支持树状图/列表图两种视图切换（treeMode 状态），两种视图共用同一份按代分组的数据（共 5 代）。
② 树状图按代渲染成员节点，图例区分男/女/已故/未录入四种状态；列表图渲染「代数-姓名-生卒年」表格。
③ 点击任一成员节点或表格行，跳转该成员详情页（/family/members/:name）。
④ 「全屏查看」调用浏览器 Fullscreen API 对整个页面全屏，切换失败时 toast 报错提示。`,
    },
    {
      id: 'family-space.calendar-card',
      target: '家庭日历卡片',
      logic: `① 月历按 currentMonth 渲染（初始固定 2024 年 5 月，与真实日期无关），周一起算，月初空白格按 1 号的星期偏移补齐；左右箭头切月并把选中日重置为 1 日。
② 点击日期选中并高亮，若当天有日程则 toast 显示「N日：日程标题」；每个日期只匹配日程列表中第一条同日日程。
③ 添加日程：日期须为 1-31 的整数且标题必填，否则拦截并 toast 报错；保存后按日期升序插入列表。
④ 日程行尾 × 删除该条（stopPropagation 阻止冒泡触发选中）。
⑤ 日程只存内存 state，刷新页面还原为初始演示数据，不写 localStorage、不调后端。`,
    },
    {
      id: 'family-space.story-card',
      target: '家庭故事共创卡片',
      logic: `① 三个筛选项：最新故事（全部）、我参与的（作者为「张明远」或「我」）、我收藏的（在已收藏集合中）。
② 点击 ♥ 收藏/取消收藏（stopPropagation 避免触发行点击跳转），点赞数即时 +1/-1；收藏状态仅存内存，刷新丢失。
③ 点击故事行跳转故事详情页（/family/story/:title）；「+ 创建新故事」按钮切换到「家庭故事共创」页签。
④ 「查看全部」跳转故事列表页（/family/stories）。`,
    },
    {
      id: 'family-space.album-upload',
      target: '家庭相册（分类与上传）',
      logic: `① 分类页签：全部/春节团圆/旅行足迹/成长记录/家族聚会/老照片；「全部」展示 12 张占位图，其余分类展示 6 张，占位图均为演示数据。
② 上传照片：支持多选，仅处理 image/* 类型；逐张转 DataURL 后挂到当前选中的分类下；单张超过 2MB 跳过并 toast 提示，读取失败同样跳过。
③ 照片持久化到 localStorage 的「cj_album_photos」（按分类名分组的 JSON），刷新后仍在。
④ 边界：在「全部」分类下上传的照片也按「全部」这个 key 存储，切到具体分类看不到。
⑤ 点击照片弹预览弹窗：已上传照片显示真实 DataURL，占位图用 generateImageDataUrl 生成示意图。`,
    },
    {
      id: 'family-space.story-create',
      target: '创建新故事（故事页签）',
      logic: `① 点「+ 创建新故事」展开输入行，标题必填，为空时拦截并 toast「请输入故事标题」；输入框支持回车快捷发布。
② 发布后新故事以「作者=我、标签=家庭故事、时间=刚刚」入列，同时插入空间页签故事卡片和故事页签两个列表的顶部；故事仅存内存，刷新还原。
③ 页签内筛选比空间页卡片多「全部/家风家训/创业历程」三项：「家风家训」「创业历程」按标签精确匹配过滤。
④ 故事行的「阅读」按钮与整行点击均跳转 /family/story/:title（按钮做了 stopPropagation，不重复跳转）。`,
    },
  ],
};
