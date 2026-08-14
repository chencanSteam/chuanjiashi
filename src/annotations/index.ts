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

const lookup = new Map<string, ResolvedAnnotation>();
annotationPages.forEach((p) => {
  p.items.forEach((item, i) => {
    lookup.set(item.id, { ...item, number: i + 1, pageName: p.pageName });
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
