import React, { useEffect, useState } from 'react';
import { bookingApi } from '../../api/client';
import { Booking, BookingStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Search,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Reject Modal State
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Admin Cancel Modal State
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingApi.searchAllBookings({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() || undefined,
        page,
        size: 10,
      });
      setBookings(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (e) {
      console.error('Failed to load bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, page]);

  const handleApprove = async (booking: Booking) => {
    setActionLoading(true);
    try {
      await bookingApi.approveBooking(booking.id);
      toast.success(`Booking #${booking.id} (${booking.title}) APPROVED.`);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve booking. Check for conflicts.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBooking) return;
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is mandatory.');
      return;
    }
    setActionLoading(true);
    try {
      await bookingApi.rejectBooking(rejectingBooking.id, rejectionReason.trim());
      toast.success(`Booking #${rejectingBooking.id} has been REJECTED.`);
      setRejectingBooking(null);
      setRejectionReason('');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingBooking) return;
    setActionLoading(true);
    try {
      await bookingApi.cancelBooking(
        cancellingBooking.id,
        cancelReason.trim() || 'Cancelled by Administrator'
      );
      toast.success(`Booking #${cancellingBooking.id} CANCELLED by Admin.`);
      setCancellingBooking(null);
      setCancelReason('');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Campus Booking Management & Approvals
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Review pending facility requests, enforce scheduling policies, and maintain institutional records.
        </p>
      </div>

      {/* Filters Card */}
      <Card className="p-4 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            fetchBookings();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by event title, requester name, facility, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition flex items-center justify-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(0);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Bookings' : st}
            </button>
          ))}
        </div>
      </Card>

      {/* Bookings Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No booking requests found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Event & Requester</th>
                  <th className="py-3 px-3">Facility</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Attendees</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{b.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {b.userFullName} ({b.userRole}) &bull; {b.userDepartment}
                      </div>
                      <div className="text-[10px] text-slate-400">{b.userEmail}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800">{b.resourceName}</div>
                      <div className="text-[11px] text-slate-400">
                        {b.building} (Room {b.roomNumber})
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      <div className="font-semibold">{b.bookingDate}</div>
                      <div className="text-[11px] text-slate-500">
                        {b.startTime} &mdash; {b.endTime}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {b.attendeesCount} People
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {b.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(b)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectingBooking(b);
                              setRejectionReason('');
                            }}
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : b.status === 'APPROVED' ? (
                        <button
                          onClick={() => {
                            setCancellingBooking(b);
                            setCancelReason('');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                        >
                          Revoke / Cancel
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Reject Modal */}
      {rejectingBooking && (
        <Modal
          isOpen={!!rejectingBooking}
          onClose={() => setRejectingBooking(null)}
          title="Reject Booking Request"
          description={`Request #${rejectingBooking.id}: ${rejectingBooking.title}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>
                Rejection requires a documented reason that will be sent to the requester in their in-app notification.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rejection Reason *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Facility is undergoing scheduled maintenance, requested capacity exceeds room limit..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin Cancel Modal */}
      {cancellingBooking && (
        <Modal
          isOpen={!!cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          title="Revoke / Cancel Approved Booking"
          description={`Reservation #${cancellingBooking.id}: ${cancellingBooking.title}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCancelSubmit} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
              Cancelling this reservation will free up the time slot and notify the user with your cancellation note.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Administrative Cancellation Reason
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Priority institutional exam scheduling, emergency facility repair..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
              >
                Dismiss
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition"
              >
                {actionLoading ? 'Revoking...' : 'Revoke Booking'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
