import type { PageAnnotations } from './types';

/**
 * 移动端照片修复页（/m/photo-restore）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const mobilePhotoRestoreAnnotations: PageAnnotations = {
  page: 'mobile-photo-restore',
  pageName: '移动端照片修复',
  route: '/m/photo-restore',
  items: [
    {
      id: 'mobile-photo-restore.upload',
      target: '上传老照片',
      logic: `① 点击空态区域触发隐藏的 file input（accept="image/*"）。
② 校验规则：非图片文件 toast 拦截「请上传图片文件」；超过 20MB toast 拦截「图片大小不能超过 20MB」。
③ 校验通过后用 FileReader 转成 DataURL 作为原图预览，并 toast 提示上传成功；每次选择后清空 input value，保证重复选择同一文件也能触发。`,
    },
    {
      id: 'mobile-photo-restore.start-restore',
      target: '「开始修复」按钮与进度条',
      logic: `① 未上传图片时点击 toast 拦截「请先上传图片」；修复进行中按钮禁用并显示「修复中…」。
② 原型为 mock 实现：每 250ms 随机增加 0~15% 进度（封顶 90%），约 2.6 秒后置为 100% 完成——正式版替换为 AI 修复接口，按任务状态轮询进度。
③ 完成后「修复后」直接复用原图做演示，并 toast 提示已保存到修复记录（原型未真正落库）。`,
    },
    {
      id: 'mobile-photo-restore.compare',
      target: '修复前后对比',
      logic: `① 修复完成后并排展示「修复前 / 修复后」两张图；未完成时只显示待修复原图。
② 正式版「修复后」为 AI 接口返回的结果图，并考虑加滑块拖动对比交互。`,
    },
    {
      id: 'mobile-photo-restore.result-actions',
      target: '结果操作（保存 / 重新上传）',
      logic: `① 「保存修复结果」：原型仅 toast 提示已保存；正式版应写入修复记录（关联家庭相册/档案）。
② 「重新上传」：清空原图、修复结果与进度，回到上传空态；修复进行中禁用。`,
    },
  ],
};
