import type { PageAnnotations } from './types';

/**
 * 数字人页（/digital-person）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const digitalLifeAnnotations: PageAnnotations = {
  page: 'digital-life',
  pageName: '数字人',
  route: '/digital-person',
  items: [
    {
      id: 'digital-life.create-wizard',
      target: '「创建数字亲人」按钮与三步向导',
      logic: `① 点击打开三步向导（基础信息 → 声音克隆 → 记忆注入），每次打开/关闭都会重置全部表单状态和录音计时器。
② 第 1 步「称呼」为空时「下一步」按钮禁用；第 2 步可录制（3 秒模拟进度）或上传语音样本；第 3 步配置记忆范围（多选）与语言风格（单选，默认「朴实」）。
③ 「完成」时校验名称非空（去空格），自动补全「数字分身」后缀；未上传照片时按名称生成占位头像；新亲人初始训练进度 10，创建后立即选中并再 +5 进度。
④ 亲人列表写入 localStorage「cj_relatives」，当前选中项写入「cj_active_rel」，向导内的语音样本并入「cj_voice_samples」。`,
    },
    {
      id: 'digital-life.stats',
      target: '顶部统计卡',
      logic: `① 五张统计卡均可点击：前两张与「活跃对话」回到本页，「人格训练完成度」跳训练记录页，「数字遗产配置数」跳政务服务页（/government）。
② V1.0 模式下「训练记录」与「政务服务」未开放，点击这两张卡统一回到数字人首页。
③ 「数字人物数量」实时读取 cj_relatives 的条数，其余指标为演示静态数据。`,
    },
    {
      id: 'digital-life.relatives',
      target: '我的数字亲人列表',
      logic: `① 列表读取 localStorage「cj_relatives」，无数据时使用 4 位默认演示亲人；点击切换当前亲人并写入「cj_active_rel」。
② 初始选中项做越界保护：夹在 0 ~ 列表长度-1 之间。
③ 删除到列表为空时，整个主区域替换为「暂无数字亲人」空状态，仅保留创建入口。`,
    },
    {
      id: 'digital-life.clone',
      target: '形象与声音克隆卡',
      logic: `① 名称旁的编辑图标进入行内改名，Enter 或点「保存」提交；名称去空格后为空则直接退出、不修改。
② 更多操作（⋯）：重命名（弹窗输入新名称）、删除当前亲人、开始对话（切换到「实时对话」Tab）。
③ 删除后自动修正选中下标：删的是当前项则选中前一位，只剩一位时归零。
④ 「语音试听」播放第一条语音样本，无样本时提示；「上传形象」为演示占位。`,
    },
    {
      id: 'digital-life.chat',
      target: '实时对话面板',
      logic: `① 发送前先扣减「数字人对话」额度（quotaApi.consume('digitalDialog')），额度不足时拦截并提示，不产生消息。
② 存在当前档案（cj_current_archive_id）且知识库就绪时，调 digitalPersonApi.chat 基于传记/记忆回答；接口失败或未就绪时回退本地规则回复 getArchiveBasedDigitalAnswer（延迟 1.2 秒模拟）。
③ 页面加载时若档案知识库未构建（knowledgeBaseReady=false）会自动触发一次 digitalPersonApi.build，失败静默降级；已有档案对话记录会回放加载。
④ 命中记忆的回答显示「来源」，超出记忆范围的回答标注「当前回答超出已保存记忆范围」。
⑤ 对话记录实时写入 localStorage「cj_chat_messages」，刷新不丢。`,
    },
    {
      id: 'digital-life.memory-inject',
      target: '记忆注入面板',
      logic: `① 点击素材卡片加入/移出待注入集合，选中项持久化到 localStorage「cj_selected_materials」。
② 未选择任何素材时点「开始记忆注入」会被拦截并提示；注入进行中按钮禁用并显示「注入中…」。
③ 注入完成（1.5 秒模拟）后，当前亲人训练进度与全部五项训练参数各 +5（封顶 100）。`,
    },
    {
      id: 'digital-life.training',
      target: '人格训练参数卡',
      logic: `① 五项训练参数读取 localStorage「cj_training_values」，无数据时用默认值；「开始训练」将当前亲人进度与全部参数各 +5（封顶 100）并即时保存。
② V1.0 模式下隐藏「训练记录」「训练报告」两个入口按钮。
③ 「训练记录」跳 /digital-person/training-records，「训练报告」跳 /digital-person/training-report。`,
    },
    {
      id: 'digital-life.inheritance',
      target: '数字遗产与继承设置卡',
      logic: `① 三项继承设置（继承人指定 / 分阶段解锁 / 数据托管）点击跳转 /government 政务与继承页；V1.0 模式下点击不跳转，且「管理继承方案」按钮隐藏。
② 「查看继承预览」展开/收起一段继承说明文案，为纯前端展示状态。`,
    },
  ],
};
