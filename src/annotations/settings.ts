import type { PageAnnotations } from './types';

/**
 * 系统设置页（/settings）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const settingsAnnotations: PageAnnotations = {
  page: 'settings',
  pageName: '系统设置',
  route: '/settings',
  items: [
    {
      id: 'settings.account',
      target: '账号与安全（行式列表）',
      logic: `① 账号信息按行式列表展示：头像与昵称、实名认证、绑定微信、绑定手机号、电子邮箱、所在社区/小区，每行为图标 + 标题 + 描述 + 右侧状态或操作。
② 修改昵称 / 真实姓名 / 手机号 / 邮箱均弹出编辑弹窗，保存即生效；所在社区/小区弹窗中地区为省/市/区级联选择（data/regions，三级必选），小区为自由输入，保存后社区按「省 市 区」拼接写回；账号姓名写回优先级：真实姓名 > 昵称（updateUser），社区、小区同步写回；手机号、邮箱、绑定微信仅展示，不写回账号。
③ 更换头像选择本地图片转 base64 预览，保存后生效；保存中按钮禁用，失败 toast 报错。`,
    },
    {
      id: 'settings.invite',
      target: '我的邀请（佣金与提现）',
      logic: `① 统计、收益记录、提现记录分别来自 mock 接口 commissionApi.summary / list / withdrawals；提现成功后触发刷新重新拉取。
② 邀请链接为 #/login?invite=<我的邀请码>，被邀请人经该链接注册后建立一级直推关系（好友再邀请的人不计入我的收益）。
③ 提现金额须为正数，余额不足时接口报错拦截；佣金有 7 天冻结期，冻结中不可提现（规则说明可展开查看）。`,
    },
    {
      id: 'settings.quota',
      target: 'AI 额度与升级套餐',
      logic: `① 进入本区调用 mock 接口 quotaApi.get 读取当前套餐与用量，失败时回退到默认演示额度。
② 任一额度（采访问题/延伸问题/传记生成/数字人对话）用尽时，列表上方出现提示条。
③ 升级套餐为 mock 支付（约 900ms 模拟），支付中按钮与弹窗关闭均禁用；成功后更新各项额度上限并写回 localStorage \`cj_mock_ai_quota\`，刷新后仍生效。`,
    },
    {
      id: 'settings.notification',
      target: '通知设置',
      logic: `① 六类通知开关仅保存在页面状态（演示用），切换即时 toast 提示，但不持久化，刷新后恢复默认。`,
    },
    {
      id: 'settings.privacy',
      target: '隐私与安全（含注销账户）',
      logic: `① 两步验证开关为演示状态，不持久化；「家庭成员可见范围」弹窗可对基本信息/多媒体档案/人生事件/成就与作品分别设置仅自己/家人可见/部分公开/公开展示。
② 注销账户需在输入框完整输入「确认注销」四个字，确认按钮才可点击；演示环境仅 toast 提示已提交，不真正清除数据。`,
    },
    {
      id: 'settings.family',
      target: '家庭成员',
      logic: `① 初始成员为演示数据；「添加成员」通过浏览器 prompt 输入姓名直接加入列表（角色默认「成员」）。
② 点击成员行跳转成员详情页 /family/members/<姓名>；点「管理」弹窗可改角色/手机/邮箱，仅修改本地页面状态。`,
    },
    {
      id: 'settings.storage',
      target: '存储与备份',
      logic: `① 存储用量条为静态演示数据；「自动备份」开关与备份频率仅保存页面状态。
② 「立即备份」遍历 localStorage 中全部 \`cj_\` 前缀数据（含 \`cj_mock_\`），打包为 JSON 文件下载，可用于换机恢复；异常时 toast 报错。`,
    },
    {
      id: 'settings.help',
      target: '帮助与反馈',
      logic: `① 帮助文章为内置文案，点击弹窗查看全文。
② 「重新观看新手指引」调用 openGuide 重新播放全站引导浮层。`,
    },
  ],
};
