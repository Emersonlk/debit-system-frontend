import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientesList from './pages/clientes/ClientesList';
import ClienteForm from './pages/clientes/ClienteForm';
import PromissoriasList from './pages/promissorias/PromissoriasList';
import PromissoriaForm from './pages/promissorias/PromissoriaForm';
import PromissoriaDetail from './pages/promissorias/PromissoriaDetail';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<ClientesList />} />
            <Route path="clientes/novo" element={<ClienteForm />} />
            <Route path="clientes/:id/editar" element={<ClienteForm />} />
            <Route path="promissorias" element={<PromissoriasList />} />
            <Route path="promissorias/novo" element={<PromissoriaForm />} />
            <Route path="promissorias/:id" element={<PromissoriaDetail />} />
            <Route path="promissorias/:id/editar" element={<PromissoriaForm />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
