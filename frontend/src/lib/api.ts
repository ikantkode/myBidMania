import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const agencyAPI = {
  getAll: () => api.get('/agencies'),
  create: (data: { name: string; address: string }) =>
    api.post('/agencies', data),
  getOne: (id: string) => api.get(`/agencies/${id}`),
  update: (id: string, data: { name: string; address: string }) =>
    api.put(`/agencies/${id}`, data),
  delete: (id: string) => api.delete(`/agencies/${id}`),
  addContact: (id: string, data: { name: string; email?: string; phone?: string }) =>
    api.post(`/agencies/${id}/contacts`, data),
  getContacts: (id: string) => api.get(`/agencies/${id}/contacts`),
  deleteContact: (agencyId: string, contactId: string) =>
    api.delete(`/agencies/${agencyId}/contacts/${contactId}`),
};

export const projectAPI = {
  getAll: () => api.get('/projects'),
  create: (data: any) => api.post('/projects', data),
  getOne: (id: string) => api.get(`/projects/${id}`),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addAddendum: (id: string, data: any) => api.post(`/projects/${id}/addenda`, data),
  deleteAddendum: (id: string, addendumId: string) =>
    api.delete(`/projects/${id}/addenda/${addendumId}`),
  uploadFile: (id: string, file: File, type: 'drawing' | 'spec') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', type);
    return api.post(`/projects/${id}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFiles: (id: string) => api.get(`/projects/${id}/files`),
  deleteFile: (id: string, fileId: string) =>
    api.delete(`/projects/${id}/files/${fileId}`),
};

export const calendarAPI = {
  getEvents: () => api.get('/calendar/events'),
};

export const notificationAPI = {
  sendReminders: () => api.post('/notifications/send-reminders'),
  getStatus: () => api.get('/notifications/status'),
};

export const teamMemberAPI = {
  getAll: () => api.get('/team-members'),
  create: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post('/team-members', data),
  update: (id: string, data: { name?: string; role?: string }) =>
    api.put(`/team-members/${id}`, data),
  delete: (id: string) => api.delete(`/team-members/${id}`),
  updatePassword: (id: string, password: string) =>
    api.patch(`/team-members/${id}/password`, { password }),
};

export const settingsAPI = {
  getProfile: () => api.get('/settings/profile'),
  updateProfile: (data: { name?: string; email?: string }) =>
    api.put('/settings/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/settings/change-password', data),
  getEmailSettings: () => api.get('/settings/email'),
  updateEmailSettings: (data: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass?: string;
    emailFrom: string;
  }) => api.put('/settings/email', data),
};

export default api;
