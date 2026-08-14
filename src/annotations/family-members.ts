import type { PageAnnotations } from './types';

/**
 * 家庭成员列表页（/family/members）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyMembersAnnotations: PageAnnotations = {
  page: 'family-members',
  pageName: '家庭成员列表',
  route: '/family/members',
  items: [
    {
      id: 'family-members.add-member',
      target: '「+ 添加成员」按钮与添加行',
      logic: `① 点击展开添加行，只有姓名一个字段，回车或点「添加」提交；姓名 trim 后为空直接不响应。
② 重名校验：与现有成员同名时拦截并 toast「该成员已存在」。
③ 提交调 familyApi.addOrUpdateMember（POST /api/families/{archiveId}/members），新成员默认角色「成员」、代数「其他」；成功后追加到列表末尾并收起输入行。
④ 接口异常时 toast 后端返回的错误信息，输入内容保留。`,
    },
    {
      id: 'family-members.search',
      target: '成员搜索框',
      logic: `① 纯前端过滤：按姓名 includes 实时匹配，不重新请求接口。
② 页头标题「家庭成员（N人）」中的 N 是全量成员数，不随搜索结果变化。`,
    },
    {
      id: 'family-members.member-grid',
      target: '成员列表',
      logic: `① 进入页面即按当前档案加载成员：archiveId 读 localStorage 的「cj_current_archive_id」（缺省 'default'），调 familyApi.members（GET /api/families/{archiveId}/members）。
② 接口失败时静默降级为空列表（catch 后 setMembers([])），页面不报错。
③ 点击成员卡片跳转详情页 /family/members/:name（name 经 encodeURIComponent 编码）；「已故」标签带特殊置灰样式。`,
    },
    {
      id: 'family-members.bottom-actions',
      target: '底部快捷入口',
      logic: `① 「家庭成员资料」固定跳转张明远的详情页（/family/members/张明远），为演示写死。
② 「关系维护」「角色权限」分别跳转 /family/relations、/family/roles。`,
    },
  ],
};
