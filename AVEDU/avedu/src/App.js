import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Route-level code splitting: each page (and its heavy transitive deps —
// Monaco, Blockly/ReactFlow, Three.js+Rapier, xterm, Unity) is fetched on
// demand instead of being bundled into one chunk that the login screen must
// download and parse on first paint.
const Home = lazy(() => import('./pages/Home'));
const Learn = lazy(() => import('./pages/Learn'));
const UnitPage = lazy(() => import('./pages/UnitPage'));
const LearnLevel = lazy(() => import('./pages/LearnLevel'));
const IDETestPage = lazy(() => import('./pages/IDETestPage'));
const SimPage = lazy(() => import('./pages/SimPage'));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage'));
const BetaTestPage = lazy(() => import('./pages/BetaTestPage'));
const MetricsDashboard = lazy(() => import('./pages/MetricsDashboard'));

export default function App() {
  return (
    <Suspense fallback={<div className="placeholder">Cargando…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/learn" element={<Learn />}>
          <Route index element={<div className="placeholder">Select a Unit</div>} />
          <Route path=":unitSlug" element={<UnitPage />}>
            <Route index element={<div className="placeholder">Choose a level</div>} />
            <Route path=":levelSlug" element={<LearnLevel />} />
          </Route>
        </Route>

        <Route path="/research"  element={<IDETestPage />} />
        <Route path="/sim"       element={<SimPage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/betatest"  element={<BetaTestPage />} />
        <Route path="/metrics"   element={<MetricsDashboard />} />

        <Route path="*" element={<Navigate to="/learn" replace />} />
      </Routes>
    </Suspense>
  );
}
