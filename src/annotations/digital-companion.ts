import type { PageAnnotations } from './types';

/**
 * 数字陪伴页（/digital-companion）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const digitalCompanionAnnotations: PageAnnotations = {
  page: 'digital-companion',
  pageName: '数字陪伴',
  route: '/digital-companion',
  items: [
    {
      id: 'digital-companion.disclaimer',
      target: '免责声明（弹窗 + 常驻提示条）',
      logic: `① 首次进入页面（localStorage 无「cj_companion_disclaimer_confirmed」标记）时弹出「数字人免责声明」弹窗，点「我已知晓并同意」或关闭后写入该标记，之后进入不再弹出。
② 顶部常驻提示条提醒：数字人回复由 AI 基于生平资料生成，不代表本人真实意愿。`,
    },
    {
      id: 'digital-companion.contacts',
      target: '陪伴对象列表',
      logic: `① 点击切换当前陪伴对象，聊天区重置为默认演示对话（各对象暂无独立历史记录）。
② 「添加陪伴对象」展开行内表单：名称为空时拦截并提示；添加后出现在列表底部，状态默认「在线」。
③ 列表仅存于页面 state，刷新后恢复为 4 个默认演示对象。`,
    },
    {
      id: 'digital-companion.chat',
      target: '陪伴聊天窗口',
      logic: `① 发送前做敏感词检测（政治 / 色情 / 暴恐 / 赌博 / 毒品等词表）：命中则消息标记「已拦截」，800ms 后返回固定拒答文案「这个问题超出了我的回答范围」。
② 未命中时走档案规则回复：按问题关键词匹配传记章节（localStorage「cj_biography_chapters_{archiveId}」），引用已生成章节前 120 字并标注来源章节；「家庭生活」话题在章节未生成时回退家庭关系数据（familyApi.relations）；都匹配不到时回退档案问答 / 温和拒答。
③ 语音按钮为录制开关，结束录制发送一条「[语音消息]」占位；图片发送为演示 toast。
④ 「⋯」菜单：查看日程 / 家庭群聊（切换 Tab）、清空记录（仅清当前会话）。`,
    },
    {
      id: 'digital-companion.schedule',
      target: '节日与纪念日提醒',
      logic: `① 「添加提醒」展开表单：提醒名称与日期缺一不可，否则拦截并提示；保存后类型固定为「提醒」。
② 「发送祝福」点击后 toast 提示，并将该条置为「已发送」禁用，防止重复发送。
③ 提醒列表仅存于页面 state，刷新后恢复为 3 条默认演示数据。`,
    },
    {
      id: 'digital-companion.group-chat',
      target: '家庭群聊',
      logic: `① 群聊消息仅存于页面 state，回车或点发送即以「我」身份追加；刷新后恢复为 2 条默认演示消息。
② 「邀请成员」展开行内表单：名称为空时按「新成员」处理，邀请成功后同步加入左侧陪伴对象列表。`,
    },
  ],
};
