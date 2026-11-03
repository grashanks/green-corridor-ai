import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const vehiclesAPI = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

export const emergenciesAPI = {
  getAll: () => api.get('/emergencies'),
  getById: (id) => api.get(`/emergencies/${id}`),
  create: (data) => api.post('/emergencies', data),
  updateStatus: (id, status) => api.put(`/emergencies/${id}/status`, { request_status: status }),
  cancel: (id) => api.post(`/emergencies/${id}/cancel`),
};

export const routesAPI = {
  calculate: (data) => api.post('/routes/calculate', data),
  getByEmergencyId: (id) => api.get(`/routes/${id}`),
};

export const signalsAPI = {
  getAll: () => api.get('/signals'),
  getById: (id) => api.get(`/signals/${id}`),
  requestPriority: (id, data) => api.post(`/signals/${id}/priority`, data),
  restore: (id, reason) => api.post(`/signals/${id}/restore`, { intersection_id: id, reason }),
};

export const simulationAPI = {
  getStatus: () => api.get('/simulation/status'),
  start: (params) => api.post('/simulation/start', params || {}),
  pause: () => api.post('/simulation/pause'),
  resume: () => api.post('/simulation/resume'),
  stop: () => api.post('/simulation/stop'),
  startDemo: () => api.post('/simulation/demo/start'),
  resetDemo: () => api.post('/simulation/demo/reset'),
  runBenchmark: () => api.post('/simulation/benchmark'),
};

export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getTrips: () => api.get('/analytics/trips'),
  getPerformance: () => api.get('/analytics/performance'),
};

export const alertsAPI = {
  getAll: () => api.get('/alerts'),
  markRead: (id) => api.put(`/alerts/${id}/read`),
};

export const aiAPI = {
  detect: (formData) => api.post('/ai/detect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  confirmEmergency: (formData) => api.post('/ai/confirm-emergency', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export default api;
