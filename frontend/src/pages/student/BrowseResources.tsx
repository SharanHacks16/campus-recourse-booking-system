import React, { useEffect, useState } from 'react';
import { resourceApi } from '../../api/client';
import { Resource, ResourceType } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CreateBookingModal } from './CreateBookingModal';
import {
  Search,
  Filter,
  Users,
  Clock,
  MapPin,
  Calendar,
  Building2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const BrowseResources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [building, setBuilding] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Booking Modal State
  const [bookingModalResource, setBookingModalResource] = useState<Resource | null>(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const typeParam = selectedType !== 'ALL' ? (selectedType as ResourceType) : undefined;
      const res = await resourceApi.getResources({
        search: search.trim() || undefined,
        type: typeParam,
        minCapacity: minCapacity > 0 ? minCapacity : undefined,
        building: building.trim() || undefined,
        activeOnly: true,
        page,
        size: 9,
      });
      setResources(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (e) {
      console.error('Failed to fetch resources:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedType, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchResources();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Campus Facilities Catalog
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore and book university classrooms, computing labs, and auditoriums.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by facility name, room number, building, or amenities..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition flex items-center justify-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" /> Search
          </button>
        </form>

        {/* Category Pills & Secondary Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'All Categories' },
              { id: 'CLASSROOM', label: 'Classrooms' },
              { id: 'LABORATORY', label: 'Computer & AI Labs' },
              { id: 'AUDITORIUM', label: 'Auditoriums' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedType(cat.id);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedType === cat.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Min Capacity:</span>
              <select
                value={minCapacity}
                onChange={(e) => {
                  setMinCapacity(Number(e.target.value));
                  setPage(0);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none"
              >
                <option value={0}>Any</option>
                <option value={30}>30+ seats</option>
                <option value={45}>45+ seats</option>
                <option value={60}>60+ seats</option>
                <option value={200}>200+ seats</option>
              </select>
            </div>
            <span className="text-slate-400 font-medium">
              Showing {totalElements} facilities
            </span>
          </div>
        </div>
      </Card>

      {/* Facilities Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : resources.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">No facilities match your search criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your category filters or lowering minimum capacity requirements.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedType('ALL');
              setMinCapacity(0);
              setPage(0);
            }}
            className="px-4 py-1.5 text-xs font-semibold text-brand-600 hover:underline"
          >
            Clear all filters
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <Card key={res.id} className="flex flex-col justify-between group">
              <div>
                {/* Image */}
                <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                  <img
                    src={
                      res.imageUrl ||
                      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={res.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge type={res.type} />
                  </div>
                  <div className="absolute top-3 right-3 bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Users className="w-3 h-3" /> {res.capacity} Seats
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-600 transition">
                      {res.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {res.building} &bull; Room {res.roomNumber}
                    </p>
                  </div>

                  {res.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {res.description}
                    </p>
                  )}

                  {/* Amenities Tags */}
                  {res.amenities && (
                    <div className="flex flex-wrap gap-1">
                      {res.amenities
                        .split(',')
                        .slice(0, 3)
                        .map((a, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                          >
                            {a.trim()}
                          </span>
                        ))}
                      {res.amenities.split(',').length > 3 && (
                        <span className="text-[10px] text-slate-400 px-1 py-0.5">
                          +{res.amenities.split(',').length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Hours */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Hours:
                    </span>
                    <span className="font-semibold text-slate-700">
                      {res.operatingOpenTime} - {res.operatingCloseTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                <Link
                  to={`/resources/${res.id}`}
                  className="py-2 px-3 text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Details
                </Link>
                <button
                  type="button"
                  onClick={() => setBookingModalResource(res)}
                  className="py-2 px-3 text-center text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" /> Book Now
                </button>
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

      {/* Booking Modal */}
      {bookingModalResource && (
        <CreateBookingModal
          isOpen={!!bookingModalResource}
          onClose={() => setBookingModalResource(null)}
          resource={bookingModalResource}
          onBookingCreated={() => {
            setBookingModalResource(null);
          }}
        />
      )}
    </div>
  );
};
