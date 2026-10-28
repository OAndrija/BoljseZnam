import { HashRouter, Link, Route, Routes } from 'react-router';
import AppLayout from './layout/AppLayout';
import ComponentsPreview from './pages/ComponentsPreview';
import PlaceholderPage from './pages/PlaceholderPage';
import ProblemPage, { StartPractice } from './pages/ProblemPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            index
            element={
              <PlaceholderPage title="Domov">
                {/* temporary entry point until the home screen (phase 4) */}
                <Link to="/naloga">Reši vse naloge →</Link>
              </PlaceholderPage>
            }
          />
          <Route
            path="poglavja"
            element={<PlaceholderPage title="Po poglavjih" />}
          />
          <Route path="npz" element={<PlaceholderPage title="Celoten NPZ" />} />
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
          <Route path="komponente" element={<ComponentsPreview />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
