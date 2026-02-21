import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLink = (to, label) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-lg text-sm font-medium ${
          isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        {label}
      </Link>
    );
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <nav className="hidden md:flex items-center gap-1">
              {navLink('/', 'Início')}
              {navLink('/clientes', 'Clientes')}
              {navLink('/promissorias', 'Promissórias')}
            </nav>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-slate-600">{user?.name ?? user?.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-slate-600 hover:text-slate-900 underline"
              >
                Sair
              </button>
            </div>
          </div>
          {/* Menu mobile */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-slate-200 space-y-1">
              {navLink('/', 'Início')}
              {navLink('/clientes', 'Clientes')}
              {navLink('/promissorias', 'Promissórias')}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-600 px-3 py-2">{user?.name ?? user?.email}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-slate-600 hover:text-slate-900 underline px-3 py-2"
                >
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
