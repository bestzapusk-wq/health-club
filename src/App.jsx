import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import MainPage from './pages/MainPage';
import SurveyPage from './pages/SurveyPage';
import FoodPage from './pages/FoodPage';
import MealPlanPage from './pages/MealPlanPage';
import RecipesPage from './pages/RecipesPage';
import ShoppingPage from './pages/ShoppingPage';
import DiaryPage from './pages/DiaryPage';
import SavedPage from './pages/SavedPage';
import MyReportPage from './pages/MyReportPage';
import MaterialsPage from './pages/MaterialsPage';
import ProfilePage from './pages/ProfilePage';
import CoursePage from './pages/CoursePage';
import VitaminsPage from './pages/VitaminsPage';
import ProgramDetailPage from './pages/ProgramDetailPage';
import './styles/variables.css';
import './styles/animations.css';
// Тестовые функции для консоли (в dev режиме)
import './lib/testHelper';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<MainPage />} />
        <Route path="/survey" element={<SurveyPage />} />
        <Route path="/food" element={<FoodPage />} />
        <Route path="/food/plan" element={<MealPlanPage />} />
        <Route path="/food/recipes" element={<RecipesPage />} />
        <Route path="/food/shopping" element={<ShoppingPage />} />
        <Route path="/food/diary" element={<DiaryPage />} />
        <Route path="/food/saved" element={<SavedPage />} />
        <Route path="/report" element={<MyReportPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/program/:id" element={<ProgramDetailPage />} />
        <Route path="/course/:id" element={<CoursePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/vitamins" element={<VitaminsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
