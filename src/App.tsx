import { HashRouter, Routes, Route } from 'react-router-dom';
import { PersonalizationProvider } from './context/PersonalizationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useRoleBodyClass } from './hooks/useRoleBodyClass';
import { Layout } from './components/layout/Layout';
import { AuthContainer } from './components/auth/AuthContainer';
import { HomePage } from './pages/HomePage';
import { EstimatePage } from './pages/EstimatePage';

function AppRoutes() {
  const { user, loading, firebaseReady } = useAuth();
  useRoleBodyClass(user);

  if (loading) {    return (
      <div className="auth-loading">
        <p className="muted">Проверка авторизации…</p>
      </div>
    );
  }

  if (!firebaseReady || !user) {
    return <AuthContainer />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/estimate" element={<EstimatePage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PersonalizationProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </PersonalizationProvider>
    </AuthProvider>
  );
}
