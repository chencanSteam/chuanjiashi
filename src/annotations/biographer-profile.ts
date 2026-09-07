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
      target: '头部信息卡（预览 / 编辑切换）',
      logic: `① 数据加载：路由带 id 时调 biographerApi.get(id) 查看指定传记师；不带 id 时调 biographerApi.me() 查看自己的主页；接口失败显示「暂无传记师资料」。
② 本人视角（无 id 或登录手机号与档案一致）页面顶部显示「预览 / 编辑资料」切换：预览即当前介绍页，编辑资料在同页内嵌编辑表单（BiographerProfileEdit embedded 模式），不再跳转独立页面；旧路由 /biographer/profile/edit 重定向回本页。他人视角不显示切换。
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
② 套餐对比表：固定 6 个对比项（采访次数/传记字数/交付周期/实体书/影像资料/修改次数），直接展示套餐对应属性字段的值，未填写显示「—」。
③ 「预约此套餐」打开对应套餐的预约弹窗，按套餐价全额支付（无定金/尾款环节）。`,
    },
    {
      id: 'biographer-profile.reviews',
      target: '客户评价区',
      logic: `① 评价来自 biographerApi.getReviews(id)，查看他人主页按路由 id 加载，传记师查看自己的主页时按 me() 返回的传记师 id 加载。
② 星级分布按 5~1 星分别统计占比，评分缺省按 5.0 计；仅展示评分总览，不展示评价列表。
③ 评价由用户在订单完成后提交（biographerApi.submitReview），此处只读展示。`,
    },
    {
      id: 'biographer-profile.booking-modal',
      target: '预约下单弹窗',
      logic: `① 表单校验：采访对象姓名、与采访对象关系、期望采访时间、采访地点、联系电话 5 项必填，缺任一项拦截并提示「请填写完整的预约信息」；特殊需求选填。
② 联系电话默认带入当前登录用户的手机号（可修改）。
③ 提交：独立页面模式调 biographerApi.createOrder() 创建订单，成功后自动调 paymentApi.pay() 按套餐价全额支付（无定金/尾款环节）；嵌入模式则回调 onBookService 由父级页面处理下单。
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
