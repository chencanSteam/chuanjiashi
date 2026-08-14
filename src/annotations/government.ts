import type { PageAnnotations } from './types';

/**
 * 政务服务页（/government）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const governmentAnnotations: PageAnnotations = {
  page: 'government',
  pageName: '政务服务',
  route: '/government',
  items: [
    {
      id: 'government.stats',
      target: '服务概览数据卡',
      logic: `① 四项指标（本月办理、平均时长、已办结、待补充）为静态演示数据。
② 点击任一数据卡跳转政务数据看板（/government/dashboard）。`,
    },
    {
      id: 'government.services',
      target: '常用政务服务',
      logic: `① 四个服务入口各带固定业务编号（如亲属关系证明 ZJ-20260618-001）。
② 点击服务卡片跳转申报详情页 /government/application/:code，编号经 URL 编码后作为路由参数传入，详情页按编号匹配业务数据。`,
    },
    {
      id: 'government.tasks',
      target: '我的办理',
      logic: `① 展示当前用户的办件列表（静态演示数据），状态徽标分「审核中 / 待补充 / 已办结」三档，样式按状态名匹配。
② 点击单条办件跳转 /government/application/:id 查看详情；右上角「查看全部」固定跳转编号 ZJ-20260618-001 的详情页（原型未做列表页）。`,
    },
    {
      id: 'government.cert-apply',
      target: '申请证明',
      logic: `① 证明名称必填，去除首尾空格后为空则拦截并 toast 报错；回车等同点击「提交」。
② 提交成功后自动生成编号：AP-YYYYMMDD-序号（序号为当前证明数 +1，三位补零），状态置为「审核中」并插入列表最前。
③ 新证明仅存于页面 state，刷新后丢失（原型未接后端）。`,
    },
    {
      id: 'government.cert-list',
      target: '我的证明列表',
      logic: `① 点击证明条目选中并在右侧预览区展示对应证明（按列表下标选中）。
② 每条证明可单独下载：前端用 Blob 拼出文本文件（标题/编号/状态/时间）触发浏览器下载，按钮阻止冒泡、不改变选中状态。`,
    },
    {
      id: 'government.cert-preview',
      target: '证明预览 / 打印',
      logic: `① 预览内容跟随左侧选中的证明动态切换标题与编号；未选中时回退到第一条的默认文案。
② 「打印」直接调浏览器 window.print() 打印当前页面。`,
    },
    {
      id: 'government.inherit',
      target: '档案继承管理',
      logic: `① 新增继承人：通过浏览器 prompt 输入姓名，非空即 toast 成功（原型仅演示，不落库）。
② 继承人列表为静态数据，均显示「已实名核验」；点「查看权限」弹窗展示该继承人的权限项（查看档案 / 下载证明 / 管理继承人权限）。
③ 业务规则（页面说明文案）：继承遵循生前遗嘱及法定继承顺序，继承人须完成身份核验后方可接管档案。`,
    },
    {
      id: 'government.audit',
      target: '信息核验',
      logic: `① 核验内容必填，为空则拦截并 toast 报错；核验中按钮禁用并显示「核验中…」。
② 核验为模拟流程：1.2 秒延时后固定返回「核验通过：XX 与档案信息一致」。
③ 下方三步流程（身份比对 → 一致性校验 → 接口返回）为状态展示，第三步图标颜色随核验结果切换。`,
    },
  ],
};
