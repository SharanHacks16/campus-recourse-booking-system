import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resourceApi } from '../../api/client';
import { Booking, Resource } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CreateBookingModal } from './CreateBookingModal';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const ResourceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    const fetchResource = async () => {
      if (!id) return;
      try {
        const res = await resourceApi.getResourceById(Number(id));
        setResource(res.data);
      } catch (e) {
        console.error('Failed to load resource details:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [id]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!id || !selectedDate) return;
      setLoadingBookings(true);
      try {
        const res = await resourceApi.getAvailability(Number(id), selectedDate);
        setDayBookings(res.data);
      } catch (e) {
        console.error('Failed to load day bookings:', e);
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchAvailability();
  }, [id, selectedDate]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!resource) {
    return (
      <Card className="p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Resource Not Found</h2>
        <Link to="/resources" className="text-xs text-brand-600 font-semibold hover:underline">
          &larr; Back to Facilities
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/resources"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Facilities Catalog
        </Link>
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-3">
        {/* Resource Image */}
        <div className="h-64 lg:h-full bg-slate-100 relative">
          <img
            src={
              resource.imageUrl ||
              'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80'
            }
            alt={resource.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <Badge type={resource.type} />
          </div>
        </div>

        {/* Info & Specs */}
        <div className="p-6 lg:p-8 lg:col-span-2 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {resource.name}
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {resource.building} &bull; Room {resource.roomNumber}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-slate-900">{resource.capacity}</span>
                <span className="text-xs text-slate-400 block font-medium">Seats Capacity</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {resource.description || 'Modern academic facility maintained by campus facilities.'}
            </p>

            {/* Spec Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Department</span>
                <span className="text-xs font-semibold text-slate-800 truncate block mt-0.5">
                  {resource.department || 'General Campus'}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Operating Hours</span>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  {resource.operatingOpenTime} - {resource.operatingCloseTime}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Status</span>
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Available for Booking
                </span>
              </div>
            </div>

            {/* Amenities */}
            {resource.amenities && (
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Included Amenities & Infrastructure
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {resource.amenities.split(',').map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-brand-50 border border-brand-100 text-brand-700 text-xs rounded-lg font-medium flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-brand-500" />
                      {amenity.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Need this room? Pick your date below or click reserve.
            </span>
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Reserve This Facility
            </button>
          </div>
        </div>
      </div>

      {/* Availability Schedule Calendar Section */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Live Availability Schedule</h2>
            <p className="text-xs text-slate-500">
              Check scheduled reservations for this facility to avoid booking conflicts
            </p>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Schedule Slots Visualizer */}
        {loadingBookings ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : dayBookings.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-emerald-900">
              Completely Free All Day on {selectedDate}!
            </p>
            <p className="text-[11px] text-emerald-700">
              No overlapping reservations exist between {resource.operatingOpenTime} and {resource.operatingCloseTime}.
            </p>
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
            >
              Reserve Slot on {selectedDate}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-700">
              Existing Reservations on {selectedDate} ({dayBookings.length}):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {dayBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-brand-600" /> {b.startTime} &mdash; {b.endTime}
                    </span>
                    <Badge status={b.status} />
                  </div>
                  <p className="text-xs text-slate-700 font-medium truncate">{b.title}</p>
                  <p className="text-[11px] text-slate-400">
                    Reserved for {b.attendeesCount} attendees
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <CreateBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          resource={resource}
          initialDate={selectedDate}
          onBookingCreated={() => {
            // Re-fetch availability
            resourceApi.getAvailability(resource.id, selectedDate).then((res) => {
              setDayBookings(res.data);
            });
          }}
        />
      )}
    </div>
  );
};
