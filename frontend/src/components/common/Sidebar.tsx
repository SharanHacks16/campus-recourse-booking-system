import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Bell,
  User,
  ShieldAlert,
  Users,
  Settings,
  History,
  CheckSquare,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();

  const studentLinks = [
    { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/resources', label: 'Browse Facilities', icon: Building2 },
    { to: '/my-bookings', label: 'My Reservations', icon: CalendarDays },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Profile & Security', icon: User },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Analytics', icon: LayoutDashboard },
    { to: '/admin/resources', label: 'Manage Resources', icon: Building2 },
    { to: '/admin/bookings', label: 'Booking Approvals', icon: CheckSquare },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/audit-logs', label: 'System Audit Logs', icon: History },
    { to: '/admin/policies', label: 'Booking Policies', icon: Settings },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
      isActive
        ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 md:top-[57px] bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } h-screen md:h-[calc(100vh-57px)] overflow-y-auto`}
      >
        <div className="space-y-6">
          {/* Main User Navigation */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              University Portal
            </p>
            <nav className="space-y-1">
              {studentLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={linkClass}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Admin Navigation Section */}
          {isAdmin && (
            <div>
              <div className="flex items-center gap-1.5 px-3 mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Administration
                </p>
              </div>
              <nav className="space-y-1">
                {adminLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={linkClass}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-[11px] font-semibold text-slate-700">Campus Facilities IT</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Automated Concurrency Engine</p>
          </div>
        </div>
      </aside>
    </>
  );
};
