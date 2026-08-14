import type { PageAnnotations } from './types';

/**
 * 数字博物馆页（/museum）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const museumAnnotations: PageAnnotations = {
  page: 'museum',
  pageName: '数字博物馆',
  route: '/museum',
  items: [
    {
      id: 'museum.interactions',
      target: '点赞 / 献花 / 点烛',
      logic: `① 三个互动按钮分别调用 museumApi.like / flower / candle，成功后用返回的最新计数同步刷新顶部数字与下方统计卡。
② 接口异常时 toast 报错，计数不回滚（保持原值）。
③ 页面数据整体来自 museumApi.get：路由带 archiveId 时按参数加载；不带参数时默认取本人第一个档案馆，本人无档案时展示演示数字馆（archiveId = demo）。`,
    },
    {
      id: 'museum.stats',
      target: '访问统计区',
      logic: `① 数据来自 museumApi.stats：总访问量、访客人数、获赞与近 7 日每日访问明细。
② 趋势柱状图按当日最大值归一化计算高度，数据为空时按 1 兜底避免除零。`,
    },
    {
      id: 'museum.tabs',
      target: '展馆内容 Tab',
      logic: `① 7 个 Tab：时间轴、完整传记、相册、荣誉、家风家训、纪念视频、数字人对话，数据均随 museumApi.get 一次性返回，各 Tab 仅有空态文案差异。
② 「家风家训」：传记未生成时引导跳「/interview」完成 AI 采访；已生成则进入该 Tab 时才额外调 biographyApi.derivatives 拉取家风总结、人生金句、写给后人的话（懒加载）。
③ 「纪念视频」：读 localStorage「cj_memorial_video_status」，为 done 显示已生成入口，否则引导去「/digital-assets」生成。
④ 「数字人对话」直接跳转「/digital-companion」。`,
    },
    {
      id: 'museum.messages',
      target: '思念留言',
      logic: `① 发表前校验：未登录（useAuth 无 user）拦截并提示「请先登录」；内容为空或纯空格时按钮禁用。
② 提交调 museumApi.postMessage，成功后新留言插入列表顶部并清空输入框；失败 toast 报错。
③ 留言列表随页面加载从 museumApi.messages 读取，按时间倒序展示，头像取昵称首字。`,
    },
    {
      id: 'museum.share',
      target: '分享数字馆（链接 / 二维码）',
      logic: `① 分享链接按当前域名拼接「#/museum/{archiveId}」生成。
② 「复制链接」写剪贴板，失败时提示手动复制。
③ 「二维码」弹窗内的图案是按链接内容哈希生成的占位图案（演示用，非真实可扫二维码）。`,
    },
    {
      id: 'museum.visibility',
      target: '权限设置',
      logic: `① 四种可见性：公开访问、私密（仅家人）、密码访问、家人共享；初始值取服务端 museum.visibility 与已设密码。
② 选「密码访问」时出现密码输入框；保存时密码为空则拦截并提示「请设置访问密码」，非密码模式提交时不带密码字段。
③ 选「家人共享」出现邀请区：输入姓名/手机号回车或点「邀请」即加入已邀请列表（仅前端演示，toast 注明演示），不调用真实接口。
④ 「保存设置」调 museumApi.update 持久化可见性与密码，成功后提示并刷新本地状态。`,
    },
  ],
};
