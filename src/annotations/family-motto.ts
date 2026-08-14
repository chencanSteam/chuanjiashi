import type { PageAnnotations } from './types';

/**
 * 家训家风编辑页（/family/motto）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const familyMottoAnnotations: PageAnnotations = {
  page: 'family-motto',
  pageName: '家训家风',
  route: '/family/motto',
  items: [
    {
      id: 'family-motto.editor',
      target: '家训内容输入框',
      logic: `① 初始值从 localStorage 的 cj_family_motto 读取，无存档时回填默认家训「忠厚传家远，诗书继世长」。
② 编辑过程只改内存状态，不写存储；正式版应按档案隔离（key 带 archiveId），当前为全局单条。`,
    },
    {
      id: 'family-motto.actions',
      target: '取消 / 保存',
      logic: `① 保存校验：内容去空格后为空则拦截并 toast「家训内容不能为空」。
② 保存成功：去空格后写入 localStorage 的 cj_family_motto，toast 提示后跳转回家庭主页 /family，主页家训区展示最新值。
③ 取消：直接 navigate(-1) 返回上一页，不做任何校验和写入。`,
    },
  ],
};
