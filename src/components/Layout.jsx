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

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-1">
            {navLink('/', 'Início')}
            {navLink('/clientes', 'Clientes')}
            {navLink('/promissorias', 'Promissórias')}
          </nav>
          <div className="flex items-center gap-4">
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
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
