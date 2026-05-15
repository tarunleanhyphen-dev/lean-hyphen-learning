import { Routes, Route, Navigate } from 'react-router-dom';
import { LessonProvider } from './context/LessonContext.jsx';
import HomePage from './pages/HomePage.jsx';
import LessonPage from './pages/LessonPage.jsx';

export default function App() {
  return (
    <LessonProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
        <Route path="/lesson/:lessonId/:actId" element={<LessonPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LessonProvider>
  );
}
