import type { PageAnnotations } from './types';

/**
 * 传记师工作台（/biographer）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const biographerCenterAnnotations: PageAnnotations = {
  page: 'biographer-center',
  pageName: '传记师工作台',
  route: '/biographer',
  items: [
    {
      id: 'biographer-center.stats',
      target: '订单统计卡片区',
      logic: `① 页面加载时并行请求 biographerApi.me()（GET /api/biographer/me，当前传记师档案）与 biographerApi.myOrders()（GET /api/biographer/orders，我的订单列表），两者都结束后关闭加载态；任一失败则对应模块降级为空（资料不渲染 / 订单为空数组）。
② 统计口径：全部订单=订单总数；待处理=状态为待预约采访/已预约采访的订单数；进行中=已提交初稿/修改中/已提交终稿；已完成=已完成/售后中。`,
    },
    {
      id: 'biographer-center.profile',
      target: '我的资料卡片',
      logic: `① 数据来自 biographerApi.me()，即当前登录账号对应的传记师档案；接口失败时整块「我的资料」不渲染，页面仅保留统计卡。
② 头像未上传时用姓名首字占位；邮箱为空时该行不显示；其余字段（电话、从业年限、简介）按档案原样展示，编辑入口在「传记师介绍页」（/biographer/profile）。`,
    },
  ],
};
