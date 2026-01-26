import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ScrollToTop from './components/ScrollToTop';
import './styles/variables.css';
import './styles/animations.css';
// Тестовые функции для консоли (в dev режиме)
import './lib/testHelper';

// Lazy loading для страниц — ускоряет первоначальную загрузку
const MainPage = lazy(() => import('./pages/MainPage'));
const SurveyPage = lazy(() => import('./pages/SurveyPage'));
const FoodPage = lazy(() => import('./pages/FoodPage'));
const MealPlanPage = lazy(() => import('./pages/MealPlanPage'));
const RecipesPage = lazy(() => import('./pages/RecipesPage'));
const ShoppingPage = lazy(() => import('./pages/ShoppingPage'));
const DiaryPage = lazy(() => import('./pages/DiaryPage'));
const SavedPage = lazy(() => import('./pages/SavedPage'));
const MyReportPage = lazy(() => import('./pages/MyReportPage'));
const MaterialsPage = lazy(() => import('./pages/MaterialsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const VitaminsPage = lazy(() => import('./pages/VitaminsPage'));
const ProgramDetailPage = lazy(() => import('./pages/ProgramDetailPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const FastingSettingsPage = lazy(() => import('./pages/FastingSettingsPage'));
const FastingPage = lazy(() => import('./pages/FastingPage'));
const FastingHistoryPage = lazy(() => import('./pages/FastingHistoryPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const UpdateReportPage = lazy(() => import('./pages/UpdateReportPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const StreamDetailPage = lazy(() => import('./pages/StreamDetailPage'));
const HealthScreenPage = lazy(() => import('./pages/HealthScreenPage'));
const PlateDetailPage = lazy(() => import('./pages/PlateDetailPage'));
const LearningPage = lazy(() => import('./pages/LearningPage'));
const ModulePage = lazy(() => import('./pages/ModulePage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const ProgramsListPage = lazy(() => import('./pages/ProgramsListPage'));

// Компонент загрузки
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8FAFC'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #E2E8F0',
        borderTopColor: '#4A90E2',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={<MainPage />} />
          <Route path="/health-screen" element={<HealthScreenPage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/food" element={<FoodPage />} />
          <Route path="/food/plan" element={<MealPlanPage />} />
          <Route path="/food/recipes" element={<RecipesPage />} />
          <Route path="/food/shopping" element={<ShoppingPage />} />
          <Route path="/food/diary" element={<DiaryPage />} />
          <Route path="/food/saved" element={<SavedPage />} />
          <Route path="/food/fasting" element={<FastingPage />} />
          <Route path="/food/fasting/history" element={<FastingHistoryPage />} />
          <Route path="/food/plate/:plateId" element={<PlateDetailPage />} />
          <Route path="/report" element={<MyReportPage />} />
          <Route path="/report/update" element={<UpdateReportPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/stream/:id" element={<StreamDetailPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/learning/:moduleSlug" element={<ModulePage />} />
          <Route path="/learning/:moduleSlug/:lessonSlug" element={<LessonPage />} />
          <Route path="/programs" element={<ProgramsListPage />} />
          <Route path="/program/:id" element={<ProgramDetailPage />} />
          <Route path="/course/:id" element={<CoursePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/profile/stats" element={<StatsPage />} />
          <Route path="/profile/fasting" element={<FastingSettingsPage />} />
          <Route path="/vitamins" element={<VitaminsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
