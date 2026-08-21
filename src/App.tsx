import { Suspense, lazy, type ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastProvider';
import { AuthProvider } from './contexts/AuthContext';
import AnnotationProvider from './components/annotation/AnnotationProvider';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import PartnerLayout from './components/PartnerLayout';
import Login from './pages/Login';
import { useVersion } from './hooks/useVersion';
import './App.css';

// V1.0 未包含的功能（家庭空间 V1.2 / 数字家谱 V2.0 / AI家风馆 V2.0 / 数字人 V3.0 等）重定向到首页
function V1Redirect({ children }: { children: ReactNode }) {
  const { isV1 } = useVersion();
  return isV1 ? <Navigate to="/home" replace /> : <>{children}</>;
}

// 运营后台 V1.0 模式：未开放页面重定向到用户管理
function AdminV1Redirect({ children }: { children: ReactNode }) {
  const { isV1 } = useVersion();
  return isV1 ? <Navigate to="/admin/users" replace /> : <>{children}</>;
}

// 移动端「家庭」模块为 V1.2 功能：V1.0 模式下回到移动端首页
function MobileFamilyV1Redirect({ children }: { children: ReactNode }) {
  const { isV1 } = useVersion();
  return isV1 ? <Navigate to="/m" replace /> : <>{children}</>;
}

// /login 重定向到 / 时保留查询参数（如邀请链接的 invite 参数）
function LoginRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/${search}`} replace />;
}

const Onboarding = lazy(() => import('./pages/Onboarding'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const AIInterview = lazy(() => import('./pages/AIInterview'));
const InterviewReview = lazy(() => import('./pages/InterviewReview'));
const AIBiography = lazy(() => import('./pages/AIBiography'));
const BiographyPrint = lazy(() => import('./pages/BiographyPrint'));
const BiographyOutline = lazy(() => import('./pages/BiographyOutline'));
const BiographyPolish = lazy(() => import('./pages/BiographyPolish'));
const MyWorks = lazy(() => import('./pages/MyWorks'));
const LifeArchive = lazy(() => import('./pages/LifeArchive'));
const FamilySpace = lazy(() => import('./pages/FamilySpace'));
const Genealogy = lazy(() => import('./pages/Genealogy'));
const AIFamilyHall = lazy(() => import('./pages/AIFamilyHall'));
const DigitalLife = lazy(() => import('./pages/DigitalLife'));
const TrainingRecords = lazy(() => import('./pages/TrainingRecords'));
const TrainingReport = lazy(() => import('./pages/TrainingReport'));
const DigitalCompanion = lazy(() => import('./pages/DigitalCompanion'));
const GovernmentService = lazy(() => import('./pages/GovernmentService'));
const GovernmentDashboard = lazy(() => import('./pages/GovernmentDashboard'));
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetail'));
const PolicyList = lazy(() => import('./pages/PolicyList'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const FamilyMemberList = lazy(() => import('./pages/FamilyMemberList'));
const FamilyMemberDetail = lazy(() => import('./pages/FamilyMemberDetail'));
const AlbumDetail = lazy(() => import('./pages/AlbumDetail'));
const StoryDetail = lazy(() => import('./pages/StoryDetail'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const NoticeDetail = lazy(() => import('./pages/NoticeDetail'));
const MemorialDetail = lazy(() => import('./pages/MemorialDetail'));
const ArchiveMedia = lazy(() => import('./pages/ArchiveMedia'));
const EventEdit = lazy(() => import('./pages/EventEdit'));
const ArchivePlaces = lazy(() => import('./pages/ArchivePlaces'));
const ArchiveSubPage = lazy(() => import('./pages/ArchiveSubPage'));
const GenealogyTable = lazy(() => import('./pages/GenealogyTable'));
const GenealogyDocuments = lazy(() => import('./pages/GenealogyDocuments'));
const HallProjectDetail = lazy(() => import('./pages/HallProjectDetail'));
const HallModulePage = lazy(() => import('./pages/HallModulePage'));
const AIRefine = lazy(() => import('./pages/AIRefine'));
const StoryLibrary = lazy(() => import('./pages/StoryLibrary'));
const FamilyAssessment = lazy(() => import('./pages/FamilyAssessment'));
const HallActivityDetail = lazy(() => import('./pages/HallActivityDetail'));
const FamilyHallDeploy = lazy(() => import('./pages/FamilyHallDeploy'));
const FamilyCalendar = lazy(() => import('./pages/FamilyCalendar'));
const FamilyAlbums = lazy(() => import('./pages/FamilyAlbums'));
const FamilyStories = lazy(() => import('./pages/FamilyStories'));
const FamilyChild = lazy(() => import('./pages/FamilyChild'));
const FamilyChildCategory = lazy(() => import('./pages/FamilyChildCategory'));
const FamilyRelations = lazy(() => import('./pages/FamilyRelations'));
const FamilyRoles = lazy(() => import('./pages/FamilyRoles'));
const FamilyMotto = lazy(() => import('./pages/FamilyMotto'));
const FamilyInherit = lazy(() => import('./pages/FamilyInherit'));
const FamilyEvents = lazy(() => import('./pages/FamilyEvents'));
const BiographerManagement = lazy(() => import('./pages/BiographerManagement'));
const PartnerManagement = lazy(() => import('./pages/PartnerManagement'));
const PartnerApplications = lazy(() => import('./pages/PartnerApplications'));
const PartnerCustomersAdmin = lazy(() => import('./pages/PartnerCustomersAdmin'));
const CommissionRecords = lazy(() => import('./pages/CommissionRecords'));
const OrderManagement = lazy(() => import('./pages/OrderManagement'));
const AIUsage = lazy(() => import('./pages/AIUsage'));
const BookReview = lazy(() => import('./pages/BookReview'));
const AdminDictionary = lazy(() => import('./pages/AdminDictionary'));
const WithdrawalManagement = lazy(() => import('./pages/WithdrawalManagement'));
const UserInvites = lazy(() => import('./pages/UserInvites'));
const PartnerCenter = lazy(() => import('./pages/PartnerCenter'));
const PartnerApplication = lazy(() => import('./pages/PartnerApplication'));
const MobileInterview = lazy(() => import('./pages/mobile/MobileInterview'));
const MobileLayout = lazy(() => import('./components/MobileLayout'));
const MobileHome = lazy(() => import('./pages/mobile/MobileHome'));
const MobileArchive = lazy(() => import('./pages/mobile/MobileArchive'));
const MobileFamily = lazy(() => import('./pages/mobile/MobileFamily'));
const MobileProfile = lazy(() => import('./pages/mobile/MobileProfile'));
const MobileWorks = lazy(() => import('./pages/mobile/MobileWorks'));
const MobilePhotoRestore = lazy(() => import('./pages/mobile/MobilePhotoRestore'));
const BiographerLayout = lazy(() => import('./components/BiographerLayout'));
const BiographerCenter = lazy(() => import('./pages/BiographerCenter'));
const BiographerOrders = lazy(() => import('./pages/BiographerOrders'));
const BiographerProfile = lazy(() => import('./pages/BiographerProfile'));
const BiographerProfileEdit = lazy(() => import('./pages/BiographerProfileEdit'));
const PhotoRestore = lazy(() => import('./pages/PhotoRestore'));
const BiographerList = lazy(() => import('./pages/BiographerList'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Store = lazy(() => import('./pages/Store'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const BiographyShelf = lazy(() => import('./pages/BiographyShelf'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const GroupBuy = lazy(() => import('./pages/GroupBuy'));
const Museum = lazy(() => import('./pages/Museum'));
const DigitalAssets = lazy(() => import('./pages/DigitalAssets'));
const BiographerApply = lazy(() => import('./pages/BiographerApply'));
const BiographerEarnings = lazy(() => import('./pages/BiographerEarnings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminRolePermissions = lazy(() => import('./pages/AdminRolePermissions'));
const AdminNotifications = lazy(() => import('./pages/AdminNotifications'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const ArchiveManagement = lazy(() => import('./pages/ArchiveManagement'));
const AITaskManagement = lazy(() => import('./pages/AITaskManagement'));
const ProductManagement = lazy(() => import('./pages/ProductManagement'));
const GroupBuyManagement = lazy(() => import('./pages/GroupBuyManagement'));
const ContentReview = lazy(() => import('./pages/ContentReview'));
const ComplianceRisk = lazy(() => import('./pages/ComplianceRisk'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));

function PageFallback() {
  return (
    <div className="page-loading">
      <div className="page-loading-spinner" />
      <span>页面加载中…</span>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AnnotationProvider>
          <HashRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* 默认页：登录 */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<LoginRedirect />} />
              <Route path="/register" element={<Register />} />
              <Route path="/home" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Home />} />
              </Route>
              <Route path="/partner/apply" element={<PartnerApplication />} />
              <Route path="/partner/login" element={<Navigate to="/" replace />} />
              <Route path="/partner-center" element={<Navigate to="/partner" replace />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

              <Route path="/partner" element={<RoleRoute role="partner"><PartnerLayout /></RoleRoute>}>
                <Route index element={<PartnerCenter />} />
                <Route path="*" element={<Navigate to="/partner" replace />} />
              </Route>

              <Route path="/biographer" element={<RoleRoute role="biographer"><BiographerLayout /></RoleRoute>}>
                <Route index element={<BiographerCenter />} />
                <Route path="orders" element={<BiographerOrders />} />
                <Route path="apply" element={<BiographerApply />} />
                <Route path="earnings" element={<BiographerEarnings />} />
                <Route path="profile" element={<BiographerProfile />} />
                <Route path="profile/edit" element={<BiographerProfileEdit />} />
                <Route path="*" element={<Navigate to="/biographer" replace />} />
              </Route>

              <Route path="/admin" element={<RoleRoute role="admin"><AdminLayout /></RoleRoute>}>
                <Route index element={<AdminV1Redirect><Navigate to="/admin/dashboard" replace /></AdminV1Redirect>} />
                <Route path="dashboard" element={<AdminV1Redirect><AdminDashboard /></AdminV1Redirect>} />
                <Route path="users" element={<UserManagement />} />
                <Route path="archives" element={<ArchiveManagement />} />
                <Route path="biographers" element={<BiographerManagement />} />
                <Route path="partners" element={<AdminV1Redirect><PartnerManagement /></AdminV1Redirect>} />
                <Route path="partner-applications" element={<AdminV1Redirect><PartnerApplications /></AdminV1Redirect>} />
                <Route path="partner-customers" element={<AdminV1Redirect><PartnerCustomersAdmin /></AdminV1Redirect>} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="products" element={<AdminV1Redirect><ProductManagement /></AdminV1Redirect>} />
                <Route path="group-buy" element={<AdminV1Redirect><GroupBuyManagement /></AdminV1Redirect>} />
                <Route path="commission-records" element={<AdminV1Redirect><CommissionRecords /></AdminV1Redirect>} />
                <Route path="book-review" element={<BookReview />} />
                <Route path="dictionary" element={<AdminDictionary />} />
                <Route path="ai-usage" element={<AIUsage />} />
                <Route path="withdrawals" element={<AdminV1Redirect><WithdrawalManagement /></AdminV1Redirect>} />
                <Route path="user-invites" element={<AdminV1Redirect><UserInvites /></AdminV1Redirect>} />
                <Route path="ai-tasks" element={<AITaskManagement />} />
                <Route path="roles" element={<AdminRolePermissions />} />
                <Route path="notifications" element={<AdminV1Redirect><AdminNotifications /></AdminV1Redirect>} />
                <Route path="content-review" element={<AdminV1Redirect><ContentReview /></AdminV1Redirect>} />
                <Route path="compliance" element={<AdminV1Redirect><ComplianceRisk /></AdminV1Redirect>} />
                <Route path="settings" element={<AdminV1Redirect><AdminSettings /></AdminV1Redirect>} />
                <Route path="*" element={<AdminV1Redirect><Navigate to="/admin/dashboard" replace /></AdminV1Redirect>} />
              </Route>

              <Route path="/m" element={<ProtectedRoute><MobileLayout /></ProtectedRoute>}>
                <Route index element={<MobileHome />} />
                <Route path="interview" element={<MobileInterview />} />
                <Route path="archive" element={<MobileArchive />} />
                <Route path="family" element={<MobileFamilyV1Redirect><MobileFamily /></MobileFamilyV1Redirect>} />
                <Route path="works" element={<MobileWorks />} />
                <Route path="photo-restore" element={<MobilePhotoRestore />} />
                <Route path="profile" element={<MobileProfile />} />
                <Route path="*" element={<Navigate to="/m" replace />} />
              </Route>

              {/* 应用内其它页面，保持原有 URL */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="interview" element={<AIInterview />} />
                <Route path="interview-review" element={<InterviewReview />} />
                <Route path="biography" element={<AIBiography />} />
                <Route path="biography/outline" element={<BiographyOutline />} />
                <Route path="polish" element={<BiographyPolish />} />
                <Route path="biography/print" element={<BiographyPrint />} />
                <Route path="my-works" element={<MyWorks />} />
                <Route path="group-buy" element={<V1Redirect><GroupBuy /></V1Redirect>} />
                <Route path="museum" element={<V1Redirect><Museum /></V1Redirect>} />
                <Route path="museum/:archiveId" element={<V1Redirect><Museum /></V1Redirect>} />
                <Route path="digital-assets" element={<V1Redirect><DigitalAssets /></V1Redirect>} />
                <Route path="biographers" element={<BiographerList />} />
                <Route path="my-biographer-orders" element={<Navigate to="/my-orders?type=biographer_service" replace />} />
                <Route path="my-orders" element={<MyOrders />} />
                <Route path="store" element={<Store />} />
                <Route path="store/:id" element={<ProductDetail />} />
                <Route path="biography-shelf" element={<BiographyShelf />} />
                <Route path="biography-shelf/:id" element={<BiographyShelf />} />
                <Route path="order-success" element={<OrderSuccess />} />
                <Route path="photo-restore" element={<V1Redirect><PhotoRestore /></V1Redirect>} />
                <Route path="archive" element={<LifeArchive />} />
                <Route path="family" element={<V1Redirect><FamilySpace /></V1Redirect>} />
                <Route path="genealogy" element={<V1Redirect><Genealogy /></V1Redirect>} />
                <Route path="family-hall" element={<V1Redirect><AIFamilyHall /></V1Redirect>} />
                <Route path="digital-person" element={<V1Redirect><DigitalLife /></V1Redirect>} />
                <Route path="digital-person/training-records" element={<V1Redirect><TrainingRecords /></V1Redirect>} />
                <Route path="digital-person/training-report" element={<V1Redirect><TrainingReport /></V1Redirect>} />
                <Route path="digital-companion" element={<V1Redirect><DigitalCompanion /></V1Redirect>} />
                <Route path="government" element={<V1Redirect><GovernmentService /></V1Redirect>} />
                <Route path="government/dashboard" element={<V1Redirect><GovernmentDashboard /></V1Redirect>} />
                <Route path="government/application/:id" element={<V1Redirect><ApplicationDetail /></V1Redirect>} />
                <Route path="government/policies" element={<V1Redirect><PolicyList /></V1Redirect>} />
                <Route path="settings" element={<Navigate to="/settings/account" replace />} />
                <Route path="settings/:section" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="family/members" element={<V1Redirect><FamilyMemberList /></V1Redirect>} />
                <Route path="family/members/:name" element={<V1Redirect><FamilyMemberDetail /></V1Redirect>} />
                <Route path="family/album/:title" element={<V1Redirect><AlbumDetail /></V1Redirect>} />
                <Route path="family/story/:title" element={<V1Redirect><StoryDetail /></V1Redirect>} />
                <Route path="family/event/:title" element={<V1Redirect><EventDetail /></V1Redirect>} />
                <Route path="family/notice/:index" element={<V1Redirect><NoticeDetail /></V1Redirect>} />
                <Route path="family/memorial/:name" element={<V1Redirect><MemorialDetail /></V1Redirect>} />
                <Route path="archive/media" element={<ArchiveMedia />} />
                <Route path="archive/event/:year/edit" element={<EventEdit />} />
                <Route path="archive/places" element={<ArchivePlaces />} />
                <Route path="archive/:section" element={<ArchiveSubPage />} />
                <Route path="genealogy/table" element={<V1Redirect><GenealogyTable /></V1Redirect>} />
                <Route path="genealogy/documents" element={<V1Redirect><GenealogyDocuments /></V1Redirect>} />
                <Route path="family-hall/project/:name" element={<V1Redirect><HallProjectDetail /></V1Redirect>} />
                <Route path="family-hall/project/:name/:module" element={<V1Redirect><HallModulePage /></V1Redirect>} />
                <Route path="family-hall/ai-refine" element={<V1Redirect><AIRefine /></V1Redirect>} />
                <Route path="family-hall/story-library" element={<V1Redirect><StoryLibrary /></V1Redirect>} />
                <Route path="family-hall/assessment" element={<V1Redirect><FamilyAssessment /></V1Redirect>} />
                <Route path="family-hall/activity" element={<V1Redirect><HallActivityDetail /></V1Redirect>} />
                <Route path="family-hall/deploy" element={<V1Redirect><FamilyHallDeploy /></V1Redirect>} />
                <Route path="family/calendar" element={<V1Redirect><FamilyCalendar /></V1Redirect>} />
                <Route path="family/albums" element={<V1Redirect><FamilyAlbums /></V1Redirect>} />
                <Route path="family/stories" element={<V1Redirect><FamilyStories /></V1Redirect>} />
                <Route path="family/child" element={<V1Redirect><FamilyChild /></V1Redirect>} />
                <Route path="family/child/:category" element={<V1Redirect><FamilyChildCategory /></V1Redirect>} />
                <Route path="family/relations" element={<V1Redirect><FamilyRelations /></V1Redirect>} />
                <Route path="family/roles" element={<V1Redirect><FamilyRoles /></V1Redirect>} />
                <Route path="family/motto" element={<V1Redirect><FamilyMotto /></V1Redirect>} />
                <Route path="family/inherit/:id" element={<V1Redirect><FamilyInherit /></V1Redirect>} />
                <Route path="family/events" element={<V1Redirect><FamilyEvents /></V1Redirect>} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Route>
            </Routes>
          </Suspense>
          </HashRouter>
        </AnnotationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
