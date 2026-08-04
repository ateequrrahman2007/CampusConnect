import React, { useState, useEffect } from 'react';
import { Search, Compass, BookOpen, Clock, Star, Mail, PlusCircle, Trash2, HelpCircle } from 'lucide-react';
import { ServicePost } from '../types.js';
import { CardSkeleton } from './Skeletons.js';

interface SkillHubProps {
  token: string | null;
  currentUser: any;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  openAuthModal: () => void;
}

export function SkillHubView({ token, currentUser, showToast, openAuthModal }: SkillHubProps) {
  const [posts, setPosts] = useState<ServicePost[]>([]);
  const [loading, setLoading] = useState(true);

  // Search keyword filters
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  // Contact Details state
  const [revealContactId, setRevealContactId] = useState<string | null>(null);

  // Add Service Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [skillCategory, setSkillCategory] = useState('');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Suggested skills to search/filter
  const popularTags = ['React', 'Arduino', 'Python', 'Web3', 'Soldering', 'Circuit Design', 'Figma', 'Copywriting'];

  const fetchServices = async (skillQuery: string = '') => {
    try {
      setLoading(true);
      const queryParam = skillQuery ? `?skill=${encodeURIComponent(skillQuery)}` : '';
      const res = await fetch(`/api/services${queryParam}`);
      const json = await res.json();
      if (json.success) {
        setPosts(json.data);
      }
    } catch {
      showToast('Failed to load Skill Exchange posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(selectedTag);
  }, [selectedTag]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServices(skillSearch);
  };

  // Publish offer
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      openAuthModal();
      return;
    }

    if (!skillCategory.trim() || !description.trim()) {
      showToast('Please type a service heading and clear description details!', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          skillCategory,
          description,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
          startingPrice: startingPrice ? parseFloat(startingPrice) : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Your Skill Hub card catalog is published!', 'success');
        setPosts([json.data, ...posts]);
        setShowAddModal(false);
        // Clear
        setSkillCategory('');
        setDescription('');
        setHourlyRate('');
        setStartingPrice('');
      } else {
        showToast(json.message || 'Error occurred', 'error');
      }
    } catch {
      showToast('Network fault while calling API', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Offer Card
  const handleDeleteService = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;

    if (!window.confirm('Delete this service listing card from your portfolio?')) {
      return;
    }

    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (json.success) {
        showToast('Skill post removed', 'success');
        setPosts(posts.filter((p) => p.id !== id));
      }
    } catch {
      showToast('Connection error', 'error');
    }
  };

  // Generate star visuals
  const renderStars = (avg: number) => {
    const stars = [];
    const absolute = Math.round(avg);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= absolute ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
          }`}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900 flex items-center gap-1.5">
            <Compass className="w-6 h-6 text-teal-750" />
            <span>Peer Skill Hub</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Swap specialized skills, discover student designers, programmer tutors, or micro-project builders.
          </p>
        </div>
        <button
          onClick={() => (token ? setShowAddModal(true) : openAuthModal())}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-xs w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish Skill Offer</span>
        </button>
      </div>

      {/* Keywords and Filtering options */}
      <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Quick tags list */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mr-1.5">Popular Skills:</span>
            <button
              onClick={() => setSelectedTag('')}
              className={`px-3 py-1 text-xs rounded-full border transition font-medium ${
                selectedTag === ''
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-650'
              }`}
            >
              All Skills
            </button>
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 text-xs rounded-full border transition font-medium ${
                  selectedTag === tag
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-650'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Regular Search field */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
            <input
              type="text"
              placeholder="Filter specialized talent..."
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="px-2.5 py-1 text-xs w-full sm:w-48 bg-transparent border-0 outline-hidden focus:ring-0 text-slate-850"
            />
            <button type="submit" className="bg-slate-900 text-white rounded-lg p-1 px-3 text-xs font-semibold hover:bg-slate-800 transition">
              Find
            </button>
          </form>
        </div>
      </div>

      {/* Renders Services layout */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center max-w-sm mx-auto shadow-xs">
          <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No student profiles listed</h3>
          <p className="text-sm text-slate-500 mt-1">Be the first to list a service bundle or filter other talent keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-lg font-bold text-slate-900 font-display leading-tight line-clamp-2">
                    {post.skillCategory}
                  </h3>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Average Rate</p>
                    <p className="text-base font-extrabold text-teal-700">
                      {post.startingPrice ? `₹${post.startingPrice} start` : `₹${post.hourlyRate}/hr`}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 whitespace-pre-line leading-relaxed line-clamp-4">
                  {post.description}
                </p>

                {/* Tags associated with Provider user */}
                {post.providerSkills && post.providerSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {post.providerSkills.map((skill) => (
                      <span key={skill} className="text-[10px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                      {post.providerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-850 truncate">{post.providerName}</p>
                      <p className="text-[9px] text-slate-400">{post.providerDepartment} Senior</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="mb-1">{renderStars(post.providerRating)}</div>
                    {currentUser && (currentUser.id === post.providerId || currentUser.role === 'admin') ? (
                      <button
                        onClick={(e) => handleDeleteService(post.id, e)}
                        className="text-[10px] font-bold text-red-550 hover:text-red-750 flex items-center gap-0.5 justify-end"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    ) : revealContactId === post.id ? (
                      <a
                        href={`mailto:${post.providerEmail}?subject=CampusConnect: Requesting Skill helper ${encodeURIComponent(post.skillCategory)}`}
                        className="text-[10px] font-extrabold text-teal-700 hover:underline"
                      >
                        {post.providerEmail}
                      </a>
                    ) : (
                      <button
                        onClick={() => setRevealContactId(post.id)}
                        className="text-[10px] font-bold text-teal-600 hover:text-teal-800 underline uppercase tracking-wider"
                      >
                        Get Contact
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Add Skill exchange offer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 relative z-10 shadow-xl border border-slate-150 animate-slideUp">
            <h3 className="text-xl font-bold font-display text-slate-950 mb-4">Add Your Skill Hub Portfolio</h3>

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Service Headline Category</label>
                <input
                  type="text"
                  placeholder="e.g. PCB Schemas in Eagle or Intermediate Calculus Tutoring"
                  required
                  value={skillCategory}
                  onChange={(e) => setSkillCategory(e.target.value)}
                  className="w-full border border-slate-200 outline-hidden rounded-xl p-2.5 text-xs focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Hourly Rate (Optional, ₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full border border-slate-200 outline-hidden rounded-xl p-2.5 text-xs focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Flat Starting Price (Optional, ₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    className="w-full border border-slate-200 outline-hidden rounded-xl p-2.5 text-xs focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Offer Description</label>
                <textarea
                  placeholder="Outline what study resources you provide, previous projects built, or exact hours of workshop availability..."
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 outline-hidden rounded-xl p-2.5 text-xs focus:border-teal-400"
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
                  {submitting ? 'Publishing...' : 'List Skills'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
