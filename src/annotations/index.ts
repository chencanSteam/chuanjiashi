import type { LogicAnnotation, PageAnnotations } from './types';
import { adminNotificationsAnnotations } from './admin-notifications';
import { adminSettingsAnnotations } from './admin-settings';
import { adminAiTasksAnnotations } from './adminAiTasks';
import { adminArchivesAnnotations } from './adminArchives';
import { adminBiographersAnnotations } from './adminBiographers';
import { adminDashboardAnnotations } from './adminDashboard';
import { adminPartnerApplicationsAnnotations } from './adminPartnerApplications';
import { adminPartnerCustomersAnnotations } from './adminPartnerCustomers';
import { adminPartnersAnnotations } from './adminPartners';
import { adminRolesAnnotations } from './adminRoles';
import { adminUsersAnnotations } from './adminUsers';
import { aiRefineAnnotations } from './ai-refine';
import { aiUsageAnnotations } from './ai-usage';
import { albumDetailAnnotations } from './album-detail';
import { applicationDetailAnnotations } from './application-detail';
import { archiveMediaAnnotations } from './archive-media';
import { archivePlacesAnnotations } from './archive-places';
import { archiveSectionAnnotations } from './archive-section';
import { biographerApplyAnnotations } from './biographer-apply';
import { biographerCenterAnnotations } from './biographer-center';
import { biographerEarningsAnnotations } from './biographer-earnings';
import { biographerListAnnotations } from './biographer-list';
import { biographerOrdersAnnotations } from './biographer-orders';
import { biographerProfileEditAnnotations } from './biographer-profile-edit';
import { biographerProfileAnnotations } from './biographer-profile';
import { biographyOutlineAnnotations } from './biography-outline';
import { biographyPolishAnnotations } from './biography-polish';
import { biographyPrintAnnotations } from './biography-print';
import { biographyShelfAnnotations } from './biography-shelf';
import { biographyAnnotations } from './biography';
import { bookReviewAnnotations } from './book-review';
import { commissionRecordsAnnotations } from './commissionRecords';
import { complianceRiskAnnotations } from './complianceRisk';
import { contentReviewAnnotations } from './contentReview';
import { digitalAssetsAnnotations } from './digital-assets';
import { digitalCompanionAnnotations } from './digital-companion';
import { digitalLifeAnnotations } from './digital-life';
import { eventEditAnnotations } from './event-edit';
import { familyAlbumsAnnotations } from './family-albums';
import { familyAssessmentAnnotations } from './family-assessment';
import { familyCalendarAnnotations } from './family-calendar';
import { familyChildCategoryAnnotations } from './family-child-category';
import { familyChildAnnotations } from './family-child';
import { familyEventDetailAnnotations } from './family-event-detail';
import { familyEventsAnnotations } from './family-events';
import { familyHallAnnotations } from './family-hall';
import { familyInheritAnnotations } from './family-inherit';
import { familyMemberDetailAnnotations } from './family-member-detail';
import { familyMembersAnnotations } from './family-members';
import { familyMottoAnnotations } from './family-motto';
import { familyRelationsAnnotations } from './family-relations';
import { familyRolesAnnotations } from './family-roles';
import { familySpaceAnnotations } from './family-space';
import { familyStoriesAnnotations } from './family-stories';
import { genealogyDocumentsAnnotations } from './genealogy-documents';
import { genealogyTableAnnotations } from './genealogy-table';
import { genealogyAnnotations } from './genealogy';
import { governmentDashboardAnnotations } from './government-dashboard';
import { governmentAnnotations } from './government';
import { groupBuyManagementAnnotations } from './group-buy-management';
import { groupBuyAnnotations } from './group-buy';
import { hallActivityAnnotations } from './hall-activity';
import { hallDeployAnnotations } from './hall-deploy';
import { hallModuleAnnotations } from './hall-module';
import { hallProjectAnnotations } from './hall-project';
import { homeAnnotations } from './home';
import { interviewReviewAnnotations } from './interview-review';
import { interviewAnnotations } from './interview';
import { lifeArchiveAnnotations } from './life-archive';
import { loginAnnotations } from './login';
import { memorialDetailAnnotations } from './memorial-detail';
import { mobileArchiveAnnotations } from './mobile-archive';
import { mobileFamilyAnnotations } from './mobile-family';
import { mobileHomeAnnotations } from './mobile-home';
import { mobileInterviewAnnotations } from './mobile-interview';
import { mobilePhotoRestoreAnnotations } from './mobile-photo-restore';
import { mobileProfileAnnotations } from './mobile-profile';
import { mobileWorksAnnotations } from './mobile-works';
import { museumAnnotations } from './museum';
import { myOrdersAnnotations } from './my-orders';
import { myWorksAnnotations } from './my-works';
import { noticeDetailAnnotations } from './notice-detail';
import { onboardingAnnotations } from './onboarding';
import { orderManagementAnnotations } from './order-management';
import { orderSuccessAnnotations } from './order-success';
import { partnerApplicationAnnotations } from './partner-application';
import { partnerCenterAnnotations } from './partner-center';
import { photoRestoreAnnotations } from './photo-restore';
import { policyListAnnotations } from './policy-list';
import { productDetailAnnotations } from './product-detail';
import { productManagementAnnotations } from './product-management';
import { profileAnnotations } from './profile';
import { registerAnnotations } from './register';
import { settingsAnnotations } from './settings';
import { storeAnnotations } from './store';
import { storyDetailAnnotations } from './story-detail';
import { storyLibraryAnnotations } from './story-library';
import { trainingRecordsAnnotations } from './training-records';
import { trainingReportAnnotations } from './training-report';
import { userInvitesAnnotations } from './user-invites';
import { withdrawalManagementAnnotations } from './withdrawalManagement';

/**
 * 逻辑标注注册表：新页面在这里加一行 import 并登记到数组，
 * 再在对应页面代码里用 <Annotate id="..."> 打点。
 * 标注内容（给开发/测试看的后台逻辑）只维护各页面的数据文件，不需要动组件。
 */
export const annotationPages: PageAnnotations[] = [
  adminNotificationsAnnotations,
  adminSettingsAnnotations,
  adminAiTasksAnnotations,
  adminArchivesAnnotations,
  adminBiographersAnnotations,
  adminDashboardAnnotations,
  adminPartnerApplicationsAnnotations,
  adminPartnerCustomersAnnotations,
  adminPartnersAnnotations,
  adminRolesAnnotations,
  adminUsersAnnotations,
  aiRefineAnnotations,
  aiUsageAnnotations,
  albumDetailAnnotations,
  applicationDetailAnnotations,
  archiveMediaAnnotations,
  archivePlacesAnnotations,
  archiveSectionAnnotations,
  biographerApplyAnnotations,
  biographerCenterAnnotations,
  biographerEarningsAnnotations,
  biographerListAnnotations,
  biographerOrdersAnnotations,
  biographerProfileEditAnnotations,
  biographerProfileAnnotations,
  biographyOutlineAnnotations,
  biographyPolishAnnotations,
  biographyPrintAnnotations,
  biographyShelfAnnotations,
  biographyAnnotations,
  bookReviewAnnotations,
  commissionRecordsAnnotations,
  complianceRiskAnnotations,
  contentReviewAnnotations,
  digitalAssetsAnnotations,
  digitalCompanionAnnotations,
  digitalLifeAnnotations,
  eventEditAnnotations,
  familyAlbumsAnnotations,
  familyAssessmentAnnotations,
  familyCalendarAnnotations,
  familyChildCategoryAnnotations,
  familyChildAnnotations,
  familyEventDetailAnnotations,
  familyEventsAnnotations,
  familyHallAnnotations,
  familyInheritAnnotations,
  familyMemberDetailAnnotations,
  familyMembersAnnotations,
  familyMottoAnnotations,
  familyRelationsAnnotations,
  familyRolesAnnotations,
  familySpaceAnnotations,
  familyStoriesAnnotations,
  genealogyDocumentsAnnotations,
  genealogyTableAnnotations,
  genealogyAnnotations,
  governmentDashboardAnnotations,
  governmentAnnotations,
  groupBuyManagementAnnotations,
  groupBuyAnnotations,
  hallActivityAnnotations,
  hallDeployAnnotations,
  hallModuleAnnotations,
  hallProjectAnnotations,
  homeAnnotations,
  interviewReviewAnnotations,
  interviewAnnotations,
  lifeArchiveAnnotations,
  loginAnnotations,
  memorialDetailAnnotations,
  mobileArchiveAnnotations,
  mobileFamilyAnnotations,
  mobileHomeAnnotations,
  mobileInterviewAnnotations,
  mobilePhotoRestoreAnnotations,
  mobileProfileAnnotations,
  mobileWorksAnnotations,
  museumAnnotations,
  myOrdersAnnotations,
  myWorksAnnotations,
  noticeDetailAnnotations,
  onboardingAnnotations,
  orderManagementAnnotations,
  orderSuccessAnnotations,
  partnerApplicationAnnotations,
  partnerCenterAnnotations,
  photoRestoreAnnotations,
  policyListAnnotations,
  productDetailAnnotations,
  productManagementAnnotations,
  profileAnnotations,
  registerAnnotations,
  settingsAnnotations,
  storeAnnotations,
  storyDetailAnnotations,
  storyLibraryAnnotations,
  trainingRecordsAnnotations,
  trainingReportAnnotations,
  userInvitesAnnotations,
  withdrawalManagementAnnotations,
];

export interface ResolvedAnnotation extends LogicAnnotation {
  /** 页面内编号（按数组顺序，从 1 开始） */
  number: number;
  pageName: string;
}

function getReadableTarget(target: string) {
  return target
    .replace(/[（(]([^）)]*)[）)]/g, (match, content: string) => (
      /路由|地址|参数|字段|接口|前端|后端|演示实现|状态值|数据来源|存储/.test(content)
        ? ''
        : match
    ))
    .replace(/\b(?:ID|URL|API|Tab)\b/gi, '')
    .replace(/参数/g, '设置')
    .replace(/字段/g, '内容')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasImplementationDetail(logic: string) {
  return /路由|URL|接口|前端|后端|mock|localStorage|字段|参数|数据表|\bGET\b|\bPOST\b|\bstate\b|\bid\b|\bkey\b|内存|组件|useMemo|Canvas|Blob/i.test(logic);
}

function getProductLogic(pageName: string, target: string, logic: string) {
  if (!hasImplementationDetail(logic)) return logic.trim();

  const readableTarget = getReadableTarget(target) || '这项功能';
  const intro = `“${readableTarget}”用于帮助用户完成${pageName}相关操作。`;

  if (/搜索|筛选|排序|过滤|查找/.test(readableTarget)) {
    return `${intro}\n用户可以输入关键词或选择条件，快速缩小查看范围。\n系统会马上更新眼前的内容；没有符合条件时，会给出清楚提示。`;
  }

  if (/切换|页签|分类|视图|模式|范围/.test(readableTarget)) {
    return `${intro}\n用户可以按自己的需要切换查看方式，重点内容会随之调整。\n切换不会丢掉已经填写或已经处理好的内容。`;
  }

  if (/上传|导入|文件|素材|照片|图片/.test(readableTarget)) {
    return `${intro}\n用户可以把已有材料放进来，作为后续整理或处理的基础。\n内容不完整或暂时无法使用时，系统会提示用户补充或重新选择。`;
  }

  if (/删除|移除|清空|退出|注销/.test(readableTarget)) {
    return `${intro}\n用户可以移除不再需要的内容。\n涉及重要内容时，系统会先让用户确认，避免误操作；删除后会同步更新当前看到的结果。`;
  }

  if (/生成|提炼|润色|修复|识别|转写|制作|分析|推荐|AI/.test(readableTarget)) {
    return `${intro}\n用户发起处理后，系统会根据已提供的内容给出新的结果。\n处理期间会显示进行状态；内容不足或暂时无法完成时，会说明原因并保留原有内容。`;
  }

  if (/下载|导出|复制|分享|打印|备份/.test(readableTarget)) {
    return `${intro}\n用户可以把当前确认过的内容带走、转发或留存。\n输出内容以用户当前看到的版本为准，不会影响页面内继续修改。`;
  }

  if (/新建|新增|创建|添加|录入/.test(readableTarget)) {
    return `${intro}\n用户可以补充一条新的内容，并继续完善需要的信息。\n必要内容没有填写完整时，系统会提醒用户补齐后再继续。`;
  }

  if (/编辑|修改|填写|输入|正文|内容区|介绍/.test(readableTarget)) {
    return `${intro}\n用户可以直接补充或调整内容，让结果更贴合实际情况。\n修改后会立即反映在当前页面，用户可以继续检查和调整。`;
  }

  if (/保存|提交|确认|发布|申请|支付|结算|处理|审核|通过|驳回|启用|禁用|关闭|撤回/.test(readableTarget)) {
    return `${intro}\n用户确认操作后，系统会先检查必要内容，再给出清楚的处理结果。\n不符合条件时会说明原因，已经完成的其他内容不会受到影响。`;
  }

  if (/统计|总览|概览|进度|排行|报表/.test(readableTarget)) {
    return `${intro}\n这里集中展示当前情况，方便用户快速了解重点和处理进展。\n内容会随着相关操作变化，帮助用户判断下一步该做什么。`;
  }

  if (/列表|记录|历史|明细|作品|订单|档案|相册|成员|通知|卡片/.test(readableTarget)) {
    return `${intro}\n用户可以浏览已有内容，并选择需要查看或继续处理的部分。\n暂时没有内容时，系统会给出明确提示，不会让用户误以为操作失败。`;
  }

  return `${intro}\n用户可以在这里查看当前情况，并按需要继续操作。\n系统会根据用户的选择给出相应结果；遇到需要补充或确认的情况，会用清楚的话提示。`;
}

const lookup = new Map<string, ResolvedAnnotation>();
annotationPages.forEach((p) => {
  p.items.forEach((item, i) => {
    lookup.set(item.id, {
      ...item,
      target: getReadableTarget(item.target),
      logic: getProductLogic(p.pageName, item.target, item.logic),
      number: i + 1,
      pageName: p.pageName,
    });
  });
});

export function getAnnotation(id: string): ResolvedAnnotation | undefined {
  return lookup.get(id);
}

export function getPageByRoute(pathname: string): PageAnnotations | undefined {
  // 先精确匹配，再按路径前缀匹配（覆盖 /archive/:section 这类动态路由）
  return (
    annotationPages.find((p) => p.route === pathname) ??
    annotationPages.find((p) => pathname.startsWith(p.route + '/'))
  );
}
