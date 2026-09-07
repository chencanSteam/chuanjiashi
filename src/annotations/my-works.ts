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
② 状态三态：「采访进行中 / 传记修改中 / 已完成」——无传记快照为采访进行中，有内容但未定稿（draft）为传记修改中，已定稿（final）为已完成。
③ 状态决定主操作按钮的文案与跳转目标（见操作区标注）。`,
    },
    {
      id: 'my-works.earnings',
      target: '收益数据（售出 / 单价 / 累计收益）',
      logic: `① 售出份数与单价为按作品 id 生成的稳定伪随机 mock 数据（同一作品刷新不变）。
② 已设置公开授权售价的作品，单价与累计收益改用创作者真实设置（cj_work_license_settings_\${id}）；免费作品显示「免费」。`,
    },
    {
      id: 'my-works.work-actions',
      target: '操作区（继续 / 上架 / 删除）',
      logic: `① 采访进行中/传记修改中显示「继续完成」，已完成显示只读「查看传记」；完成作品不再提供编辑或查看档案。
② 「上架」与公开授权合并为同一个发布弹窗，仅已完成作品可见。
③ 「删除」二次确认后移除该档案及其全部关联 localStorage 数据；若删的是当前档案，则把 cj_current_archive_id 切到列表第一个。`,
    },
    {
      id: 'my-works.paid-services',
      target: '付费服务（下载 PDF / 出版实体书 / 生成二维码）',
      logic: `① 仅「已完成」的传记显示三个付费服务入口，标价分别为 ¥9.9 / ¥59 / ¥19.9。
② 未购买：点击弹出支付确认弹窗（作品、服务、说明、金额），确认后走 orderApi.create + paymentApi.pay 模拟微信支付；支付成功写入 localStorage「cj_work_paid_<档案id>」，永久开通（按钮变为「已开通」），订单可在「我的订单」与后台订单管理查看。
③ 已购买后点击直接执行：下载 PDF 跳转传记印刷页（/biography/print）下载；出版实体书生成实体书订单（type=book）等待平台履约；生成二维码弹出二维码弹窗（占位图 + 分享链接，可复制）。`,
    },
  ],
};
