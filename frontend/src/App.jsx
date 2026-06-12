import { Routes, Route, Navigate } from 'react-router-dom';
import { LessonProvider } from './context/LessonContext.jsx';
import HomePage from './pages/HomePage.jsx';
import LessonPage from './pages/LessonPage.jsx';
import Lesson2Page from './pages/Lesson2Page.jsx';
import Lesson3Page from './pages/Lesson3Page.jsx';
import LessonReportPage from './pages/LessonReportPage.jsx';
import Lesson2ReportPage from './pages/Lesson2ReportPage.jsx';
import Lesson3ReportPage from './pages/Lesson3ReportPage.jsx';
import LmsDebugOverlay from './components/shared/LmsDebugOverlay.jsx';

export default function App() {
  return (
    <LessonProvider>
      <LmsDebugOverlay />
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Lesson 1 — "Think Before You Spend" — clean standalone home URL */}
        <Route path="/lesson1" element={<HomePage forceLessonId="think-before-you-spend" />} />
        {/* Lesson 2 — "Where Does My Money Go?" — its own home page + acts */}
        <Route path="/lesson2" element={<Lesson2Page />} />
        <Route path="/lesson2/report" element={<Lesson2ReportPage />} />
        <Route path="/lesson2/:actId" element={<Lesson2Page />} />
        {/* Lesson 3 — "Scam Smart" — its own home page + acts */}
        <Route path="/lesson3" element={<Lesson3Page />} />
        <Route path="/lesson3/report" element={<Lesson3ReportPage />} />
        <Route path="/lesson3/:actId" element={<Lesson3Page />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
        <Route path="/lesson/:lessonId/report" element={<LessonReportPage />} />
        <Route path="/lesson/:lessonId/:actId" element={<LessonPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LessonProvider>
  );
}
