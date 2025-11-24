import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import CreateQuote from './pages/CreateQuote';
import Login from './pages/Login';
import { Lock } from 'lucide-react';
import './styles/index.css';

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <Link to="/admin" className="hamburger-btn" style={{ color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={24} />
        </Link>
        {!isHomePage && <h3>Catering App</h3>}
      </div>

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
      <AppContent />
    </Router>
  );
}

export default App;
