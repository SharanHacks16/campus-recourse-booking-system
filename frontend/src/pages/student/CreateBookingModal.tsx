import React, { useState } from 'react';
import { Resource } from '../../types';
import { bookingApi } from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { Calendar, Clock, Users, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
  onBookingCreated?: () => void;
  initialDate?: string;
}

export const CreateBookingModal: React.FC<CreateBookingModalProps> = ({
  isOpen,
  onClose,
  resource,
  onBookingCreated,
  initialDate,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [bookingDate, setBookingDate] = useState<string>(initialDate || todayStr);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [title, setTitle] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [attendeesCount, setAttendeesCount] = useState<number>(Math.min(20, resource.capacity));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Time Order Validation
    if (startTime >= endTime) {
      setError('Start time must precede end time.');
      return;
    }

    // 2. Capacity Validation
    if (attendeesCount <= 0) {
      setError('Attendees count must be greater than zero.');
      return;
    }
    if (attendeesCount > resource.capacity) {
      setError(`Attendees count (${attendeesCount}) exceeds maximum capacity of ${resource.capacity}.`);
      return;
    }

    // 3. Operating hours validation
    if (startTime < resource.operatingOpenTime || endTime > resource.operatingCloseTime) {
      setError(
        `Requested slot is outside facility operating hours (${resource.operatingOpenTime} - ${resource.operatingCloseTime}).`
      );
      return;
    }

    setLoading(true);

    try {
      await bookingApi.createBooking({
        resourceId: resource.id,
        bookingDate,
        startTime,
        endTime,
        title: title.trim(),
        purpose: purpose.trim(),
        attendeesCount,
      });

      toast.success('Booking request submitted successfully!');
      if (onBookingCreated) onBookingCreated();
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Unable to submit booking request. Please check conflicting slots.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reserve: ${resource.name}`}
      description={`${resource.building} • Room ${resource.roomNumber} (Max ${resource.capacity} seats)`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Operating Hours Note */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-600 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-600" /> Facility Hours:
          </span>
          <span className="font-bold text-slate-800">
            {resource.operatingOpenTime} &mdash; {resource.operatingCloseTime}
          </span>
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Booking Date
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="date"
              required
              min={todayStr}
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>
        </div>

        {/* Time Interval Selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Start Time
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              End Time
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>
        </div>

        {/* Event Title & Attendees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Event / Course Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CS302 Machine Learning Seminar"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Attendees
            </label>
            <input
              type="number"
              required
              min={1}
              max={resource.capacity}
              value={attendeesCount}
              onChange={(e) => setAttendeesCount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Purpose & Additional Requirements
          </label>
          <textarea
            required
            rows={3}
            placeholder="Describe the nature of the academic session, seminar, or workshop..."
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition leading-relaxed resize-none"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-5 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-sm transition flex items-center gap-1.5 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" /> Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
