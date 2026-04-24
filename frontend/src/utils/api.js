import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'container-tracker-production-e604.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password })
};

export const containerAPI = {
  getAll: (params) => api.get('/api/containers', { params }),
  getById: (id) => api.get(`/api/containers/${id}`),
  create: (data) => api.post('/api/containers', data),
  update: (id, data) => api.put(`/api/containers/${id}`, data),
  delete: (id) => api.delete(`/api/containers/${id}`)
};

export const saleAPI = {
  getAll: (params) => api.get('/api/sales', { params }),
  getById: (id) => api.get(`/api/sales/${id}`),
  create: (data) => api.post('/api/sales', data),
  update: (id, data) => api.put(`/api/sales/${id}`, data)
};

export const reportAPI = {
  getDashboard: () => api.get('/api/reports/dashboard'),
  getSummary: (params) => api.get('/api/reports/summary', { params }),
  exportContainers: () => api.get('/api/reports/export/containers.xlsx', { responseType: 'blob' }),
  exportSales: () => api.get('/api/reports/export/sales.xlsx', { responseType: 'blob' }),
  exportPDF: (params) => api.get('/api/reports/export/summary.pdf', { params, responseType: 'text' }),
  getInvoice: (saleId) => api.get(`/api/reports/invoice/${saleId}`, { responseType: 'text' })
};

export const adminAPI = {
  getEmployees: () => api.get('/api/admin/employees'),
  createEmployee: (data) => api.post('/api/admin/employees', data),
  deleteEmployee: (id) => api.delete(`/api/admin/employees/${id}`),
  toggleEmployeeActive: (id) => api.put(`/api/admin/employees/${id}/toggle-active`),
  getEmployeePerformance: (params) => api.get('/api/admin/employees/performance', { params }),
  getEmployeeActivity: (id, params) => api.get(`/api/admin/employees/${id}/activity`, { params }),
  broadcastUpdate: (data) => api.post('/api/admin/notifications/broadcast', data)
};

export const notificationAPI = {
  getUserNotifications: (params) => api.get('/api/admin/notifications', { params }),
  markRead: (id) => api.put(`/api/admin/notifications/${id}/read`)
};

export const userAPI = {
  changePassword: (data) => api.put('/api/users/change-password', data),
  resetPassword: (data) => api.post('/api/users/reset-password', data)
};

export default api;
