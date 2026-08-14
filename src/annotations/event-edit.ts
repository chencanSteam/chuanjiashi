import type { PageAnnotations } from './types';

/**
 * 事件编辑页（/archive，路由 /archive/event/:year/edit）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const eventEditAnnotations: PageAnnotations = {
  page: 'event-edit',
  pageName: '事件编辑',
  route: '/archive',
  items: [
    {
      id: 'event-edit.save',
      target: '「保存」按钮',
      logic: `① 保存写入「event-<archiveId>-<开始年份>」（标题 / 描述 / 附件）；若开始年份被修改，先删除旧年份的 key，实现「改年份 = 迁移记录」。
② 同步更新「cj_events_<archiveId>」中该事件的年份与结束年份，返回时间轴后可见。
③ 保存成功 toast 后 navigate(-1) 返回上一页；本页无必填校验，标题允许为空。`,
    },
    {
      id: 'event-edit.form',
      target: '事件信息表单（年份 / 标题 / 描述）',
      logic: `① 初始值优先级：localStorage「event-<archiveId>-<年份>」已存详情 → 内置演示数据（1958 / 1992 / 2020 / 2024）；路由年份参数缺失时默认按 1992 处理。
② 开始 / 结束年份下拉为 1900 至当前年倒序，结束年份可留空。
③ 表单编辑过程不落库，仅点「保存」后统一写入。`,
    },
    {
      id: 'event-edit.attachments',
      target: '附件与照片（上传 / 删除）',
      logic: `① 支持多选上传；单文件超过 2MB 时仅保存文件名 / 大小等信息、不读取内容，并 toast 提示。
② 2MB 以内的文件用 FileReader 读为 dataURL 暂存，点「保存」后才随事件写入 localStorage。
③ 删除附件即时从列表移除（若未保存，刷新后会还原）；点击附件打开预览弹窗。`,
    },
    {
      id: 'event-edit.preview',
      target: '附件预览弹窗',
      logic: `① 仅图片且已读入 dataURL 时显示真实图片，其余类型显示占位图标；超 2MB 未读内容的附件无法预览。
② 有 dataURL 的附件可点击「下载附件」导出（downloadDataUrl）。`,
    },
  ],
};
