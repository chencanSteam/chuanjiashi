import type { PageAnnotations } from './types';

/**
 * 人生档案页（/archive）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const lifeArchiveAnnotations: PageAnnotations = {
  page: 'life-archive',
  pageName: '人生档案',
  route: '/archive',
  items: [
    {
      id: 'life-archive.archive-switch',
      target: '当前档案切换下拉框',
      logic: `① 下拉数据来自 localStorage「cj_archives」（无则内置「张明远」默认档案），并合并 archiveApi.list() 的 mock 档案（同 id 不覆盖本地数据）。
② 切换后写入「cj_current_archive_id」，并按档案重新加载事件（cj_events_<id>）、事件标签（cj_event_tags_<id>）、成员（cj_members_<id>）、素材（cj_media_<id>）。
③ 切换后时间轴默认选中 1992 年事件，无则选中第一个事件。`,
    },
    {
      id: 'life-archive.new-archive',
      target: '「新建档案」按钮与表单',
      logic: `① 仅「档案所有者」可用，观察者角色下按钮禁用。
② 姓名必填，为空时拦截并提示；性别、出生年份、籍贯、职业选填；人生标签可选预设标签，也可回车或点「添加」自定义，自动去重。
③ 创建后以时间戳为 id 写入「cj_archives」，自动切换为新档案，并初始化该档案的空事件 / 标签 / 成员数据。`,
    },
    {
      id: 'life-archive.timeline',
      target: '人生时间轴（添加 / 编辑 / 删除事件）',
      logic: `① 事件按年份升序展示，数据存「cj_events_<archiveId>」；观察者角色无添加、编辑、删除入口。
② 添加事件：开始年份与标题必填，年份重复时拦截；保存后同步写入「event-<archiveId>-<年份>」详情记录，并自动选中新事件。
③ 编辑跳转「/archive/event/<年份>/edit」；删除直接移除该年份事件，若删的是当前选中项，回退选中 1992 或首个事件。`,
    },
    {
      id: 'life-archive.event-detail',
      target: '人生事件详情卡',
      logic: `① 详情取值优先级：localStorage「event-<archiveId>-<年份>」已保存内容 → 内置演示数据 → 时间轴事件自身的标题 / 描述。
② 关联素材按「阶段前缀 = 年份」从「cj_media_<archiveId>」筛选：图片取前 4 张作照片墙，全部类型列入附件区。
③ 「上传本阶段资料」仅非观察者可见，文件按扩展名推断类型（图片 / 视频 / 音频 / 文档），自动关联当前阶段写入素材库；点击照片或附件打开预览弹窗。`,
    },
    {
      id: 'life-archive.media-library',
      target: '多媒体档案库',
      logic: `① 素材存「cj_media_<archiveId>」，类型筛选（全部 / 照片 / 视频 / 音频 / 文档）为前端即时过滤。
② 上传弹窗：必选文件，可关联已有人生阶段（无事件时提示先在时间轴添加）；确认后按扩展名推断类型追加到素材库。
③ 删除按钮仅非观察者可见；点击素材打开预览（图片为占位图、视频 / 音频为占位源）。
④ 非 MVP 版本显示「老照片修复」入口，跳转 /photo-restore。`,
    },
    {
      id: 'life-archive.relations',
      target: '人物关系图谱',
      logic: `① 关系数据来自 familyApi.relations(当前档案 id)，以档案本人为中心节点放射布局，拉取失败按空数据处理。
② MVP 版本点击成员节点打开「维护关系」弹窗；完整版跳转家庭成员详情「/family/members/<姓名>」。`,
    },
    {
      id: 'life-archive.privacy',
      target: '隐私与权限（角色 / 可见范围 / 授权成员）',
      logic: `① 角色下拉（档案所有者 / 观察者）是演示用全局开关，写入「cj_current_role」，控制全页编辑入口的显隐与禁用。
② 五个模块的可见范围（家人可见 / 公开展示 / 仅自己）存「cj_privacy_values」，观察者禁用修改；权限模板下拉仅所有者可用（演示仅默认模板）。
③ 授权成员存「cj_members_<archiveId>」：邀请时姓名必填且不可重复，新成员状态为「待确认」；仅所有者可移除非所有者成员。`,
    },
    {
      id: 'life-archive.relation-invite',
      target: '维护人物关系弹窗',
      logic: `① 凭手机号 / 身份证号查找对方账号：输入为空、未注册、查找自己、已发过待同意邀请，四种情况分别拦截并提示。
② 找到账号后选择关系类型发出邀请，对方同意后才会写入关系图谱；待同意的邀请可撤销。
③ 已建立的关系可删除（familyApi.removeRelation），失败时 toast 报错。`,
    },
  ],
};
