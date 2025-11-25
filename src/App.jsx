import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import CreateQuote from './pages/CreateQuote';
import Login from './pages/Login';
import { Lock } from 'lucide-react';
import InstallPrompt from './components/Common/InstallPrompt';
import './styles/index.css';

function AppContent() {
  return (
    <div className="app-container">
      <InstallPrompt />
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
