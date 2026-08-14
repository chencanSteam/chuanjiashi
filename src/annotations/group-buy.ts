import type { PageAnnotations } from './types';

/**
 * 拼团活动页（/group-buy）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const groupBuyAnnotations: PageAnnotations = {
  page: 'group-buy',
  pageName: '拼团活动',
  route: '/group-buy',
  items: [
    {
      id: 'group-buy.launch',
      target: '「发起拼团」按钮',
      logic: `① 需登录，未登录 toast 拦截；点击即支付并创建拼团记录（groupBuyApi.join(undefined, true)），支付中按钮禁用防重复。
② 发起成功后自动弹出「邀请好友参团」弹窗并刷新列表。
③ 活动价、成团规则文案、拼团时长由 groupBuyApi.activity() 下发；接口异常时按 99 元 / 24 小时兜底展示。`,
    },
    {
      id: 'group-buy.tabs',
      target: '「进行中的团 / 我的拼团」切换',
      logic: `① 进行中的团：status = pending 且未到截止时间的团，按剩余时间升序排列（快截止的排前面）。
② 我的拼团：按当前账号（mock 用户 id 规则为 u_手机号）匹配「我发起的 + 我参与的」全部记录，按创建时间倒序；未登录时为空态。`,
    },
    {
      id: 'group-buy.ongoing-card',
      target: '进行中的团卡片（进度 / 参团 / 邀请）',
      logic: `① 进度条 = 已拼人数 / 目标人数（封顶 100%）；剩余时间每秒刷新，到期显示「已结束」；团长手机号脱敏展示（前 3 后 4）。
② 参团：需登录；同一账号已在该团内则拦截并提示「同一账号限参 1 次」；支付成功（groupBuyApi.join(recordId, false)）后刷新列表。
③ 「邀请好友」打开分享弹窗，可复制带参链接。`,
    },
    {
      id: 'group-buy.my-record',
      target: '我的拼团记录（状态与结果公示）',
      logic: `① 状态三态：pending 且未到期 = 拼团中；success = 已成团；其余（超时未成团结算 / failed）= 已退款。
② 已成团时公示免单结果：系统随机抽取 1 人免单、款项原路退回，抽中本人显示「你」，否则显示脱敏手机号。
③ 未在规定时间内成团的显示「款项已自动退回」说明。`,
    },
    {
      id: 'group-buy.share-modal',
      target: '邀请好友弹窗',
      logic: `① 邀请链接格式：当前域名 + #/group-buy?recordId=xx，好友打开后可定位到对应拼团；弹窗实时显示「还差 N 人成团」。
② 复制走浏览器剪贴板 API，成功提示已复制，失败时提示手动复制。`,
    },
  ],
};
