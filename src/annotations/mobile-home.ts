import type { PageAnnotations } from './types';

/**
 * 移动端首页（/m）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const mobileHomeAnnotations: PageAnnotations = {
  page: 'mobile-home',
  pageName: '移动端首页',
  route: '/m',
  items: [
    {
      id: 'mobile-home.greeting',
      target: '问候区',
      logic: `① 用户名取自登录态（useAuth）：优先显示姓名，无姓名时显示手机号后 4 位，都为空时兜底「用户」。
② 未登录访问时由路由守卫拦截，本页不处理登录跳转。`,
    },
    {
      id: 'mobile-home.archive-card',
      target: '当前传记档案卡片',
      logic: `① 读取 localStorage「cj_current_archive_id」拿到当前档案 id，再从「cj_archives」列表中匹配出档案信息。
② 没有当前档案（或数据解析失败）时整张卡片不渲染。
③ 点击卡片跳转「人生档案」页（/m/archive）。`,
    },
    {
      id: 'mobile-home.quick-actions',
      target: '快捷功能宫格',
      logic: `① 六个入口为固定配置：AI 采访（/m/interview）、人生档案（/m/archive）、家庭空间（/m/family）、传记作品（/m/works）、照片修复（/m/photo-restore）、设置（/m/profile）。
② 点击直接路由跳转，无权限区分；正式版可按账号角色/开通功能控制显隐。`,
    },
    {
      id: 'mobile-home.recent-activity',
      target: '最近动态',
      logic: `① 当前为固定空态（暂无新动态），正式版应聚合该账号下的采访进度、传记生成、家庭动态等事件流。
② 空态下展示「去采访」引导按钮，点击跳转 AI 采访页（/m/interview）。`,
    },
  ],
};
