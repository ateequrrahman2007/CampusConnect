import React, { useState, useEffect } from 'react';
import { Search, MapPin, UserCheck, Clock, Share2, PlusCircle, PenTool, Edit3 } from 'lucide-react';
import { StaffAvailability, StaffStatus, UserRole } from '../types.js';
import { RowSkeleton } from './Skeletons.js';

interface StaffTrackerProps {
  token: string | null;
  currentUser: any;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  openAuthModal: () => void;
}

export function StaffTrackerView({ token, currentUser, showToast, openAuthModal }: StaffTrackerProps) {
  const [staff, setStaff] = useState<StaffAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Update Status form state
  const [updatingStaff, setUpdatingStaff] = useState<StaffAvailability | null>(null);
  const [newLoc, setNewLoc] = useState('');
  const [newStatus, setNewStatus] = useState<StaffStatus>(StaffStatus.Available);
  const [newUntil, setNewUntil] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Admin New Staff Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addDesignation, setAddDesignation] = useState('');
  const [addDept, setAddDept] = useState('CSE');
  const [addLoc, setAddLoc] = useState('');
  const [addStatus, setAddStatus] = useState<StaffStatus>(StaffStatus.Available);
  const [addUntil, setAddUntil] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  const fetchStaff = async (searchQuery: string = '') => {
    try {
      setLoading(true);
      const param = searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`/api/staff${param}`);
      const json = await res.json();
      if (json.success) {
        setStaff(json.data);
      }
    } catch {
      showToast('Could not reach staff directory database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff(query);
  }, [query]);

  // Handle Whereabouts Update
  const handleUpdateWhereabouts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      openAuthModal();
      return;
    }

    if (!updatingStaff) return;
    if (!newLoc.trim() || !newUntil.trim()) {
      showToast('Please specify physical office location and duration parameters!', 'warning');
      return;
    }

    setSubmittingUpdate(true);
    try {
      const res = await fetch(`/api/staff/${updatingStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentLocation: newLoc,
          availabilityStatus: newStatus,
          availableUntil: newUntil,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Staff availability profile logged!', 'success');
        setStaff(staff.map((s) => (s.id === updatingStaff.id ? json.data : s)));
        setUpdatingStaff(null);
      } else {
        showToast(json.message || 'Update failed', 'error');
      }
    } catch {
      showToast('Network fault occurred while saving', 'error');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  // Launch whereabouts update modal
  const openUpdateModal = (stf: StaffAvailability) => {
    if (!token) {
      openAuthModal();
      return;
    }
    setUpdatingStaff(stf);
    setNewLoc(stf.currentLocation);
    setNewStatus(stf.availabilityStatus);
    setNewUntil(stf.availableUntil);
  };

  // Admin: Create staff profile record
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      openAuthModal();
      return;
    }

    if (!addName.trim() || !addDesignation.trim()) {
      showToast('Full name and designation credentials are vital', 'warning');
      return;
    }

    setSubmittingAdd(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          staffName: addName,
          designation: addDesignation,
          department: addDept,
          currentLocation: addLoc,
          availabilityStatus: addStatus,
          availableUntil: addUntil,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Staff directory enrollment added!', 'success');
        setStaff([...staff, json.data]);
        setShowAddModal(false);
        // Clean
        setAddName('');
        setAddDesignation('');
        setAddDept('CSE');
        setAddLoc('');
        setAddStatus(StaffStatus.Available);
        setAddUntil('');
      } else {
        showToast(json.message || 'Failed to enroll staff', 'error');
      }
    } catch {
      showToast('Connection issues while contacting database', 'error');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const getStatusStyle = (st: StaffStatus) => {
    switch (st) {
      case StaffStatus.Available:
        return 'bg-teal-50 border-teal-150 text-teal-700';
      case StaffStatus.Busy:
        return 'bg-amber-50 border-amber-100 text-amber-700';
      default:
        return 'bg-rose-50 border-rose-100 text-rose-700';
    }
  };

  // Calculate relative updated time
  const renderRelativeTime = (isoString: string) => {
    try {
      const past = new Date(isoString).getTime();
      const diffMs = Date.now() - past;
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return new Date(isoString).toLocaleDateString();
    } catch {
      return 'Recent';
    }
  };

  const isAdmin = currentUser && currentUser.role === UserRole.Admin;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900 flex items-center gap-1.5">
            <UserCheck className="w-6 h-6 text-teal-700" />
            <span>Staff Tracker</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Crowdsourced, real-time availability sheet of department heads, registrars, and faculty coordinators.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-xs w-fit"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Enroll Staff Profile</span>
          </button>
        )}
      </div>

      {/* Directory Search controls */}
      <div className="flex bg-white border border-slate-150 p-4 rounded-2xl shadow-xs gap-4 max-w-sm">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by instructor name, cabin, dept..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-2.5 pl-9 text-xs outline-hidden focus:border-teal-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Table directories */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Instructor Name</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Current Whereabouts</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Availability Status</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Until / Window</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
              {loading ? (
                <>
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                </>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400 italic">
                    Faculty personnel directory matches empty.
                  </td>
                </tr>
              ) : (
                staff.map((stf) => (
                  <tr key={stf.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900">{stf.staffName}</p>
                        <p className="text-[10px] text-slate-400 font-mono italic">{stf.designation}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                        {stf.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{stf.currentLocation}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(stf.availabilityStatus)}`}>
                        {stf.availabilityStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{stf.availableUntil}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openUpdateModal(stf)}
                        className="inline-flex items-center gap-1 text-xs bg-slate-900 text-white font-semibold hover:bg-slate-800 transition rounded-lg px-3 py-1.5 shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Update Status</span>
                      </button>
                      <p className="text-[9px] text-slate-400 mt-1.5 italic font-medium leading-none">
                        Lat logged: {renderRelativeTime(stf.lastUpdated)}
                        {stf.updatedByName && ` by ${stf.updatedByName}`}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Update Availability Location (For any logged in users) */}
      {updatingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setUpdatingStaff(null)}></div>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 relative z-10 shadow-xl border border-slate-150 animate-slideUp">
            <h3 className="text-xl font-bold font-display text-slate-950 mb-2">Log Faculty Status</h3>
            <p className="text-xs text-slate-500 mb-4">You can update the physical location tags when you meet instructors in corridors.</p>

            <form onSubmit={handleUpdateWhereabouts} className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-xs">
                <p className="font-bold text-slate-800">{updatingStaff.staffName}</p>
                <p className="text-slate-400 font-mono mt-0.5">{updatingStaff.designation}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Availability status</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(StaffStatus).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st as StaffStatus)}
                      className={`py-2 text-xs border rounded-xl font-bold transition ${
                        newStatus === st
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Office Room / Cabin Location</label>
                <input
                  type="text"
                  placeholder="e.g. Main Block cabin #302, or Seminar hall internals room"
                  required
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Window / Duration Available Until</label>
                <input
                  type="text"
                  placeholder="e.g. 5:30 PM, or Tomorrow 10 AM, or Lunch hour recess"
                  required
                  value={newUntil}
                  onChange={(e) => setNewUntil(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setUpdatingStaff(null)}
                  disabled={submittingUpdate}
                  className="px-4 py-2 text-xs font-bold text-slate-550 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpdate}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition"
                >
                  {submittingUpdate ? 'Saving...' : 'Update Records'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin: Create New Staff Directory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 relative z-10 shadow-xl border border-slate-150 animate-slideUp">
            <h3 className="text-xl font-bold font-display text-slate-950 mb-4">Enroll Faculty Personnel</h3>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Arthur Miller, Ph.D"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Designation Role</label>
                  <input
                    type="text"
                    placeholder="e.g. HOD CSE or Associate Professor"
                    required
                    value={addDesignation}
                    onChange={(e) => setAddDesignation(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Department</label>
                  <select
                    value={addDept}
                    onChange={(e) => setAddDept(e.target.value)}
                    className="w-full border border-slate-200 outline-hidden bg-slate-50 p-2.5 rounded-xl text-xs"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                    <option value="EEE">EEE</option>
                    <option value="IT">IT</option>
                    <option value="Administration">Administration</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Starting office / cabin room</label>
                <input
                  type="text"
                  placeholder="e.g. B-Block Faculty Cabin #304"
                  value={addLoc}
                  onChange={(e) => setAddLoc(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Initial Status</label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as StaffStatus)}
                    className="w-full border border-slate-200 outline-hidden bg-slate-50 p-2.5 rounded-xl text-xs"
                  >
                    {Object.values(StaffStatus).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Available window</label>
                  <input
                    type="text"
                    placeholder="e.g. 4:30 PM, or Lunch Recess"
                    value={addUntil}
                    onChange={(e) => setAddUntil(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submittingAdd}
                  className="px-4 py-1.5 text-xs font-bold text-slate-550 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition"
                >
                  {submittingAdd ? 'Enrolling...' : 'Enroll Instructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
