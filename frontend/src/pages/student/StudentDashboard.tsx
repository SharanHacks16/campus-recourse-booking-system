import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi, bookingApi } from '../../api/client';
import { Booking, DashboardMetrics } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  MapPin,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [metricsRes, myBookingsRes] = await Promise.all([
          adminApi.getUserMetrics(),
          bookingApi.getMyBookings(0, 5),
        ]);
        setMetrics(metricsRes.data);
        setRecentBookings(myBookingsRes.data.content);
      } catch (e) {
        console.error('Failed to load user metrics:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-medium backdrop-blur-xs">
            Academic Term 2026
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Reserve smart classrooms, high-performance computing labs, and university auditoriums.
            All bookings undergo automated conflict validation.
          </p>
          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              to="/resources"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Reserve Facility Now
            </Link>
            <Link
              to="/my-bookings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition"
            >
              View My Bookings <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Bookings"
          value={metrics?.totalBookings ?? 0}
          subtitle="All-time reservations"
          icon={CalendarDays}
          color="brand"
        />
        <StatCard
          title="Pending Requests"
          value={metrics?.pendingBookings ?? 0}
          subtitle="Awaiting admin approval"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved Bookings"
          value={metrics?.approvedBookings ?? 0}
          subtitle="Active reservations"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Cancelled / Rejected"
          value={(metrics?.cancelledBookings ?? 0) + (metrics?.rejectedBookings ?? 0)}
          subtitle="Past cancellations"
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Recent Reservations Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Booking Activity</h2>
            <p className="text-xs text-slate-500">Your latest reservation requests and status updates</p>
          </div>
          <Link
            to="/my-bookings"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CalendarDays className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-slate-700">No booking requests submitted yet</p>
            <p className="text-[11px] text-slate-400">Browse campus facilities and submit your first booking.</p>
            <Link
              to="/resources"
              className="inline-block mt-2 text-xs font-semibold text-brand-600 hover:underline"
            >
              Browse Facilities &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Event Purpose</th>
                  <th className="py-2.5 px-3">Attendees</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{b.resourceName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {b.building} &bull; {b.roomNumber}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{b.bookingDate}</div>
                      <div className="text-[11px] text-slate-500">{b.startTime} - {b.endTime}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 truncate max-w-[200px]">{b.title}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{b.purpose}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {b.attendeesCount}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge status={b.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/my-bookings?id=${b.id}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
