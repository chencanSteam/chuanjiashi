import type { PageAnnotations } from './types';

/**
 * AI传记生成页（/biography）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const biographyAnnotations: PageAnnotations = {
  page: 'biography',
  pageName: 'AI传记生成',
  route: '/biography',
  items: [
    {
      id: 'biography.archive-switch',
      target: '选择传记（切换档案）',
      logic: `① 下拉列出本账号全部档案（cj_archives），可为任意档案生成传记。
② 切换后写入 cj_current_archive_id 并整页刷新，章节目录、文风、字数档位、素材等均按新档案重新读取。
③ 无档案时按 'default' 走演示数据。`,
    },
    {
      id: 'biography.import',
      target: '导入已有传记',
      logic: `① 支持粘贴文本或上传 .txt/.doc/.docx/.pdf 文件，读取后需点「确认导入」才生效；内容为空时拦截。
② 按预设章节标题正则自动把全文拆分到对应章节；一个标题都识别不到时，整段导入当前选中章节。
③ 被导入的章节状态置「已编辑」并刷新更新时间，随后自动持久化到 cj_biography_chapters_\${archiveId}。`,
    },
    {
      id: 'biography.save-works',
      target: '「保存到我的传记」按钮',
      logic: `① 把当前全部章节（标题 + 正文）整体快照写入 cj_biography_\${archiveId}，书名固定为「{传主}传记」、整理人「AI 整理」。
② 保存后跳转 /my-works；传记印刷页优先读这份快照，未保存过则回退读章节草稿。`,
    },
    {
      id: 'biography.simulate-pay',
      target: '「模拟支付 ¥99」按钮',
      logic: `① V1.0 起显示（出版购买流程）；未登录（无手机号）直接拦截提示。
② 调 orderApi.create 创建 ¥99「AI 传记标准版」订单（关联当前档案），再用 paymentApi.pay 模拟微信支付。
③ 成功 toast 显示交易号后 8 位；失败提示原因。原型为 mock 支付，不产生真实扣款。`,
    },
    {
      id: 'biography.chapter-tree',
      target: '章节目录',
      logic: `① 章节结构优先采用「已确认的传记大纲」；检测到大纲升版（version 变化）时按新大纲重建目录，同名章节保留已生成内容与状态。
② 点「编辑」进入目录编辑：支持改名、上移/下移、删除、添加章节，所有改动即写 cj_biography_chapters_\${archiveId}。
③ 底部完成度 = 已生成章节数 / 总章节数；存在已确认大纲时显示「大纲 vN · 已确认」。`,
    },
    {
      id: 'biography.editor',
      target: '章节编辑器（生成 / 润色 / 插图 / 保存）',
      logic: `① 「生成本章 / 重新生成本章」：先扣 biographyGenerate 额度（不足则拦截并提示）；全部章节均未生成时视为首次生成——资料完整度 <40% 先弹「材料较少」提示，可选去补充采访或仍然生成。
② 生成路径：有已确认大纲时按大纲章节关联的时间轴素材本地组装正文，不走 mock 接口；否则首次生成调 biographyApi.generate（按文风+字数档位），单章重新生成调 biographyApi.regenerateChapter。
③ 编辑器为 contentEditable 富文本：手动输入即把状态置「已编辑」并自动持久化；「插入图片」校验必须为图片且 ≤2MB，以 base64 内嵌进正文。
④ 「润色本章」在原文末尾追加润色结果并置「已编辑」（未生成章节禁用）；「保存本章」更新状态与最后更新时间。
⑤ 头部实时统计字数（去 HTML 标签、去空白）。`,
    },
    {
      id: 'biography.materials-settings',
      target: '本章参考素材 + 文风 / 字数设置',
      logic: `① 这里展示当前传记主人公在人生档案里上传的照片、视频、音频和文档，按类型分组，点击可以预览；没有素材时可以点「去上传」跳转添加。
② 文风有四种可选（朴实自然 / 温情叙事 / 典雅文言 / 新闻纪实），字数有三档（约 5 千 / 1.5 万 / 3 万）。
③ 选好之后系统会自动记住，下一次生成或重新生成章节时，就按选择的文风和字数来写。`,
    },
    {
      id: 'biography.derived',
      target: '衍生内容（金句 / 家风 / 书信 / 时间线）',
      logic: `① 仅完整版显示；四类衍生内容：人生金句、家风总结、写给后人的话、人生时间线。
② 每个页签独立生成、独立保留结果；原型为预置文案随机选取，「重新生成」会避开与当前结果相同的一套。
③ 「复制」把当前结果按行写入剪贴板，失败时提示手动选择复制。`,
    },
  ],
};
