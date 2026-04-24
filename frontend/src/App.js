import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Layout from './components/Layout';
import { AuthContext } from './context/AuthContext';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Containers = lazy(() => import('./pages/Containers'));
const ContainerForm = lazy(() => import('./pages/ContainerForm'));
const SellContainer = lazy(() => import('./pages/SellContainer'));
const Sales = lazy(() => import('./pages/Sales'));
const Reports = lazy(() => import('./pages/Reports'));
const AdminEmployees = lazy(() => import('./pages/AdminEmployees'));
const Settings = lazy(() => import('./pages/Settings'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const ProtectedRoute = ({ children }) => {
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    if (user?.mustResetPassword) {
      return <Navigate to="/reset-password" replace />;
    }
    return children;
  };

  const RoleRoute = ({ children, allowedRoles }) => {
    if (!user || !allowedRoles.includes(user.role)) {
      return <Navigate to="/containers" replace />;
    }
    return children;
  };

  const defaultRoute = user?.role === 'employee' ? '/containers' : '/dashboard';

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser }}>
      <Router>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={token ? <Navigate to={user?.mustResetPassword ? '/reset-password' : defaultRoute} replace /> : <Login />} />
          <Route
            path="/reset-password"
            element={
              !token ? <Navigate to="/login" replace /> :
              !user?.mustResetPassword ? <Navigate to={defaultRoute} replace /> :
              <Suspense fallback={<PageFallback />}><ResetPassword /></Suspense>
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageFallback />}>
                    <Routes>
                      <Route path="/dashboard" element={
                        <RoleRoute allowedRoles={['admin', 'finance', 'ops']}>
                          <Dashboard />
                        </RoleRoute>
                      } />
                      <Route path="/containers" element={<Containers />} />
                      <Route path="/containers/new" element={<ContainerForm />} />
                      <Route path="/containers/edit/:id" element={
                        <RoleRoute allowedRoles={['admin', 'finance', 'ops']}>
                          <ContainerForm />
                        </RoleRoute>
                      } />
                      <Route path="/sell" element={<SellContainer />} />
                      <Route path="/sales" element={
                        <RoleRoute allowedRoles={['admin', 'finance', 'ops']}>
                          <Sales />
                        </RoleRoute>
                      } />
                      <Route path="/reports" element={
                        <RoleRoute allowedRoles={['admin', 'finance']}>
                          <Reports />
                        </RoleRoute>
                      } />
                      <Route path="/admin/employees" element={
                        <RoleRoute allowedRoles={['admin']}>
                          <AdminEmployees />
                        </RoleRoute>
                      } />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
