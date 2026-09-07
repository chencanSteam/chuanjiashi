import type { PageAnnotations } from './types';

/**
 * 首页（/home）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const homeAnnotations: PageAnnotations = {
  page: 'home',
  pageName: '首页',
  route: '/home',
  items: [
    {
      id: 'home.empty-hero',
      target: '无档案引导区',
      logic: `① 仅当 localStorage「cj_archives」为空或解析失败时渲染，作为新用户引导；已有档案时整块不显示。
② 「新建传记」跳转 /onboarding 建档流程；「进入家庭空间」跳转 /family，V1.0 版本（isV1）下该按钮隐藏（家庭空间为 V1.2 功能）。`,
    },
    {
      id: 'home.start-interview',
      target: '主视觉区「开始智能采访」',
      logic: `① 点击按三种情况分流：已有智能采访记录（任一档案的采访逐字稿 cj_interview_transcript_<档案id> 非空）→ 直接跳转 /interview（优先当前档案，否则取第一个有记录的档案并设为当前档案）。
② 无采访记录但有档案 → 弹出「选择采访档案」弹窗，选择后设为当前档案并跳转 /interview；弹窗也可点「新建档案」进入新建流程。
③ 无采访记录也无档案 → 打开「完善基础信息」弹窗新建档案（archive_时间戳 生成 id），保存后写入 cj_archives 并设为当前档案，随后跳转 /interview。
④ 主视觉区另有「已有传记上传」快捷入口，点击跳转 /polish（上传已有传记文档并进行 AI 润色）；「进入家庭空间」按钮仅完整版显示（家庭空间为 V1.2 功能）。`,
    },
    {
      id: 'home.archive-picker',
      target: '选择采访档案弹窗',
      logic: `① 仅在「无采访记录但已有档案」时出现；列出全部档案（姓名、性别、出生年份、籍贯、职业），点击即设为当前档案并跳转 /interview 开始采访。
② 底部「新建档案」关闭本弹窗并打开「完善基础信息」弹窗（空表单），走新建档案流程。`,
    },
    {
      id: 'home.collab-invites',
      target: '协作邀请',
      logic: `① 按当前登录手机号（user.phone）查询待处理邀请（pendingInvitesForPhone），无邀请时整块不渲染；未登录不查询。
② 邀请分两类：kind='relation' 为人物关系邀请，kind='collab' 为采访协助邀请，文案不同。
③ 点「同意」：respondCollabInvite 置为已同意；relation 类还会调 familyApi.addOrUpdateMember + addRelation 把自己写入对方档案的关系图谱（写入失败不影响邀请状态）。
④ 点「拒绝」仅更新邀请状态；处理后刷新列表并 toast 提示。`,
    },
    {
      id: 'home.collab-archives',
      target: '我协助的传记',
      logic: `① 按当前账号昵称（user.name）匹配各档案协作者名单（findCollaboratingArchives），无协助中的传记时整块不渲染。
② 点击卡片把该档案 id 写入 cj_current_archive_id 并跳转 /interview，进入协助模式：回答记为补充素材，不影响采访进度。`,
    },
    {
      id: 'home.hot-books',
      target: '热门传记推荐',
      logic: `① 数据来自 bookshelfApi.list()（mock 接口），只保留审核通过（status='approved'）的传记。
② 按「浏览量 + 点赞数」降序取前 4 本；接口失败时显示空态文案。
③ 点击卡片跳转 /biography-shelf/:id 详情；「查看全部」跳转书架列表。
④ 该区块 V1.0 起渲染；上方服务入口中家庭空间、数字博物馆、99元拼团、AI家风馆、数字人生卡片仅完整版显示，案例展示在 V1.0 下仅保留传记书架案例。`,
    },
    {
      id: 'home.activities',
      target: '最近动态',
      logic: `① 动态从真实数据源聚合：档案创建（cj_archives 的 createdAt）、传记章节生成（cj_biography_chapters_\${id} 的最新 updatedAt）、订单提交（orderApi.list）。
② 按时间倒序取前 6 条，时间显示为相对时间（刚刚 / N 分钟前 / N 小时前 / N 天前）。
③ 无任何动态时显示空态；「查看全部」跳转 /family/events，V1.0 版本隐藏（家庭动态为 V1.2 功能）。`,
    },
    {
      id: 'home.todo-list',
      target: '待办事项',
      logic: `① 待办由四类数据实时生成：采访未完成（已答题数 < 应答题数，按档案逐个核算）、待支付订单（orderApi，status='pending_pay'）、拼团待成团（groupBuyApi，status='pending'）、传记草稿未完成（已有章节生成但未全部完成）。
② 每条待办点击跳转对应页面：/interview、/my-orders、/group-buy、/biography。
③ 全部清零时显示空态；右上角「查看全部」固定跳转 /interview。`,
    },
    {
      id: 'home.basic-info-modal',
      target: '新建档案弹窗',
      logic: `① 姓名必填；性别默认男；出生日期为年/月/日三个下拉（选了就要选全，否则拦截）；籍贯为省/市/区级联必选，另可填详细地址；职业为「行业 → 职业」二级下拉（先选行业再选职业）。
② 保存：同 id 覆盖写入 cj_archives 并更新 cj_current_archive_id，toast 后跳转 /interview。`,
    },
  ],
};
