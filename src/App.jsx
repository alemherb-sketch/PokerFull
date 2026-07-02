import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Camera, Settings } from 'lucide-react';
import AdminDashboard from './components/AdminPanel/AdminDashboard';
import GameRoom from './components/GameRoom/GameRoom';
import DealerPanel from './components/DealerPanel/DealerPanel';

function App() {
  return (
    <Router>
      <div className="app-layout" style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside className="glass-panel sidebar" style={{ width: '250px', padding: '1.5rem', margin: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="sidebar-header" style={{ marginBottom: '2rem' }}>
            <h1 className="text-gradient" style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ♠️ PokerFull
            </h1>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <LayoutDashboard size={20} />
              <span>Admin</span>
            </Link>
            <Link to="/room" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <Users size={20} />
              <span>Sala VIP</span>
            </Link>
            <Link to="/dealer" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <Camera size={20} />
              <span>Dealer</span>
            </Link>
          </nav>

          <div style={{ marginTop: 'auto' }}>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
              <Settings size={20} />
              <span>Ajustes</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '2rem' }}>
          <header className="flex-between glass-panel" style={{ padding: '1rem 2rem', marginBottom: '2rem' }}>
            <div>
              <h3>Gestión de Poker en Vivo</h3>
            </div>
            <div className="flex-center" style={{ gap: '1rem' }}>
              <span>Administrador Principal</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #d97706)' }} />
            </div>
          </header>

          <div className="glass-panel" style={{ padding: '2rem', minHeight: 'calc(100vh - 150px)' }}>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/room" element={<GameRoom />} />
              <Route path="/dealer" element={<DealerPanel />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
