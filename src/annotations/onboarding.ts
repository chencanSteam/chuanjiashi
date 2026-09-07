import type { PageAnnotations } from './types';

/**
 * 新手引导页（/onboarding）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const onboardingAnnotations: PageAnnotations = {
  page: 'onboarding',
  pageName: '新手引导',
  route: '/onboarding',
  items: [
    {
      id: 'onboarding.basic-form',
      target: '第一步：填写基本信息',
      logic: `① 姓名必填、籍贯为省/市/区级联必选，缺任一项点「下一步」会被拦截提示；出生日期为年/月/日三个下拉（选了就要选全），性别默认男，详细地址选填。
② 职业为「行业 → 职业」二级下拉（先选行业再选职业）；姓名默认带入当前登录账号的姓名，可修改。
③ 与「新建档案」表单字段保持一致，提交的出生日期（birthDate）与籍贯（省市区+详细地址）结构相同。`,
    },
    {
      id: 'onboarding.stages',
      target: '第二步：添加人生阶段',
      logic: `① 可添加任意多个人生阶段（起止年份、阶段名称、补充说明），起止年份同样限 4 位数字；每行可单独移除。
② 本步无必填校验，可一个阶段都不填直接进入下一步；是否填写会影响第三步提纲的结构。`,
    },
    {
      id: 'onboarding.outline',
      target: '第三步：采访提纲',
      logic: `① 提纲在进入本步时根据前两步信息生成：固定含「成长与家庭」「学习与成长」「人生感悟」三组问题，首题引用所填姓名与籍贯。
② 每填写一个人生阶段追加一组 3 题（引用阶段名称与说明）；未填阶段时用「工作与事业」组替代，并引用所填职业。
③ 此处为只读预览，进入采访页后仍可调整。`,
    },
    {
      id: 'onboarding.start',
      target: '底部操作（上一步 / 下一步 / 开始AI采访）',
      logic: `① 「上一步」仅在第 2、3 步显示；「下一步」在第 1 步做必填校验、第 2 步触发提纲生成。
② 第 3 步点「开始 AI 采访」：调用 mock 接口 archiveApi.create 创建档案（类型 self、状态 living），同时按旧格式写入 localStorage \`cj_archives\` / \`cj_current_archive_id\`，供未迁移页面读取。
③ 提纲写入 localStorage \`cj_interview_outline_<档案id>\`，清除新用户标记（isNewUser=false）后跳转 /interview；创建失败 toast 报错并留在本页。`,
    },
  ],
};
