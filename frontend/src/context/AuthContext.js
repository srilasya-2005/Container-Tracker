import { createContext } from 'react';

export const AuthContext = createContext({
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {}
});

// Role-checking helpers
export const isAdmin = (user) => user?.role === 'admin';
export const isEmployee = (user) => user?.role === 'employee';
export const canAccessReports = (user) => ['admin', 'finance'].includes(user?.role);
export const canAccessSales = (user) => ['admin', 'finance', 'ops'].includes(user?.role);
export const canAccessDashboard = (user) => ['admin', 'finance', 'ops'].includes(user?.role);
export const canDeleteContainers = (user) => user?.role === 'admin';
export const canEditContainers = (user) => ['admin', 'finance', 'ops'].includes(user?.role);
