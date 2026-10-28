import { HashRouter, Route, Routes } from 'react-router';
import AppLayout from './layout/AppLayout';
import AchievementsPage from './pages/AchievementsPage';
import BalanceEquationPage from './pages/BalanceEquationPage';
import ChaptersPage from './pages/ChaptersPage';
import ComponentsPreview from './pages/ComponentsPreview';
import ExamsPage from './pages/ExamsPage';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import NameCompoundPage from './pages/NameCompoundPage';
import ProblemPage, { StartPractice } from './pages/ProblemPage';
import ResultPage from './pages/ResultPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="poglavja" element={<ChaptersPage />} />
          <Route path="npz" element={<ExamsPage />} />
          <Route path="spojine" element={<NameCompoundPage />} />
          <Route path="reakcije" element={<BalanceEquationPage />} />
          <Route path="zgodovina" element={<HistoryPage />} />
          <Route path="dosezki" element={<AchievementsPage />} />
          <Route path="naloga" element={<StartPractice />} />
          <Route path="naloga/:subject/:year/:id" element={<ProblemPage />} />
          <Route path="rezultat" element={<ResultPage />} />
          <Route path="komponente" element={<ComponentsPreview />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
