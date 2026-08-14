import type { PageAnnotations } from './types';

/** 传记润色页的白话说明，方便产品演示和非技术人员理解。 */
export const biographyPolishAnnotations: PageAnnotations = {
  page: 'biography-polish',
  pageName: '传记润色',
  route: '/polish',
  items: [
    {
      id: 'biography-polish.reupload',
      target: '换一份传记',
      logic: `用户想换一份传记时，系统先提醒当前内容可能还没有保存。
用户确认后，清空当前整理结果，回到传记的放入入口。`,
    },
    {
      id: 'biography-polish.export-word',
      target: '导出润色稿',
      logic: `用户需要带走成果时，系统把当前已经整理好的章节和文字合并成一份完整传记。
导出的内容以用户眼前看到的最新版本为准，不影响页面里的原文和后续修改。`,
    },
    {
      id: 'biography-polish.save',
      target: '保存进度',
      logic: `用户确认当前修改后，系统保存传记的章节、原文和润色结果。
用户下次回来时，可以从上次停下的位置继续整理，不需要重新开始。`,
    },
    {
      id: 'biography-polish.upload',
      target: '放入传记',
      logic: `用户可以提供已有的传记，也可以直接粘贴文字。
系统先读取内容，并根据文字里的章节线索尝试整理结构；能判断出章节就自动分开，判断不出来就先作为一整章保留。
如果没有读到有效内容，系统提醒用户补充后再继续。`,
    },
    {
      id: 'biography-polish.chapter-tree',
      target: '章节列表',
      logic: `这里展示系统已经整理出的章节，用户切换章节后，可以查看和修改对应内容。
如果系统没有判断出章节，用户可以自己补充章节，再把文字分别整理进去。
每一章显示自己的处理进度，方便用户知道哪些内容已经完成；用户也可以删除不需要的章节，但至少保留一章。`,
    },
    {
      id: 'biography-polish.add-chapter',
      target: '新增章节',
      logic: `用户需要自己拆分内容时，可以新增一个空白章节。
系统打开新章节，用户填写章节名称并放入对应文字；原来的内容仍然保留，不会因为新增章节而丢失。`,
    },
    {
      id: 'biography-polish.delete-chapter',
      target: '删除章节',
      logic: `用户可以删除不需要的章节。
删除前系统先提醒用户确认，确认后移除这一章及其中的文字；为了保证传记始终有内容，最后一章不能删除。`,
    },
    {
      id: 'biography-polish.editor',
      target: '修改和润色文字',
      logic: `用户可以直接修改章节名称和正文，也可以先选择希望呈现的文字感觉。
用户选中一小段文字时，系统只处理这一段；没有选中时，可以处理当前章节；选择处理全文时，系统再处理全部章节。
润色结果保留在当前内容中，同时保留最初的文字，方便用户比较和恢复。
如果当前暂时不能继续处理，系统先提示用户，已经整理好的内容不受影响。`,
    },
  ],
};
