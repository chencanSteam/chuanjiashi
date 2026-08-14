import type { PageAnnotations } from './types';

/**
 * 家风馆项目详情（/family-hall/project/:name）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const hallProjectAnnotations: PageAnnotations = {
  page: 'hall-project',
  pageName: '家风馆项目详情',
  route: '/family-hall/project',
  items: [
    {
      id: 'hall-project.info',
      target: '项目信息卡（名称 / 状态 / 简介）',
      logic: `① 馆名取自路由参数 :name，经 decodeURIComponent 解码后查静态 projectData。
② 查无此馆时兜底展示「张氏家风馆」数据，但页面标题仍显示传入的原始馆名。
③ 状态、简介、模块清单均为 mock 常量，状态切换仅改本页内存 state，不影响家风馆首页的项目列表。`,
    },
    {
      id: 'hall-project.header-actions',
      target: '预览 / 保存 / 发布',
      logic: `① 预览：跳转 /family-hall/deploy 部署页。
② 保存：仅记录保存时间并 toast 提示，按钮回显「保存于 时间」，不落库。
③ 发布：把状态置为「已发布」，按钮随即变为禁用态「已发布」；仅内存状态，刷新后还原为 mock 初始状态。`,
    },
    {
      id: 'hall-project.module-list',
      target: '页面模块列表（启用 / 隐藏）',
      logic: `① 模块清单来自 projectData 中该馆配置的 modules，点击模块卡片跳转模块管理页 /family-hall/project/{馆名}/{rules|stories|courses|election|mentor}，未知模块名兜底 rules。
② 眼睛按钮切换模块启用/隐藏（已 stopPropagation，不触发卡片跳转），显隐结果只体现在卡片样式（active 高亮），未持久化，刷新还原。`,
    },
    {
      id: 'hall-project.deploy-entry',
      target: '部署入口（H5链接 / 二维码 / 分享海报）',
      logic: `① 三个按钮均跳转 /family-hall/deploy，由部署页按 Tab 展示对应内容。
② 跳转不携带当前馆名，部署页固定展示「张氏家风馆」的链接与物料（演示数据）。`,
    },
  ],
};
