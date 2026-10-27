import { HashRouter, Route, Routes } from 'react-router';
import AppLayout from './layout/AppLayout';
import PlaceholderPage from './pages/PlaceholderPage';
import ProblemPage from './pages/ProblemPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<PlaceholderPage title="Domov" />} />
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
          <Route path="naloga" element={<ProblemPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
