import type { PageAnnotations } from './types';

/**
 * 家风故事库页（/family-hall/story-library）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const storyLibraryAnnotations: PageAnnotations = {
  page: 'story-library',
  pageName: '故事素材库',
  route: '/family-hall/story-library',
  items: [
    {
      id: 'story-library.search',
      target: '故事搜索框',
      logic: `① 输入即实时过滤，匹配字段为故事标题或作者（子串包含匹配，不区分全半角以外规则）。
② 无匹配结果时列表区显示「未找到相关故事」空态；清空搜索词恢复完整列表。`,
    },
    {
      id: 'story-library.add-button',
      target: '「新增故事」按钮',
      logic: `① 点击在列表顶部展开行内新增表单，再次添加前可用「取消」收起。
② 正式版应弹出完整录入表单（标题、作者、正文、关联人物/事件），原型仅演示标题与作者两个字段。`,
    },
    {
      id: 'story-library.add-form',
      target: '新增故事表单',
      logic: `① 校验规则：标题必填，为空时拦截并提示「请输入故事标题」；作者留空自动记为「佚名」。
② 添加成功后新故事置顶插入列表，状态默认「草稿」，日期取当天；表单字段清空并收起。
③ 原型数据仅存内存，刷新后恢复初始示例；正式版需提交后端并写入故事库。`,
    },
    {
      id: 'story-library.polish',
      target: '「AI润色」按钮',
      logic: `① 点击后进入处理态（约 1.2 秒模拟 AI 处理），期间该条按钮禁用并显示「润色中…」。
② 原型完成后仅在标题末尾追加「（已润色）」标记示意；正式版应调用 AI 扩写润色接口改写正文，并保留原稿可对比/回退。
③ 润色不改变故事状态（草稿仍为草稿）。`,
    },
    {
      id: 'story-library.edit',
      target: '编辑按钮（行内编辑）',
      logic: `① 点击后该行切换为行内编辑模式，预填当前标题与作者。
② 保存时某个字段留空则保持原值不变；「取消」放弃修改直接退出编辑态。
③ 保存成功仅更新前端列表并提示「故事已更新」，正式版需提交后端。`,
    },
    {
      id: 'story-library.delete',
      target: '删除按钮',
      logic: `① 点击立即从列表移除该故事，原型无二次确认；正式版应弹确认框并做软删除。
② 已发布故事被其他模块（如 AI 提炼素材来源）引用时，正式版需拦截或级联提示。`,
    },
  ],
};
