import React, { useEffect, useState } from 'react';
import { resourceApi } from '../../api/client';
import { Resource, ResourceType } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Power,
  PowerOff,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminResources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState<ResourceType>('CLASSROOM');
  const [building, setBuilding] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState<number>(40);
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [amenities, setAmenities] = useState('');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await resourceApi.getResources({
        search: search.trim() || undefined,
        activeOnly: false, // Admin sees inactive too
        page,
        size: 10,
      });
      setResources(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (e) {
      console.error('Failed to load resources:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [page]);

  const handleOpenCreateModal = () => {
    setEditingResource(null);
    setName('');
    setType('CLASSROOM');
    setBuilding('');
    setRoomNumber('');
    setCapacity(40);
    setDescription('');
    setDepartment('');
    setAmenities('');
    setOpenTime('08:00');
    setCloseTime('21:00');
    setImageUrl('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: Resource) => {
    setEditingResource(r);
    setName(r.name);
    setType(r.type);
    setBuilding(r.building);
    setRoomNumber(r.roomNumber);
    setCapacity(r.capacity);
    setDescription(r.description || '');
    setDepartment(r.department || '');
    setAmenities(r.amenities || '');
    setOpenTime(r.operatingOpenTime);
    setCloseTime(r.operatingCloseTime);
    setImageUrl(r.imageUrl || '');
    setIsActive(r.isActive);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (r: Resource) => {
    try {
      await resourceApi.toggleStatus(r.id, !r.isActive);
      toast.success(`${r.name} status updated to ${!r.isActive ? 'ACTIVE' : 'INACTIVE'}`);
      fetchResources();
    } catch (err: any) {
      toast.error('Failed to update facility status.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: name.trim(),
      type,
      building: building.trim(),
      roomNumber: roomNumber.trim(),
      capacity,
      description: description.trim(),
      department: department.trim(),
      amenities: amenities.trim(),
      operatingOpenTime: openTime,
      operatingCloseTime: closeTime,
      imageUrl: imageUrl.trim() || undefined,
      isActive,
    };

    try {
      if (editingResource) {
        await resourceApi.updateResource(editingResource.id, payload);
        toast.success(`Facility "${name}" updated successfully.`);
      } else {
        await resourceApi.createResource(payload);
        toast.success(`Facility "${name}" created successfully.`);
      }
      setIsModalOpen(false);
      fetchResources();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save facility.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Campus Facilities Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create, configure operating hours, and manage university resource capacity.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> Add New Facility
        </button>
      </div>

      {/* Search Bar */}
      <Card className="p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            fetchResources();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, building, room number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition"
          >
            Filter
          </button>
        </form>
      </Card>

      {/* Resources Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Facility Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Capacity</th>
                  <th className="py-3 px-3">Operating Hours</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {r.department || 'General Campus'}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge type={r.type} />
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      <div>{r.building}</div>
                      <div className="text-[11px] text-slate-400">Room {r.roomNumber}</div>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {r.capacity} seats
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-medium">
                      {r.operatingOpenTime} &mdash; {r.operatingCloseTime}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {r.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(r)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-slate-100 transition"
                          title="Edit Facility"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(r)}
                          className={`p-1.5 rounded-lg transition ${
                            r.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={r.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {r.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      </div>
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

      {/* Add / Edit Resource Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingResource ? `Edit Facility: ${editingResource.name}` : 'Add New Campus Facility'}
          description="Classrooms, computer laboratories, and auditoriums."
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Lecture Hall C"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ResourceType)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="CLASSROOM">Classroom</option>
                  <option value="LABORATORY">Computer & Academic Lab</option>
                  <option value="AUDITORIUM">Auditorium</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Building</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Block 2"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 204B"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Open Time</label>
                <input
                  type="time"
                  required
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Close Time</label>
                <input
                  type="time"
                  required
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                placeholder="e.g. School of Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amenities (Comma separated)
              </label>
              <input
                type="text"
                placeholder="Projector, Smart Whiteboard, Audio System, Air Conditioning..."
                value={amenities}
                onChange={(e) => setAmenities(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Facility details, specialized equipment, seating configuration..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-xs transition"
              >
                {saving ? 'Saving...' : editingResource ? 'Save Changes' : 'Create Facility'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
