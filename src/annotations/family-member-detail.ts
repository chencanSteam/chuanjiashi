import type { PageAnnotations } from './types';

/**
 * 家庭成员详情页（/family/members/:name）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyMemberDetailAnnotations: PageAnnotations = {
  page: 'family-member-detail',
  pageName: '家庭成员详情',
  route: '/family/members',
  items: [
    {
      id: 'family-member-detail.member-info',
      target: '成员资料卡（联系信息与简介）',
      logic: `① 路由参数 :name 经 decodeURIComponent 解码后，在当前档案的成员列表中按姓名精确匹配；列表来自 familyApi.members（GET /api/families/{archiveId}/members），archiveId 读 localStorage「cj_current_archive_id」，缺省 'default'。
② 匹配不到或接口失败时走 getDefaultMember 兜底：生成临时 id，电话/邮箱/出生日期显示「-」，简介显示「暂无详细介绍」，页面仍可正常打开。
③ 空的联系方式字段统一显示「-」。`,
    },
    {
      id: 'family-member-detail.albums',
      target: '相关相册',
      logic: `① 固定展示 3 本演示相册（2024春游记/春节团圆/成长记录），与当前成员无真实关联逻辑。
② 点击相册跳转对应相册详情页（/family/album/:title，title 经 encodeURIComponent 编码）。`,
    },
    {
      id: 'family-member-detail.actions',
      target: '「编辑资料」/「人生时间轴」按钮',
      logic: `① 「编辑资料」打开编辑弹窗，表单初始值取当前展示的成员数据（含兜底数据）。
② 「人生时间轴」跳转 /archive（人生档案时间轴页），不带成员参数。`,
    },
    {
      id: 'family-member-detail.edit-modal',
      target: '编辑资料弹窗',
      logic: `① 可编辑 5 个字段：联系电话、电子邮箱、现居地、出生日期、个人简介；无格式校验，允许留空。
② 保存调 familyApi.addOrUpdateMember（POST /api/families/{archiveId}/members）整体提交成员对象：列表中已存在的成员就地更新，兜底生成的新成员追加进列表。
③ 保存成功 toast「资料已保存」并关闭弹窗；接口异常时 toast 后端错误信息，弹窗保持打开。
④ 点遮罩或 × 直接关闭不保存；成员数据变化时表单通过 useEffect 重新回显最新值。`,
    },
  ],
};
