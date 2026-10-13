import axios from 'axios';
import {
  AuthResponse,
  Booking,
  BookingPolicy,
  DashboardMetrics,
  NotificationItem,
  Page,
  Resource,
  ResourceType,
  Role,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token expiry
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data),
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    department: string;
    phone?: string;
    universityId?: string;
    role: Role;
  }) => apiClient.post<AuthResponse>('/auth/register', data),
  getMe: () => apiClient.get<User>('/auth/me'),
  updateProfile: (data: { fullName: string; department: string; phone?: string; universityId?: string }) =>
    apiClient.put<User>('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put('/auth/change-password', data),
};

// Resource APIs
export const resourceApi = {
  getResources: (params?: {
    search?: string;
    type?: ResourceType;
    minCapacity?: number;
    building?: string;
    activeOnly?: boolean;
    page?: number;
    size?: number;
  }) => apiClient.get<Page<Resource>>('/resources', { params }),
  getResourceById: (id: number) => apiClient.get<Resource>(`/resources/${id}`),
  getAvailability: (id: number, date?: string) =>
    apiClient.get<Booking[]>(`/resources/${id}/availability`, { params: { date } }),
  getAvailabilityRange: (id: number, startDate: string, endDate: string) =>
    apiClient.get<Booking[]>(`/resources/${id}/availability`, { params: { startDate, endDate } }),
  createResource: (data: Partial<Resource>) => apiClient.post<Resource>('/resources', data),
  updateResource: (id: number, data: Partial<Resource>) => apiClient.put<Resource>(`/resources/${id}`, data),
  toggleStatus: (id: number, active: boolean) =>
    apiClient.patch<Resource>(`/resources/${id}/status`, null, { params: { active } }),
};

// Booking APIs
export const bookingApi = {
  createBooking: (data: {
    resourceId: number;
    bookingDate: string;
    startTime: string;
    endTime: string;
    title: string;
    purpose: string;
    attendeesCount: number;
  }) => apiClient.post<Booking>('/bookings', data),
  getMyBookings: (page = 0, size = 10) =>
    apiClient.get<Page<Booking>>('/bookings/my', { params: { page, size } }),
  getBookingById: (id: number) => apiClient.get<Booking>(`/bookings/${id}`),
  cancelBooking: (id: number, reason?: string) =>
    apiClient.patch<Booking>(`/bookings/${id}/cancel`, { reason }),
  searchAllBookings: (params?: {
    resourceId?: number;
    department?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    size?: number;
  }) => apiClient.get<Page<Booking>>('/bookings', { params }),
  approveBooking: (id: number) => apiClient.patch<Booking>(`/bookings/${id}/approve`),
  rejectBooking: (id: number, reason: string) =>
    apiClient.patch<Booking>(`/bookings/${id}/reject`, { reason }),
};

// Notification APIs
export const notificationApi = {
  getNotifications: (page = 0, size = 15) =>
    apiClient.get<Page<NotificationItem>>('/notifications', { params: { page, size } }),
  getUnreadCount: () => apiClient.get<{ unreadCount: number }>('/notifications/unread-count'),
  markAsRead: (id: number) => apiClient.patch<NotificationItem>(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch<{ markedReadCount: number }>('/notifications/read-all'),
};

// Admin APIs
export const adminApi = {
  getDashboard: () => apiClient.get<DashboardMetrics>('/admin/dashboard'),
  getUserMetrics: () => apiClient.get<DashboardMetrics>('/admin/user-metrics'),
  getUsers: (page = 0, size = 20) => apiClient.get<Page<User>>('/admin/users', { params: { page, size } }),
  updateUserRole: (id: number, role: Role) =>
    apiClient.patch<User>(`/admin/users/${id}/role`, null, { params: { role } }),
  toggleUserStatus: (id: number, active: boolean) =>
    apiClient.patch<User>(`/admin/users/${id}/status`, null, { params: { active } }),
  getAuditLogs: (page = 0, size = 20) =>
    apiClient.get<Page<any>>('/admin/audit-logs', { params: { page, size } }),
  getPolicies: () => apiClient.get<BookingPolicy[]>('/admin/booking-policies'),
  updatePolicy: (id: number, policyValue: string) =>
    apiClient.put<BookingPolicy>(`/admin/booking-policies/${id}`, { policyValue }),
};
