import type { PageAnnotations } from './types';

/**
 * 编辑资料（「我的介绍页」编辑模式，/biographer/profile）的逻辑标注。
 * 原独立路由 /biographer/profile/edit 已重定向到 /biographer/profile，编辑表单内嵌于介绍页。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const biographerProfileEditAnnotations: PageAnnotations = {
  page: 'biographer-profile-edit',
  pageName: '编辑资料',
  route: '/biographer/profile',
  items: [
    {
      id: 'biographer-profile-edit.avatar',
      target: '头像上传',
      logic: `① 点击「上传头像」触发隐藏文件选择框，图片经 uploadFile()（POST /api/upload）上传后回填 form.avatar。
② 未上传头像时用姓名首字占位；上传失败仅 toast 提示，不影响其他编辑内容。`,
    },
    {
      id: 'biographer-profile-edit.basic',
      target: '基本信息表单',
      logic: `① 进入页面调 biographerApi.me()（GET /api/biographer/me）回填全部资料；服务区域为空时默认取所在城市。
② 姓名、手机号为必填项，在保存时统一校验；从业年限按整数解析，非法输入归为 0。
③ 所有编辑只改本地 form 状态，点「保存资料」才提交后端。`,
    },
    {
      id: 'biographer-profile-edit.tags',
      target: '专长领域 / 服务区域 / 个人标签',
      logic: `① 三处标签共用同一交互：输入后回车或点「+」添加，空内容忽略；点标签上的 × 删除。
② 标签分别写入 form.specialties / form.serviceAreas / form.tags，不做去重校验，随保存一并提交。
③ 保存后同步展示在传记师介绍页的标签与筛选中。`,
    },
    {
      id: 'biographer-profile-edit.services',
      target: '服务套餐编辑',
      logic: `① 「添加套餐」追加一条空套餐（id 按时间戳 svc_xxx 生成），点 × 删除整条。
② 每个套餐单独填写：名称、价格、描述，以及六项对比属性——采访次数 / 传记字数 / 交付周期 / 修改次数为自由文本，实体书 / 影像资料为「含 / 不含」单选。
③ 价格按整数解析，非法输入归为 0；未填名称/价格的空套餐也会随保存提交，需平台侧约束。
④ 套餐保存后展示在介绍页，价格排序决定「推荐」档位；六项属性展示在「套餐对比」表，未填显示 —。`,
    },
    {
      id: 'biographer-profile-edit.cases',
      target: '成功案例编辑',
      logic: `① 「添加案例」追加空案例（id 按时间戳 case_xxx 生成），标题、简介即时编辑，点 × 删除。
② 点击案例封面区域上传封面图（uploadFile，仅图片），无封面时显示占位图标；上传失败 toast 提示。
③ 案例保存后展示在介绍页「成功案例」区。`,
    },
    {
      id: 'biographer-profile-edit.certificates',
      target: '资质证明上传',
      logic: `① 支持一次多选图片上传（uploadFile，POST /api/upload），逐张追加到 certificates 数组。
② 每张证明可单独点 × 删除；上传失败 toast 提示，已上传的不受影响。
③ 证明图片保存后展示在介绍页「资质证明」区，供委托方查看。`,
    },
    {
      id: 'biographer-profile-edit.save',
      target: '底部「保存资料 / 取消」按钮',
      logic: `① 保存前校验：姓名、手机号必填，缺失则拦截并提示「请填写姓名和手机号」。
② 调 biographerApi.updateProfile(form)（PUT /api/biographer/me）全量提交 form，成功后 toast 并跳转回介绍页 /biographer/profile。
③ 「取消」直接跳转工作台 /biographer，所有未保存的修改丢弃；保存中两个按钮均禁用防重复。`,
    },
  ],
};
