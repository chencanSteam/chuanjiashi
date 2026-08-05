import { Suspense, lazy, type ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastProvider';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import PartnerLayout from './components/PartnerLayout';
import Login from './pages/Login';
import { useVersion } from './hooks/useVersion';
import './App.css';

function MVPRedirect({ children }: { children: ReactNode }) {
  const { isMVP } = useVersion();
  return isMVP ? <Navigate to="/home" replace /> : <>{children}</>;
}

// 运营后台 MVP 模式：非核心页面重定向到用户管理
function AdminMVPRedirect({ children }: { children: ReactNode }) {
  const { isMVP } = useVersion();
  return isMVP ? <Navigate to="/admin/users" replace /> : <>{children}</>;
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
                <Route index element={<AdminMVPRedirect><Navigate to="/admin/dashboard" replace /></AdminMVPRedirect>} />
                <Route path="dashboard" element={<AdminMVPRedirect><AdminDashboard /></AdminMVPRedirect>} />
                <Route path="users" element={<UserManagement />} />
                <Route path="archives" element={<ArchiveManagement />} />
                <Route path="biographers" element={<AdminMVPRedirect><BiographerManagement /></AdminMVPRedirect>} />
                <Route path="partners" element={<AdminMVPRedirect><PartnerManagement /></AdminMVPRedirect>} />
                <Route path="partner-applications" element={<AdminMVPRedirect><PartnerApplications /></AdminMVPRedirect>} />
                <Route path="partner-customers" element={<AdminMVPRedirect><PartnerCustomersAdmin /></AdminMVPRedirect>} />
                <Route path="orders" element={<AdminMVPRedirect><OrderManagement /></AdminMVPRedirect>} />
                <Route path="products" element={<AdminMVPRedirect><ProductManagement /></AdminMVPRedirect>} />
                <Route path="group-buy" element={<AdminMVPRedirect><GroupBuyManagement /></AdminMVPRedirect>} />
                <Route path="commission-records" element={<AdminMVPRedirect><CommissionRecords /></AdminMVPRedirect>} />
                <Route path="book-review" element={<AdminMVPRedirect><BookReview /></AdminMVPRedirect>} />
                <Route path="ai-usage" element={<AdminMVPRedirect><AIUsage /></AdminMVPRedirect>} />
                <Route path="withdrawals" element={<AdminMVPRedirect><WithdrawalManagement /></AdminMVPRedirect>} />
                <Route path="user-invites" element={<AdminMVPRedirect><UserInvites /></AdminMVPRedirect>} />
                <Route path="ai-tasks" element={<AITaskManagement />} />
                <Route path="roles" element={<AdminRolePermissions />} />
                <Route path="notifications" element={<AdminMVPRedirect><AdminNotifications /></AdminMVPRedirect>} />
                <Route path="content-review" element={<AdminMVPRedirect><ContentReview /></AdminMVPRedirect>} />
                <Route path="compliance" element={<AdminMVPRedirect><ComplianceRisk /></AdminMVPRedirect>} />
                <Route path="settings" element={<AdminMVPRedirect><AdminSettings /></AdminMVPRedirect>} />
                <Route path="*" element={<AdminMVPRedirect><Navigate to="/admin/dashboard" replace /></AdminMVPRedirect>} />
              </Route>

              <Route path="/m" element={<ProtectedRoute><MobileLayout /></ProtectedRoute>}>
                <Route index element={<MobileHome />} />
                <Route path="interview" element={<MobileInterview />} />
                <Route path="archive" element={<MobileArchive />} />
                <Route path="family" element={<MobileFamily />} />
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
                <Route path="biography/print" element={<BiographyPrint />} />
                <Route path="my-works" element={<MVPRedirect><MyWorks /></MVPRedirect>} />
                <Route path="group-buy" element={<MVPRedirect><GroupBuy /></MVPRedirect>} />
                <Route path="museum" element={<MVPRedirect><Museum /></MVPRedirect>} />
                <Route path="museum/:archiveId" element={<MVPRedirect><Museum /></MVPRedirect>} />
                <Route path="digital-assets" element={<MVPRedirect><DigitalAssets /></MVPRedirect>} />
                <Route path="biographers" element={<MVPRedirect><BiographerList /></MVPRedirect>} />
                <Route path="my-biographer-orders" element={<MVPRedirect><Navigate to="/my-orders?type=biographer_service" replace /></MVPRedirect>} />
                <Route path="my-orders" element={<MVPRedirect><MyOrders /></MVPRedirect>} />
                <Route path="store" element={<MVPRedirect><Store /></MVPRedirect>} />
                <Route path="store/:id" element={<MVPRedirect><ProductDetail /></MVPRedirect>} />
                <Route path="biography-shelf" element={<MVPRedirect><BiographyShelf /></MVPRedirect>} />
                <Route path="biography-shelf/:id" element={<MVPRedirect><BiographyShelf /></MVPRedirect>} />
                <Route path="order-success" element={<MVPRedirect><OrderSuccess /></MVPRedirect>} />
                <Route path="photo-restore" element={<MVPRedirect><PhotoRestore /></MVPRedirect>} />
                <Route path="archive" element={<LifeArchive />} />
                <Route path="family" element={<MVPRedirect><FamilySpace /></MVPRedirect>} />
                <Route path="genealogy" element={<MVPRedirect><Genealogy /></MVPRedirect>} />
                <Route path="family-hall" element={<MVPRedirect><AIFamilyHall /></MVPRedirect>} />
                <Route path="digital-person" element={<MVPRedirect><DigitalLife /></MVPRedirect>} />
                <Route path="digital-person/training-records" element={<MVPRedirect><TrainingRecords /></MVPRedirect>} />
                <Route path="digital-person/training-report" element={<MVPRedirect><TrainingReport /></MVPRedirect>} />
                <Route path="digital-companion" element={<MVPRedirect><DigitalCompanion /></MVPRedirect>} />
                <Route path="government" element={<MVPRedirect><GovernmentService /></MVPRedirect>} />
                <Route path="government/dashboard" element={<MVPRedirect><GovernmentDashboard /></MVPRedirect>} />
                <Route path="government/application/:id" element={<MVPRedirect><ApplicationDetail /></MVPRedirect>} />
                <Route path="government/policies" element={<MVPRedirect><PolicyList /></MVPRedirect>} />
                <Route path="settings" element={<MVPRedirect><Navigate to="/settings/account" replace /></MVPRedirect>} />
                <Route path="settings/:section" element={<MVPRedirect><Settings /></MVPRedirect>} />
                <Route path="profile" element={<Profile />} />
                <Route path="family/members" element={<MVPRedirect><FamilyMemberList /></MVPRedirect>} />
                <Route path="family/members/:name" element={<MVPRedirect><FamilyMemberDetail /></MVPRedirect>} />
                <Route path="family/album/:title" element={<MVPRedirect><AlbumDetail /></MVPRedirect>} />
                <Route path="family/story/:title" element={<MVPRedirect><StoryDetail /></MVPRedirect>} />
                <Route path="family/event/:title" element={<MVPRedirect><EventDetail /></MVPRedirect>} />
                <Route path="family/notice/:index" element={<MVPRedirect><NoticeDetail /></MVPRedirect>} />
                <Route path="family/memorial/:name" element={<MVPRedirect><MemorialDetail /></MVPRedirect>} />
                <Route path="archive/media" element={<ArchiveMedia />} />
                <Route path="archive/event/:year/edit" element={<EventEdit />} />
                <Route path="archive/places" element={<ArchivePlaces />} />
                <Route path="archive/:section" element={<ArchiveSubPage />} />
                <Route path="genealogy/table" element={<MVPRedirect><GenealogyTable /></MVPRedirect>} />
                <Route path="genealogy/documents" element={<MVPRedirect><GenealogyDocuments /></MVPRedirect>} />
                <Route path="family-hall/project/:name" element={<MVPRedirect><HallProjectDetail /></MVPRedirect>} />
                <Route path="family-hall/project/:name/:module" element={<MVPRedirect><HallModulePage /></MVPRedirect>} />
                <Route path="family-hall/ai-refine" element={<MVPRedirect><AIRefine /></MVPRedirect>} />
                <Route path="family-hall/story-library" element={<MVPRedirect><StoryLibrary /></MVPRedirect>} />
                <Route path="family-hall/assessment" element={<MVPRedirect><FamilyAssessment /></MVPRedirect>} />
                <Route path="family-hall/activity" element={<MVPRedirect><HallActivityDetail /></MVPRedirect>} />
                <Route path="family-hall/deploy" element={<MVPRedirect><FamilyHallDeploy /></MVPRedirect>} />
                <Route path="family/calendar" element={<MVPRedirect><FamilyCalendar /></MVPRedirect>} />
                <Route path="family/albums" element={<MVPRedirect><FamilyAlbums /></MVPRedirect>} />
                <Route path="family/stories" element={<MVPRedirect><FamilyStories /></MVPRedirect>} />
                <Route path="family/child" element={<MVPRedirect><FamilyChild /></MVPRedirect>} />
                <Route path="family/child/:category" element={<MVPRedirect><FamilyChildCategory /></MVPRedirect>} />
                <Route path="family/relations" element={<MVPRedirect><FamilyRelations /></MVPRedirect>} />
                <Route path="family/roles" element={<MVPRedirect><FamilyRoles /></MVPRedirect>} />
                <Route path="family/motto" element={<MVPRedirect><FamilyMotto /></MVPRedirect>} />
                <Route path="family/inherit/:id" element={<MVPRedirect><FamilyInherit /></MVPRedirect>} />
                <Route path="family/events" element={<MVPRedirect><FamilyEvents /></MVPRedirect>} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
