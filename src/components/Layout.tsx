import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { PLATFORM } from '../constants';
import './Layout.css';

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isFullWidth =
    location.pathname.startsWith('/progression-arbiter') ||
    location.pathname.startsWith('/pae-onc') ||
    location.pathname.startsWith('/research-intelligence');

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="layout">
      <nav className="nav">
        <div className="nav-inner">
          <NavLink to="/" className="nav-brand" onClick={closeMenu}>
            <span className="brand-icon">🧬</span>
            <span className="brand-text">{PLATFORM.name}</span>
            <span className="brand-dot">{PLATFORM.domain}</span>
          </NavLink>
          <div className="nav-right">
            <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
              <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
                Home
              </NavLink>
              <NavLink to="/platinum-window" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
                Platinum Window
              </NavLink>
              <NavLink to="/progression-arbiter" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
                Progression Arbiter
              </NavLink>
              <NavLink to="/pae-onc" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
                PAE-Onc Engine
              </NavLink>
              <NavLink to="/zeta-core" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
                Evidence
              </NavLink>
              <NavLink to="/research-intelligence" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
                Research Intel
              </NavLink>
              <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
                About
              </NavLink>
              <a href="https://www.CrisPRO.ai" target="_blank" rel="noopener noreferrer" className="nav-link text-blue-600 font-bold hover:text-blue-700" onClick={closeMenu}>
                AI
              </a>
            </div>
            <div className="nav-actions">
              <ThemeToggle />
              <button 
                className="mobile-menu-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className={isFullWidth ? "main-full" : "main"}>
        <Outlet />
      </main>
      <footer className="footer">
        <p>{PLATFORM.footer}</p>
      </footer>
    </div>
  );
}
