import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { PLATFORM } from '../constants';
import './Layout.css';

const CAPABILITIES: { to: string; label: string }[] = [
  { to: '/platinum-window', label: 'Platinum Window' },
  { to: '/progression-arbiter', label: 'Progression Arbiter' },
  { to: '/pae-onc', label: 'PAE-Onc Engine' },
  { to: '/zeta-core', label: 'Evidence' },
  { to: '/research-intelligence', label: 'Research Intelligence' },
];

function pathMatchesCapability(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [capabilitiesOpen, setCapabilitiesOpen] = useState(false);
  const capRef = useRef<HTMLDivElement>(null);

  const isFullWidth =
    location.pathname.startsWith('/progression-arbiter') ||
    location.pathname.startsWith('/pae-onc') ||
    location.pathname.startsWith('/research-intelligence');

  const capabilityActive = CAPABILITIES.some(({ to }) => pathMatchesCapability(location.pathname, to));

  const closeMenu = () => setIsMobileMenuOpen(false);
  const closeCapabilities = () => setCapabilitiesOpen(false);

  const [pathnameSeen, setPathnameSeen] = useState(location.pathname);
  if (location.pathname !== pathnameSeen) {
    setPathnameSeen(location.pathname);
    setCapabilitiesOpen(false);
  }

  useEffect(() => {
    if (!capabilitiesOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (capRef.current && !capRef.current.contains(e.target as Node)) {
        setCapabilitiesOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCapabilitiesOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [capabilitiesOpen]);

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

              <div
                ref={capRef}
                className={`nav-dropdown ${capabilitiesOpen ? 'nav-dropdown-open' : ''}`}
              >
                <button
                  type="button"
                  className={`nav-dropdown-trigger ${capabilityActive ? 'active' : ''}`}
                  aria-expanded={capabilitiesOpen}
                  aria-haspopup="true"
                  aria-controls="nav-capabilities-panel"
                  onClick={() => setCapabilitiesOpen((o) => !o)}
                >
                  Capabilities
                  <ChevronDown size={16} className="nav-dropdown-chevron" aria-hidden />
                </button>
                <span className="nav-capabilities-heading-mobile">Capabilities</span>
                <div className="nav-dropdown-panel" id="nav-capabilities-panel">
                  {CAPABILITIES.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        isActive ? 'nav-link nav-dropdown-link active' : 'nav-link nav-dropdown-link'}
                      onClick={() => {
                        closeMenu();
                        closeCapabilities();
                      }}
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>

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
