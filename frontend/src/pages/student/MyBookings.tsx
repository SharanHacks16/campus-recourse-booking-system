import React, { useEffect, useState } from 'react';
import { bookingApi } from '../../api/client';
import { Booking, BookingStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  XCircle,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Cancel Modal State
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Details Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingApi.getMyBookings(page, 10);
      setBookings(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (e) {
      console.error('Failed to load my bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page]);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingBooking) return;
    setCancelLoading(true);

    try {
      await bookingApi.cancelBooking(cancellingBooking.id, cancelReason);
      toast.success('Reservation successfully cancelled.');
      setCancellingBooking(null);
      setCancelReason('');
      fetchBookings();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to cancel reservation.';
      toast.error(msg);
    } finally {
      setCancelLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          My Facility Reservations
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track the status of your submitted bookings, approvals, and upcoming events.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusFilter === st
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st === 'ALL' ? 'All Bookings' : st}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">No reservations found</h3>
          <p className="text-xs text-slate-500">
            {statusFilter !== 'ALL'
              ? `You do not have any bookings with status "${statusFilter}".`
              : 'You have not submitted any room reservations yet.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => (
            <Card key={b.id} className="p-5 hover:border-slate-300 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{b.title}</h3>
                    <Badge status={b.status} />
                    <Badge type={b.resourceType} />
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    {b.resourceName} &bull; {b.building} (Room {b.roomNumber})
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <CalendarDays className="w-3.5 h-3.5 text-brand-600" /> {b.bookingDate}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-brand-600" /> {b.startTime} &mdash; {b.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {b.attendeesCount} Attendees
                    </span>
                  </div>

                  {/* Rejection / Cancellation Notes */}
                  {b.rejectionReason && (
                    <div className="mt-2 p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-800 flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span>Rejection Reason: {b.rejectionReason}</span>
                    </div>
                  )}

                  {b.cancellationReason && (
                    <div className="mt-2 p-2.5 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-start gap-1.5">
                      <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>Cancellation Note: {b.cancellationReason}</span>
                    </div>
                  )}
                </div>

                {/* Right Actions */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                  <button
                    onClick={() => setSelectedBooking(b)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    View Details
                  </button>

                  {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                    <button
                      onClick={() => setCancellingBooking(b)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-slate-500">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingBooking && (
        <Modal
          isOpen={!!cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          title="Cancel Facility Reservation"
          description={`Cancelling: ${cancellingBooking.title} on ${cancellingBooking.bookingDate}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCancelSubmit} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
              Are you sure you want to cancel this booking? This will immediately free the time slot
              for other university users.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Class rescheduled, workshop postponed..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                disabled={cancelLoading}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
              >
                Keep Booking
              </button>
              <button
                type="submit"
                disabled={cancelLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Details Modal */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title="Reservation Information"
          description={`Booking Reference #${selectedBooking.id}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Current Status:</span>
              <Badge status={selectedBooking.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block font-medium">Facility</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedBooking.resourceName}
                </span>
                <span className="text-slate-500">
                  {selectedBooking.building} &bull; Room {selectedBooking.roomNumber}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Reserved Time</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedBooking.bookingDate}
                </span>
                <span className="text-slate-500">
                  {selectedBooking.startTime} &mdash; {selectedBooking.endTime}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Event Title</span>
              <span className="font-semibold text-slate-900 block mt-0.5">{selectedBooking.title}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Purpose</span>
              <p className="text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {selectedBooking.purpose}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <span className="text-slate-400 block font-medium">Expected Attendees</span>
                <span className="font-semibold text-slate-800">{selectedBooking.attendeesCount} People</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Submitted On</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedBooking.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
