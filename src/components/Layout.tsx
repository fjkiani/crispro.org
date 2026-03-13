import { NavLink, Outlet } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { PLATFORM } from '../constants';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <nav className="nav">
        <div className="nav-inner">
          <NavLink to="/" className="nav-brand">
            <span className="brand-icon">🧬</span>
            <span className="brand-text">{PLATFORM.name}</span>
            <span className="brand-dot">{PLATFORM.domain}</span>
          </NavLink>
          <div className="nav-right">
            <div className="nav-links">
              <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Home
              </NavLink>
              <NavLink to="/platinum-window" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Platinum Window
              </NavLink>
              <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                About
              </NavLink>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>{PLATFORM.footer}</p>
      </footer>
    </div>
  );
}
