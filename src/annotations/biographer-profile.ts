import type { PageAnnotations } from './types';

/**
 * 传记师介绍页（/biographer/profile）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const biographerProfileAnnotations: PageAnnotations = {
  page: 'biographer-profile',
  pageName: '传记师介绍页',
  route: '/biographer/profile',
  items: [
    {
      id: 'biographer-profile.header',
      target: '头部信息卡（头像 / 编辑入口）',
      logic: `① 数据加载：路由带 id 时调 biographerApi.get(id) 查看指定传记师；不带 id 时调 biographerApi.me() 查看自己的主页；接口失败显示「暂无传记师资料」。
② 本人视角判定（无 id 或登录手机号与档案一致）：显示「编辑资料」入口，点击跳转 /biographer/profile/edit；他人视角不显示。
③ 头像未设置时用姓名首字占位；姓名旁展示常驻城市与评分（头衔字段已录入但暂不展示，待传记师分级体系上线后恢复），下方数据条含从业年限、完成订单、累计评价、用户评分与好评率。`,
    },
    {
      id: 'biographer-profile.certificates',
      target: '荣誉证书区',
      logic: `① 展示传记师获得的荣誉与资质证书，如作协会员证、传记师职业资格证书等。
② 证书条目是图片地址时按图展示；只有名称时展示占位卡片（原型未上传真实扫描件）。`,
    },
    {
      id: 'biographer-profile.actions',
      target: '「留言咨询」按钮',
      logic: `① 点击打开留言咨询弹窗，填写称呼、联系电话和留言内容后提交。
② 联系电话默认带入当前登录用户的手机号（可修改）。`,
    },
    {
      id: 'biographer-profile.services',
      target: '服务套餐与套餐对比',
      logic: `① 「推荐」标记：全部套餐按价格升序排序后取中间档为推荐套餐，顶部「立即预约」默认选中该档。
② 套餐对比表：固定 6 个对比项（采访次数/传记字数/交付周期/实体书/影像资料/修改次数），按套餐描述文案是否包含对应关键词渲染对勾或「—」。
③ 「预约此套餐」打开对应套餐的预约弹窗，定金按传记师设置的押金或套餐价的 30% 计算。`,
    },
    {
      id: 'biographer-profile.reviews',
      target: '客户评价区',
      logic: `① 评价来自 biographerApi.getReviews(id)，仅查看他人主页（路由带 id）时加载；自己的主页不拉取、展示为空。
② 星级分布按 5~1 星分别统计占比，评分缺省按 5.0 计；列表最多展示前 6 条评价。
③ 评价由用户在订单完成后提交（biographerApi.submitReview），此处只读展示。`,
    },
    {
      id: 'biographer-profile.booking-modal',
      target: '预约下单弹窗',
      logic: `① 表单校验：采访对象姓名、与采访对象关系、期望采访时间、采访地点、联系电话 5 项必填，缺任一项拦截并提示「请填写完整的预约信息」；特殊需求选填。
② 联系电话默认带入当前登录用户的手机号（可修改）。
③ 提交：独立页面模式调 biographerApi.createOrder() 创建订单，成功后自动调 paymentApi.pay() 发起定金微信支付（定金=传记师押金或套餐价 30%）；嵌入模式则回调 onBookService 由父级页面处理下单。
④ 成功后关闭弹窗，嵌入模式下同时关闭整个介绍页弹层。`,
    },
    {
      id: 'biographer-profile.message',
      target: '留言咨询弹窗',
      logic: `① 称呼、联系电话、留言内容三项必填，缺任一项拦截并提示；提交后提示「留言已提交，传记师会尽快与您联系」。
② 留言内容仅做提交演示，不产生真实消息记录（原型为本地模拟）。`,
    },
  ],
};
