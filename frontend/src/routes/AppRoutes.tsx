import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { RoleGuard } from './RoleGuard';

// Public pages
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { NotFound } from '../pages/common/NotFound';
import { AccessDenied } from '../pages/common/AccessDenied';

// Student / Faculty pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { BrowseResources } from '../pages/student/BrowseResources';
import { ResourceDetail } from '../pages/student/ResourceDetail';
import { MyBookings } from '../pages/student/MyBookings';
import { NotificationsPage } from '../pages/student/NotificationsPage';
import { ProfilePage } from '../pages/student/ProfilePage';

// Admin pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminResources } from '../pages/admin/AdminResources';
import { AdminBookings } from '../pages/admin/AdminBookings';
import { AdminUsers } from '../pages/admin/AdminUsers';
import { AdminAuditLogs } from '../pages/admin/AdminAuditLogs';
import { AdminPolicies } from '../pages/admin/AdminPolicies';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Authenticated Dashboard Layout */}
      <Route
        element={
          <RoleGuard>
            <DashboardLayout />
          </RoleGuard>
        }
      >
        {/* User Common Routes */}
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/resources" element={<BrowseResources />} />
        <Route path="/resources/:id" element={<ResourceDetail />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Admin Strictly Guarded Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/resources"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminResources />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminBookings />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminUsers />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminAuditLogs />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/policies"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminPolicies />
            </RoleGuard>
          }
        />
      </Route>

      {/* Catch-all Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
