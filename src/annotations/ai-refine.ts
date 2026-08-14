import type { PageAnnotations } from './types';

/**
 * AI家风提炼页（/family-hall/ai-refine）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const aiRefineAnnotations: PageAnnotations = {
  page: 'ai-refine',
  pageName: 'AI提炼',
  route: '/family-hall/ai-refine',
  items: [
    {
      id: 'ai-refine.source-select',
      target: '素材来源选择',
      logic: `① 三种来源：「人生档案」「家风故事」正式版读取当前账号已有档案/故事数据，原型使用内置示例素材；「手动输入」由用户自行粘贴文本。
② 切换来源只改当前选中态，不校验、不保存；选中「手动输入」时才展开下方的素材输入框。
③ 同一来源可反复提炼，每次结果可不同（模板轮换，见「开始提炼」逻辑）。`,
    },
    {
      id: 'ai-refine.manual-input',
      target: '手动输入素材',
      logic: `① 仅当来源选为「手动输入」时显示，切换到其他来源即隐藏（输入内容保留在内存中，不清空）。
② 内容仅用于本次提炼，不写库；为空时点「开始提炼」会被拦截并提示「请输入家风素材」。`,
    },
    {
      id: 'ai-refine.generate',
      target: '「开始提炼 / 重新提炼」按钮',
      logic: `① 触发条件：点击后先校验——手动来源且内容为空则拦截报错；其余情况进入生成态（约 1.5 秒模拟 AI 处理），期间按钮禁用。
② 生成逻辑（原型）：从素材中提取「XXXX年」年份与 2-8 字中文词组作为关键词，按已生成次数轮换 4 套文案模板拼接结果；关键词不足 3 个时使用兜底词（忠厚/诚信/勤俭等）。
③ 每次生成把结果追加到「历史提炼」，写入 localStorage 键 cj_ai_refine_history，最多保留 20 条；正式版应调用 AI 提炼接口并扣减对应额度。`,
    },
    {
      id: 'ai-refine.result-actions',
      target: '提炼结果操作（复制 / 下载 / 保存）',
      logic: `① 结果区为可编辑文本框，用户可直接修改后再操作。
② 复制：写入系统剪贴板；下载：把当前结果生成「家风提炼.txt」文件下载；两者在结果为空时不执行。
③ 保存：以当前来源标签 + 时间生成一条记录，写入 localStorage 键 cj_ai_refine_saved，最多 50 条，并出现在下方「我的提炼」列表；结果为空时拦截提示。`,
    },
    {
      id: 'ai-refine.saved-list',
      target: '我的提炼（已保存列表）',
      logic: `① 页面加载时从 localStorage 键 cj_ai_refine_saved 读取，无记录则整卡不显示。
② 「载入」把该条文本回填到结果编辑区，可继续编辑或再次保存（会生成新记录）。
③ 「删除」立即移除该条并同步 localStorage，原型无二次确认。`,
    },
    {
      id: 'ai-refine.history',
      target: '历史提炼',
      logic: `① 每次「开始提炼 / 重新提炼」成功后自动追加，最新的在最前，最多保留 20 条。
② 存储于 localStorage 键 cj_ai_refine_history，刷新不丢失；只读展示，无删除入口。`,
    },
  ],
};
