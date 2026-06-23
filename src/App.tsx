import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastProvider';
import Layout from './components/Layout';
import Home from './pages/Home';
import AIInterview from './pages/AIInterview';
import AIBiography from './pages/AIBiography';
import LifeArchive from './pages/LifeArchive';
import FamilySpace from './pages/FamilySpace';
import Genealogy from './pages/Genealogy';
import AIFamilyHall from './pages/AIFamilyHall';
import DigitalLife from './pages/DigitalLife';
import TrainingRecords from './pages/TrainingRecords';
import TrainingReport from './pages/TrainingReport';
import DigitalCompanion from './pages/DigitalCompanion';
import GovernmentService from './pages/GovernmentService';
import Settings from './pages/Settings';
import FamilyMemberList from './pages/FamilyMemberList';
import FamilyMemberDetail from './pages/FamilyMemberDetail';
import AlbumDetail from './pages/AlbumDetail';
import StoryDetail from './pages/StoryDetail';
import EventDetail from './pages/EventDetail';
import NoticeDetail from './pages/NoticeDetail';
import MemorialDetail from './pages/MemorialDetail';
import ArchiveMedia from './pages/ArchiveMedia';
import EventEdit from './pages/EventEdit';
import GenealogyTable from './pages/GenealogyTable';
import GenealogyDocuments from './pages/GenealogyDocuments';
import ApplicationDetail from './pages/ApplicationDetail';
import PolicyList from './pages/PolicyList';
import HallProjectDetail from './pages/HallProjectDetail';
import HallModulePage from './pages/HallModulePage';
import AIRefine from './pages/AIRefine';
import StoryLibrary from './pages/StoryLibrary';
import FamilyAssessment from './pages/FamilyAssessment';
import HallActivityDetail from './pages/HallActivityDetail';
import FamilyCalendar from './pages/FamilyCalendar';
import FamilyAlbums from './pages/FamilyAlbums';
import FamilyStories from './pages/FamilyStories';
import FamilyChild from './pages/FamilyChild';
import FamilyChildCategory from './pages/FamilyChildCategory';
import FamilyRelations from './pages/FamilyRelations';
import FamilyRoles from './pages/FamilyRoles';
import FamilyMotto from './pages/FamilyMotto';
import FamilyInherit from './pages/FamilyInherit';
import FamilyEvents from './pages/FamilyEvents';
import ArchivePlaces from './pages/ArchivePlaces';
import ArchiveSubPage from './pages/ArchiveSubPage';
import GovernmentDashboard from './pages/GovernmentDashboard';
import FamilyHallDeploy from './pages/FamilyHallDeploy';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="interview" element={<AIInterview />} />
            <Route path="biography" element={<AIBiography />} />
            <Route path="archive" element={<LifeArchive />} />
            <Route path="family" element={<FamilySpace />} />
            <Route path="genealogy" element={<Genealogy />} />
            <Route path="family-hall" element={<AIFamilyHall />} />
            <Route path="digital-person" element={<DigitalLife />} />
            <Route path="digital-person/training-records" element={<TrainingRecords />} />
            <Route path="digital-person/training-report" element={<TrainingReport />} />
            <Route path="digital-companion" element={<DigitalCompanion />} />
            <Route path="government" element={<GovernmentService />} />
            <Route path="settings" element={<Navigate to="/settings/account" replace />} />
            <Route path="settings/:section" element={<Settings />} />
            <Route path="family/members" element={<FamilyMemberList />} />
            <Route path="family/members/:name" element={<FamilyMemberDetail />} />
            <Route path="family/album/:title" element={<AlbumDetail />} />
            <Route path="family/story/:title" element={<StoryDetail />} />
            <Route path="family/event/:title" element={<EventDetail />} />
            <Route path="family/notice/:index" element={<NoticeDetail />} />
            <Route path="family/memorial/:name" element={<MemorialDetail />} />
            <Route path="archive/media" element={<ArchiveMedia />} />
            <Route path="archive/event/:year/edit" element={<EventEdit />} />
            <Route path="archive/places" element={<ArchivePlaces />} />
            <Route path="archive/:section" element={<ArchiveSubPage />} />
            <Route path="genealogy/table" element={<GenealogyTable />} />
            <Route path="genealogy/documents" element={<GenealogyDocuments />} />
            <Route path="government/application/:code" element={<ApplicationDetail />} />
            <Route path="government/policies" element={<PolicyList />} />
            <Route path="family-hall/project/:name" element={<HallProjectDetail />} />
            <Route path="family-hall/project/:name/:module" element={<HallModulePage />} />
            <Route path="family-hall/ai-refine" element={<AIRefine />} />
            <Route path="family-hall/story-library" element={<StoryLibrary />} />
            <Route path="family-hall/assessment" element={<FamilyAssessment />} />
            <Route path="family-hall/activity" element={<HallActivityDetail />} />
            <Route path="family-hall/deploy" element={<FamilyHallDeploy />} />
            <Route path="family/calendar" element={<FamilyCalendar />} />
            <Route path="family/albums" element={<FamilyAlbums />} />
            <Route path="family/stories" element={<FamilyStories />} />
            <Route path="family/child" element={<FamilyChild />} />
            <Route path="family/child/:category" element={<FamilyChildCategory />} />
            <Route path="family/relations" element={<FamilyRelations />} />
            <Route path="family/roles" element={<FamilyRoles />} />
            <Route path="family/motto" element={<FamilyMotto />} />
            <Route path="family/inherit/:id" element={<FamilyInherit />} />
            <Route path="family/events" element={<FamilyEvents />} />
            <Route path="archive/places" element={<ArchivePlaces />} />
            <Route path="government/dashboard" element={<GovernmentDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
