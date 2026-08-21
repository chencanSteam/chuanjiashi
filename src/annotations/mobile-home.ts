import type { PageAnnotations } from './types';

/**
 * 移动端首页（/m）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const mobileHomeAnnotations: PageAnnotations = {
  page: 'mobile-home',
  pageName: '移动端首页',
  route: '/m',
  items: [
    {
      id: 'mobile-home.profile-header',
      target: '档案头部',
      logic: `① 展示当前档案（cj_current_archive_id + cj_archives）：头像取传主姓名首字；档案名为下拉选择器，可切换本账号全部档案，切换后写入 cj_current_archive_id 并刷新页面。
② 右侧加号进入 /onboarding 创建新的人生档案；创建完成后新档案成为当前展示档案。
③ 点击头像区域进人生档案页（/m/archive）。`,
    },
    {
      id: 'mobile-home.interview-cta',
      target: '今日讲述（采访主行动区）',
      logic: `① 「开始讲述」「文字回答」均跳转 AI 采访页（/m/interview），正式版分别对应语音与文字两种回答方式。`,
    },
    {
      id: 'mobile-home.story-list',
      target: '人生轴（横向卡片）',
      logic: `① 数据为时间轴事件（loadStoredEventsForArchive，与人生档案页同源），按年份升序取前 4 个；卡片显示图片占位符（generateImageDataUrl）+ 时间段（有 endYear 显示 xxxx-xxxx年）+ 主题。
② 区块无标题栏，卡片横向滚动展示；点击卡片或末尾「更多故事 · 待记录」卡均跳转人生档案页（/m/archive）。`,
    },
    {
      id: 'mobile-home.memory-biography',
      target: '珍贵记忆 / 我的传记双卡',
      logic: `① 珍贵记忆：取媒体库（cj_media_*）中 image 类型前 3 张做照片堆叠，显示照片总数，点击进人生档案页。
② 我的传记：书封展示《{传主}传》，章节数取已生成章节（cj_biography_chapters_* 中非 notGenerated）；点击跳 Web 端传记页（/biography）阅读编辑。`,
    },
    {
      id: 'mobile-home.goods',
      target: '传记服务',
      logic: `① 三张服务卡为固定配置：传记实体书跳转传家商城（/store），传记编写跳转传记编写页（/biography），找传记师跳转传记师列表（/biographers）。
② 卡片只保留服务名称和简短说明，不展示区块介绍文案、查看全部和「去看看」按钮。`,
    },
  ],
};
