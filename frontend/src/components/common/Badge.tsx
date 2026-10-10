import React from 'react';
import { BookingStatus, ResourceType, Role } from '../../types';

interface BadgeProps {
  status?: BookingStatus;
  type?: ResourceType;
  role?: Role;
  text?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, type, role, text, className = '' }) => {
  if (status) {
    const statusConfig: Record<BookingStatus, { label: string; bg: string; text: string; dot: string }> = {
      PENDING: { label: 'Pending Review', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
      APPROVED: { label: 'Approved', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
      REJECTED: { label: 'Rejected', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', dot: 'bg-rose-500' },
      CANCELLED: { label: 'Cancelled', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
    };
    const c = statusConfig[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  }

  if (type) {
    const typeConfig: Record<ResourceType, { label: string; bg: string }> = {
      CLASSROOM: { label: 'Classroom', bg: 'bg-blue-50 border-blue-200 text-blue-700' },
      LABORATORY: { label: 'Laboratory', bg: 'bg-purple-50 border-purple-200 text-purple-700' },
      AUDITORIUM: { label: 'Auditorium', bg: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    };
    const c = typeConfig[type];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${c.bg} ${className}`}>
        {c.label}
      </span>
    );
  }

  if (role) {
    const roleColors: Record<Role, string> = {
      ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
      FACULTY: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      STUDENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${roleColors[role]} ${className}`}>
        {role}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 ${className}`}>
      {text}
    </span>
  );
};
