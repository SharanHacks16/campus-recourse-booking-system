export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN';

export type ResourceType = 'CLASSROOM' | 'LABORATORY' | 'AUDITORIUM';

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type NotificationType =
  | 'BOOKING_SUBMITTED'
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'SYSTEM';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  department: string;
  phone?: string;
  universityId?: string;
  active: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  id: number;
  email: string;
  fullName: string;
  role: Role;
  department: string;
  phone?: string;
  universityId?: string;
}

export interface Resource {
  id: number;
  name: string;
  type: ResourceType;
  building: string;
  roomNumber: string;
  capacity: number;
  description?: string;
  department?: string;
  amenities?: string;
  operatingOpenTime: string; // HH:mm
  operatingCloseTime: string; // HH:mm
  isActive: boolean;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: number;
  resourceId: number;
  resourceName: string;
  resourceType: ResourceType;
  building: string;
  roomNumber: string;
  resourceCapacity: number;

  userId: number;
  userFullName: string;
  userEmail: string;
  userRole: Role;
  userDepartment: string;

  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  title: string;
  purpose: string;
  attendeesCount: number;
  status: BookingStatus;

  rejectionReason?: string;
  cancellationReason?: string;
  cancelledById?: number;
  cancelledByName?: string;
  approvedById?: number;
  approvedByName?: string;
  decisionTimestamp?: string;

  createdAt: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: number;
  bookingId?: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: number;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface BookingPolicy {
  id: number;
  policyKey: string;
  policyValue: string;
  description?: string;
  updatedAt?: string;
}

export interface DashboardMetrics {
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
  cancelledBookings: number;
  totalActiveResources: number;
  totalUsers: number;
  todayBookingsCount: number;
  categoryDistribution?: Record<string, number>;
  mostBookedResources?: Array<{
    resourceId: number;
    name: string;
    type: string;
    bookingCount: number;
  }>;
  recentBookings?: Booking[];
  upcomingBookings?: Booking[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
