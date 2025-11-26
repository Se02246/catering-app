import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import CreateQuote from './pages/CreateQuote';
import Login from './pages/Login';
import { Lock } from 'lucide-react';
import './styles/index.css';
import { InstallPromptProvider } from './context/InstallPromptContext';

function AppContent() {
  React.useEffect(() => {
    const handleContextMenu = (e) => {
      // Check if target is an image and NOT inside admin dashboard
      if (e.target.tagName === 'IMG' && !e.target.closest('.admin-dashboard')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <div className="app-container">
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/quote" element={<CreateQuote />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
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
