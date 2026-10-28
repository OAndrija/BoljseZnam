import { HashRouter, Route, Routes } from 'react-router';
import AppLayout from './layout/AppLayout';
import ChaptersPage from './pages/ChaptersPage';
import ComponentsPreview from './pages/ComponentsPreview';
import ExamsPage from './pages/ExamsPage';
import HomePage from './pages/HomePage';
import PlaceholderPage from './pages/PlaceholderPage';
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
          <Route
            path="spojine"
            element={<PlaceholderPage title="Poimenuj spojine" />}
          />
          <Route
            path="reakcije"
            element={<PlaceholderPage title="Urejanje reakcij" />}
          />
          <Route
            path="zgodovina"
            element={<PlaceholderPage title="Zgodovina" />}
          />
          <Route path="dosezki" element={<PlaceholderPage title="Dosežki" />} />
          <Route path="naloga" element={<StartPractice />} />
          <Route path="naloga/:subject/:year/:id" element={<ProblemPage />} />
          <Route path="rezultat" element={<ResultPage />} />
          <Route path="komponente" element={<ComponentsPreview />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
