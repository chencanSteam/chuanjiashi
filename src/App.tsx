import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  return isMVP ? <Navigate to="/" replace /> : <>{children}</>;
}

const Onboarding = lazy(() => import('./pages/Onboarding'));
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
const Settings = lazy(() => import('./pages/Settings'));
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
const BiographerLayout = lazy(() => import('./components/BiographerLayout'));
const BiographerCenter = lazy(() => import('./pages/BiographerCenter'));
const BiographerOrders = lazy(() => import('./pages/BiographerOrders'));
const BiographerProfile = lazy(() => import('./pages/BiographerProfile'));
const BiographerProfileEdit = lazy(() => import('./pages/BiographerProfileEdit'));
const PhotoRestore = lazy(() => import('./pages/PhotoRestore'));
const BiographerList = lazy(() => import('./pages/BiographerList'));

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
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/partner/apply" element={<PartnerApplication />} />
              <Route path="/partner/login" element={<Navigate to="/login" replace />} />
              <Route path="/partner-center" element={<Navigate to="/partner" replace />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

              <Route path="/partner" element={<RoleRoute role="partner"><PartnerLayout /></RoleRoute>}>
                <Route index element={<PartnerCenter />} />
              </Route>

              <Route path="/biographer" element={<RoleRoute role="biographer"><BiographerLayout /></RoleRoute>}>
                <Route index element={<BiographerCenter />} />
                <Route path="orders" element={<BiographerOrders />} />
                <Route path="profile" element={<BiographerProfile />} />
                <Route path="profile/edit" element={<BiographerProfileEdit />} />
              </Route>

              <Route path="/admin" element={<RoleRoute role="admin"><AdminLayout /></RoleRoute>}>
                <Route index element={<Navigate to="/admin/biographers" replace />} />
                <Route path="biographers" element={<BiographerManagement />} />
                <Route path="partners" element={<PartnerManagement />} />
                <Route path="partner-applications" element={<PartnerApplications />} />
                <Route path="partner-customers" element={<PartnerCustomersAdmin />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="commission-records" element={<CommissionRecords />} />
                <Route path="book-review" element={<BookReview />} />
                <Route path="ai-usage" element={<AIUsage />} />
                <Route path="withdrawals" element={<WithdrawalManagement />} />
                <Route path="user-invites" element={<UserInvites />} />
              </Route>

              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Home />} />
                <Route path="interview" element={<AIInterview />} />
                <Route path="interview-review" element={<InterviewReview />} />
                <Route path="biography" element={<AIBiography />} />
                <Route path="biography/print" element={<BiographyPrint />} />
                <Route path="my-works" element={<MyWorks />} />
                <Route path="biographers" element={<BiographerList />} />
                <Route path="photo-restore" element={<PhotoRestore />} />
                <Route path="archive" element={<LifeArchive />} />
                <Route path="family" element={<MVPRedirect><FamilySpace /></MVPRedirect>} />
                <Route path="genealogy" element={<MVPRedirect><Genealogy /></MVPRedirect>} />
                <Route path="family-hall" element={<MVPRedirect><AIFamilyHall /></MVPRedirect>} />
                <Route path="digital-person" element={<DigitalLife />} />
                <Route path="digital-person/training-records" element={<MVPRedirect><TrainingRecords /></MVPRedirect>} />
                <Route path="digital-person/training-report" element={<MVPRedirect><TrainingReport /></MVPRedirect>} />
                <Route path="digital-companion" element={<MVPRedirect><DigitalCompanion /></MVPRedirect>} />
                <Route path="government" element={<MVPRedirect><GovernmentService /></MVPRedirect>} />
                <Route path="settings" element={<Navigate to="/settings/account" replace />} />
                <Route path="settings/:section" element={<Settings />} />
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
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
