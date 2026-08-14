import type { PageAnnotations } from './types';

/**
 * 我的传记页（/my-works）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const myWorksAnnotations: PageAnnotations = {
  page: 'my-works',
  pageName: '我的传记',
  route: '/my-works',
  items: [
    {
      id: 'my-works.new-biography',
      target: '「新建传记」按钮',
      logic: `① 跳转 /onboarding 建档流程；列表为空时空态区也提供同样的入口。
② 建档完成后新档案会出现在本列表，初始状态为「未开始」。`,
    },
    {
      id: 'my-works.work-status',
      target: '作品卡片（信息与状态）',
      logic: `① 列表数据 = mock 后端档案（archiveApi.list）与本地 cj_archives 合并去重；接口失败时只用本地数据。
② 状态按 localStorage 关键键推导，优先级从高到低：有 cj_events_\${id} → 已同步档案；有 cj_biography_\${id} → 已生成传记；有 cj_interview_transcript_\${id} → 采集中；有 cj_interview_outline_\${id} → 待采访；否则未开始。
③ 状态决定主操作按钮的文案与跳转目标（见操作区标注）。`,
    },
    {
      id: 'my-works.earnings',
      target: '收益数据（售出 / 单价 / 累计收益）',
      logic: `① 售出份数与单价为按作品 id 生成的稳定伪随机 mock 数据（同一作品刷新不变）。
② 已设置公开授权售价的作品，单价与累计收益改用创作者真实设置（cj_work_license_settings_\${id}）；免费作品显示「免费」。`,
    },
    {
      id: 'my-works.license',
      target: '公开授权开关',
      logic: `① 打开开关：弹出「公开到书架」设置（免费/付费、售价、试看字数），确认后调 bookshelfApi.publish 提交审核；状态存 cj_work_license_\${id}='public'，设置存 cj_work_license_settings_\${id}；已上架过的作品复用原书记录更新。
② 已公开后下方显示售价与试看字数，可点「授权设置」修改并重新提交审核。
③ 关闭开关：状态置 'off'，提示「下架申请已提交，审核通过后将从书架移除」（原型无真实审核流）。`,
    },
    {
      id: 'my-works.work-actions',
      target: '操作区（继续 / 上架 / 实体书 / 删除）',
      logic: `① 主按钮按状态跳转，点击前先把作品 id 写入 cj_current_archive_id：未开始/待采访 → /interview（继续采访）；采集中/已生成传记 → /biography（编辑传记）；已同步档案 → /archive（查看档案）。
② 「上架」仅 已生成传记/已同步档案 可见，打开发布弹窗（PublishBookModal）；「制作实体书」跳 /store 并携带 archiveId。
③ 「删除」二次确认后移除该档案及其全部关联 localStorage 数据（事件、素材、成员、传记、采访记录等约 10 个 key，不可恢复）；若删的是当前档案，则把 cj_current_archive_id 切到列表第一个。`,
    },
  ],
};
