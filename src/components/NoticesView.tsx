import React, { useState, useEffect } from 'react';
import { Calendar, PlusCircle, Trash, Megaphone, Clock, Award, AlertTriangle, FileText } from 'lucide-react';
import { Notice, NoticeType, UserRole } from '../types.js';
import { TimelineSkeleton } from './Skeletons.js';

interface NoticesProps {
  token: string | null;
  currentUser: any;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  openAuthModal: () => void;
}

export function NoticesView({ token, currentUser, showToast, openAuthModal }: NoticesProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  // Trigger forms state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NoticeType>(NoticeType.General);
  const [expiryDays, setExpiryDays] = useState('7');
  const [submitting, setSubmitting] = useState(false);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const queryParam = selectedType !== 'all' ? `?type=${encodeURIComponent(selectedType)}` : '';
      const res = await fetch(`/api/notices${queryParam}`);
      const json = await res.json();
      if (json.success) {
        setNotices(json.data);
      }
    } catch {
      showToast('Could not fetch academic notices board', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [selectedType]);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      openAuthModal();
      return;
    }

    if (!title.trim() || !content.trim()) {
      showToast('Please type a caption title and full circular announcement body', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          type,
          expiryDays: parseInt(expiryDays) || 7,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Official Circular posted on notice board!', 'success');
        setNotices([json.data, ...notices]);
        setShowAddModal(false);
        // Clear
        setTitle('');
        setContent('');
        setType(NoticeType.General);
        setExpiryDays('7');
      } else {
        showToast(json.message || 'Bulletin posting failed', 'error');
      }
    } catch {
      showToast('Connection to campus database lost', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;

    if (!window.confirm('Delete this announcement permanently?')) {
      return;
    }

    try {
      const res = await fetch(`/api/notices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (json.success) {
        showToast('Notice bulletin removed', 'success');
        setNotices(notices.filter((n) => n.id !== id));
      }
    } catch {
      showToast('Error removing announcement', 'error');
    }
  };

  const getBadgeStyles = (ntType: NoticeType) => {
    switch (ntType) {
      case NoticeType.Event:
        return {
          bg: 'bg-indigo-50 border-indigo-150 text-indigo-700',
          icon: <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />,
        };
      case NoticeType.Workshop:
        return {
          bg: 'bg-teal-50 border-teal-150 text-teal-700',
          icon: <Award className="w-3.5 h-3.5 text-teal-500 shrink-0" />,
        };
      case NoticeType.LostFound:
        return {
          bg: 'bg-amber-50 border-amber-150 text-amber-700',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-150 text-slate-700',
          icon: <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
        };
    }
  };

  const userCanWriteNotice = currentUser && (currentUser.role === UserRole.Admin || currentUser.role === UserRole.ClubLead);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900 flex items-center gap-1.5">
            <Megaphone className="w-6 h-6 text-indigo-600" />
            <span>Campus Notice Board</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Linear bulletins on official events, club workshops, academic internals alerts, or lost possessions.
          </p>
        </div>
        
        {userCanWriteNotice && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-xs w-fit"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Notice Entry</span>
          </button>
        )}
      </div>

      {/* Tabs Filters */}
      <div className="flex bg-slate-100 p-1 rounded-xl self-start w-fit">
        {['all', NoticeType.General, NoticeType.Event, NoticeType.Workshop, NoticeType.LostFound].map((typeTab) => (
          <button
            key={typeTab}
            onClick={() => setSelectedType(typeTab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
              selectedType === typeTab
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {typeTab === 'all' ? 'All Bulletins' : typeTab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="max-w-2xl mx-auto py-4 space-y-6">
          <TimelineSkeleton />
          <TimelineSkeleton />
          <TimelineSkeleton />
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center max-w-sm mx-auto shadow-xs">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Timeline Noticeboard is dry</h3>
          <p className="text-sm text-slate-500 mt-1">Check back later or change filter preferences tag.</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto py-4">
          <div className="relative border-l-2 border-slate-200 pl-6 ml-4 space-y-8 animate-fadeIn">
            {notices.map((not) => {
              const style = getBadgeStyles(not.type);
              return (
                <div key={not.id} className="relative group">
                  {/* Timeline circular dot indicator */}
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 bg-slate-300 rounded-full border-2 border-white group-hover:bg-indigo-600 group-hover:scale-110 transition shrink-0"></div>

                  <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
                    <div className="flex justify-between items-start gap-4">
                      {/* Classification Badge Tag */}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${style.bg}`}>
                        {style.icon}
                        <span>{not.type}</span>
                      </span>

                      {currentUser && currentUser.role === UserRole.Admin && (
                        <button
                          onClick={(e) => handleDeleteNotice(not.id, e)}
                          title="Erase announcement"
                          className="text-slate-400 hover:text-red-500 transition"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mt-3 font-display">
                      {not.title}
                    </h3>
                    <p className="text-sm text-slate-650 mt-2 whitespace-pre-line leading-relaxed">
                      {not.content}
                    </p>

                    <div className="mt-5 pt-3 border-t border-slate-105 flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Posted {new Date(not.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-500">Expiring in {Math.round((new Date(not.expiryDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))}d</span>
                      </div>

                      <div className="text-right text-slate-500 font-medium font-mono">
                        By {not.authorName} ({not.authorRole.replace('_', ' ')})
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Post Circular Notice */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 relative z-10 shadow-xl border border-slate-150 animate-slideUp">
            <h3 className="text-xl font-bold font-display text-slate-950 mb-4">Post Academic Announcement</h3>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Circular Category Tag</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as NoticeType)}
                  className="w-full border border-slate-200 outline-hidden bg-slate-50 p-2.5 rounded-xl text-xs"
                >
                  {Object.values(NoticeType).map((nt) => (
                    <option key={nt} value={nt}>
                      {nt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Notice Headline Title</label>
                <input
                  type="text"
                  placeholder="e.g. SRM IST Hack Summit 2026 Registration Guidelines"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Notice Lifespan / Days to Expiry</label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="w-full border border-slate-200 outline-hidden bg-slate-50 p-2.5 rounded-xl text-xs"
                >
                  <option value="2">2 Days (Brief Notice / Lost items)</option>
                  <option value="5">5 Days</option>
                  <option value="7">7 Days (Weekly circular)</option>
                  <option value="14">14 Days (General internal alerts)</option>
                  <option value="30">30 Days (Major semester directive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Circular Content Specification</label>
                <textarea
                  placeholder="Insert the official details, registration rules, time, coordinator cells, or physical whereabouts instructions..."
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-slate-550 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition"
                >
                  {submitting ? 'Publishing...' : 'Pin Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
