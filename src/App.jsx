import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import CreateQuote from './pages/CreateQuote';
import Login from './pages/Login';
import SharedQuote from './pages/SharedQuote';
import SharedPackage from './pages/SharedPackage';
import ReviewsPage from './pages/ReviewsPage';
import { Lock } from 'lucide-react';
import './styles/index.css';
import { InstallPromptProvider } from './context/InstallPromptContext';
import ScrollToTopFab from './components/Common/ScrollToTopFab';

function AppContent() {
  React.useEffect(() => {
    const handleContextMenu = (e) => {
      // Check if target is an image and NOT inside admin dashboard
      if (e.target.tagName === 'IMG' && !e.target.closest('.admin-dashboard')) {
        e.preventDefault();
      }
    };

    const handleDragStart = (e) => {
      // Check if target is an image and NOT inside admin dashboard
      if (e.target.tagName === 'IMG' && !e.target.closest('.admin-dashboard')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return (
    <div className="app-container">
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/quote" element={<CreateQuote />} />
          <Route path="/quote/:id" element={<SharedQuote />} />
          <Route path="/menu/:menuId" element={<SharedQuote isMenuMode={true} />} />
          <Route path="/package/:id" element={<SharedPackage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/recensioni" element={<ReviewsPage />} />
        </Routes>
      </main>
      <ScrollToTopFab />
    </div>
  );
}

function App() {
  return (
    <Router>
      <InstallPromptProvider>
        <AppContent />
      </InstallPromptProvider>
    </Router>
  );
}

export default App;
