import type { PageAnnotations } from './types';

/**
 * AI家风馆（/family-hall）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyHallAnnotations: PageAnnotations = {
  page: 'family-hall',
  pageName: 'AI家风馆',
  route: '/family-hall',
  items: [
    {
      id: 'family-hall.stats-row',
      target: '顶部统计卡片',
      logic: `① 五项统计为平台运营 mock 数据；其中「在建家风馆」实时统计下方项目列表中状态为「建设中」的条数，其余为静态数字。
② 点击卡片按位跳转：在建家风馆→本页、已发布专题→/family-hall/deploy、家风故事库→/family/stories、家风课程数/最美家庭申报数→/family-hall/activity。
③ 「较上月」涨幅为演示固定文案，无真实计算。`,
    },
    {
      id: 'family-hall.project-list',
      target: '馆馆项目列表（含新建家风馆）',
      logic: `① 新建家风馆：名称必填，去空格后为空则拦截并提示「请输入家风馆名称」；支持回车提交、取消清空。
② 创建成功后插入列表顶部，状态固定「建设中」，时间取当前时间；列表仅存内存 state，刷新页面即还原为初始 5 条 mock 数据。
③ 点击项目跳转 /family-hall/project/{馆名}（馆名经 encodeURIComponent 编码）；「查看全部项目」固定跳转「张氏家风馆」详情（演示入口）。`,
    },
    {
      id: 'family-hall.hall-preview',
      target: '家风馆主页预览（保存 / 发布 / 进入）',
      logic: `① 预览区按当前模板实时渲染：Banner 渐变、强调色、模块底色、文案对齐均取自模板配置，与右侧「页面配置」联动。
② 预览图标与「进入家风馆」跳转 /family-hall/project/张氏家风馆；下方模块卡片点击跳转对应模块页 /family-hall/project/张氏家风馆/{rules|stories|courses|election|mentor}，未知模块名兜底 rules。
③ 模块卡片只渲染「页面模块」中开启的项，全部隐藏时显示「请在配置面板开启模块」空态。
④ 保存：仅记录保存时间并 toast 提示，按钮回显「保存于 HH:MM」；发布：记录发布时间并提示。两者均不落库，刷新后状态还原。`,
    },
    {
      id: 'family-hall.page-config',
      target: '页面配置（模板 / 配色 / 模块 / Banner / 发布设置）',
      logic: `① 模板选择：切换下拉框立即写入 localStorage「cj_hall_template」并刷新预览，刷新后保留；「更换模板」按钮仅弹提示，无额外逻辑。
② 配色方案：仅更新选中态，未持久化，也未真正应用到预览（预览颜色跟随模板而非配色）。
③ 页面模块：眼睛图标切换模块显隐（已 stopPropagation，不影响整行点击），结果只影响预览渲染，刷新后还原为全部开启。
④ Banner 设置：仅接受图片文件且 ≤2MB，类型或大小不符分别拦截提示；成功后转 dataURL 写入 localStorage「cj_hall_banner」；写入失败（存储空间不足）时本次页面可见，但提示刷新后可能丢失。
⑤ 发布设置（公开访问/家人可见/密码访问）与配置 Tab 仅存内存，用于导出报告文本；底部「发布」与预览区发布为同一动作。`,
    },
    {
      id: 'family-hall.deploy-entry',
      target: '部署入口（H5链接 / 二维码 / 嵌入官网 / 分享海报）',
      logic: `① 四个按钮均跳转 /family-hall/deploy，由部署页按 Tab 展示对应内容。
② 跳转不携带家风馆标识，部署页默认展示「张氏家风馆」的链接与物料。`,
    },
    {
      id: 'family-hall.content-prod',
      target: '内容生产入口',
      logic: `① 五张卡片分别跳转：AI家风提炼→/family-hall/ai-refine、家风故事库→/family-hall/story-library、家风测评→/family-hall/assessment、最美家庭评选→/family-hall/activity、家风衍生品→/store?category=derivative。
② 卡片整区与内部按钮均可点击，按钮已 stopPropagation 避免重复触发跳转。`,
    },
    {
      id: 'family-hall.election-card',
      target: '最美家庭评选卡片',
      logic: `① 卡片整体、「进入活动」及四个统计数字点击均跳转 /family-hall/activity，内层元素已 stopPropagation。
② 参评家庭数、累计投票、访问量、入围数及阶段进度（报名/投票/评审/公示）均为静态 mock，「进行中」标签固定高亮投票阶段。`,
    },
    {
      id: 'family-hall.output-export',
      target: '成果输出口（导出生成）',
      logic: `① 四类导出（家风馆导出/成果报告/宣传册生成/数据包导出）均在前端即时拼装 markdown/txt 文本，内容包含当前模板、配色、发布设置、开启模块与项目列表，经 downloadTextFile 触发浏览器下载，无后端接口。
② 导出期间按类型置「生成中/导出中」并禁用按钮，防止重复点击；异常时捕获并提示「导出失败」。
③ 口述史工程与政务客户服务卡片中的「成果输出」按钮复用同一导出逻辑，分别生成「口述史工程成果.md」与「政务家风建设成果报告.md」；其余按钮跳转 /interview 或 /government 相关页面。`,
    },
  ],
};
