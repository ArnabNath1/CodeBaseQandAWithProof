import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { CodebaseProvider } from './context/CodebaseContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AskPage from './pages/AskPage';
import HistoryPage from './pages/HistoryPage';
import RefactorPage from './pages/RefactorPage';
import StatusPage from './pages/StatusPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <CodebaseProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/ask" element={<AskPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/refactor" element={<RefactorPage />} />
            <Route path="/status" element={<StatusPage />} />
          </Routes>
        </CodebaseProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
