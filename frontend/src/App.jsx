import { Routes, Route, Navigate } from 'react-router-dom';
import { LessonProvider } from './context/LessonContext.jsx';
import HomePage from './pages/HomePage.jsx';
import LessonPage from './pages/LessonPage.jsx';
import Lesson2Page from './pages/Lesson2Page.jsx';
import LessonReportPage from './pages/LessonReportPage.jsx';

export default function App() {
  return (
    <LessonProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Lesson 2 — "Where Does My Money Go?" — its own home page + acts */}
        <Route path="/lesson2" element={<Lesson2Page />} />
        <Route path="/lesson2/:actId" element={<Lesson2Page />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
        <Route path="/lesson/:lessonId/report" element={<LessonReportPage />} />
        <Route path="/lesson/:lessonId/:actId" element={<LessonPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LessonProvider>
  );
}
