import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { DashboardMetrics } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  Building2,
  Users,
  Clock,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
  PieChart as PieIcon,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await adminApi.getDashboard();
        setMetrics(res.data);
      } catch (e) {
        console.error('Failed to load admin metrics:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  // Category Distribution Data for Pie Chart
  const categoryData = metrics?.categoryDistribution
    ? Object.entries(metrics.categoryDistribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [
        { name: 'CLASSROOM', value: 3 },
        { name: 'LABORATORY', value: 3 },
        { name: 'AUDITORIUM', value: 2 },
      ];

  const categoryColors = ['#3b82f6', '#8b5cf6', '#6366f1'];

  // Status Breakdown Data for Bar Chart
  const statusData = [
    { name: 'Approved', count: metrics?.approvedBookings ?? 0, fill: '#10b981' },
    { name: 'Pending', count: metrics?.pendingBookings ?? 0, fill: '#f59e0b' },
    { name: 'Rejected', count: metrics?.rejectedBookings ?? 0, fill: '#f43f5e' },
    { name: 'Cancelled', count: metrics?.cancelledBookings ?? 0, fill: '#94a3b8' },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200 mb-2">
            Campus IT Administrative Console
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Campus Resource Operations & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time facility utilization, booking queue approvals, and capacity metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/resources"
            className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-brand-600" /> Facilities
          </Link>
          <Link
            to="/admin/bookings"
            className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            Review Requests ({metrics?.pendingBookings ?? 0})
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Active Facilities"
          value={metrics?.totalActiveResources ?? 0}
          subtitle="Classrooms, labs, halls"
          icon={Building2}
          color="brand"
        />
        <StatCard
          title="Registered Users"
          value={metrics?.totalUsers ?? 0}
          subtitle="Students & faculty"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Pending Requests"
          value={metrics?.pendingBookings ?? 0}
          subtitle="Needs administrator action"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved Bookings"
          value={metrics?.approvedBookings ?? 0}
          subtitle="Confirmed reservations"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Today's Reservations"
          value={metrics?.todayBookingsCount ?? 0}
          subtitle="Active on campus today"
          icon={CalendarDays}
          color="brand"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Pie Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-brand-600" /> Resource Category Distribution
              </h2>
              <p className="text-xs text-slate-500">Inventory breakdown across campus facilities</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Breakdown Bar Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand-600" /> Booking Status Breakdown
              </h2>
              <p className="text-xs text-slate-500">All-time reservation volume by status</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Most Frequently Booked Facilities Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Most Frequently Booked Facilities</h2>
            <p className="text-xs text-slate-500">High-demand rooms based on approved reservations</p>
          </div>
          <Link
            to="/admin/resources"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Manage facilities <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {metrics?.mostBookedResources && metrics.mostBookedResources.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Facility Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Total Confirmed Bookings</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.mostBookedResources.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 px-3">
                      <Badge type={item.type as any} />
                    </td>
                    <td className="py-3 px-3 font-bold text-brand-700">{item.bookingCount} Reservations</td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/resources/${item.resourceId}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        View Calendar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center">
            No booking trend history accumulated yet.
          </p>
        )}
      </Card>
    </div>
  );
};
