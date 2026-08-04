import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Bookmark, MessageSquare, Tag, IndianRupee, Calendar, Clock, Sparkles } from 'lucide-react';
import { RequirementPost, MarketplaceItem, ServicePost, Notice } from '../types.js';
import { RowSkeleton } from './Skeletons.js';

interface DashboardProps {
  token: string | null;
  currentUser: any;
  onNavigate: (section: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  openAuthModal: () => void;
}

export function DashboardView({ token, currentUser, onNavigate, showToast, openAuthModal }: DashboardProps) {
  const [requirements, setRequirements] = useState<RequirementPost[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);

  // Unified Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'products' | 'services' | 'notices'>('all');
  const [searchResults, setSearchResults] = useState<{
    products: MarketplaceItem[];
    services: ServicePost[];
    notices: Notice[];
  }>({ products: [], services: [], notices: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Create Requirement State
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqBudget, setReqBudget] = useState('');
  const [reqCategory, setReqCategory] = useState('Study Partner');

  // Response Proposal State
  const [respondingTo, setRespondingTo] = useState<RequirementPost | null>(null);
  const [proposalMessage, setProposalMessage] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Fetch Cooperations and Requirements
  const fetchRequirements = async () => {
    try {
      setLoadingReqs(true);
      const res = await fetch('/api/requirements');
      const json = await res.json();
      if (json.success) {
        setRequirements(json.data);
      }
    } catch {
      showToast('Could not load requirements board', 'error');
    } finally {
      setLoadingReqs(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  // Multi-domain Unified Parallel Query Handlers
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Parallel fetch for all domains
      const [prodRes, servRes, notRes] = await Promise.all([
        fetch(`/api/marketplace?search=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/services?skill=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/notices`) // notices filtered client-side for title/content
      ]);

      const [prodJson, servJson, notJson] = await Promise.all([
        prodRes.json(),
        servRes.json(),
        notRes.json()
      ]);

      let productsResult = prodJson.success ? prodJson.data : [];
      let servicesResult = servJson.success ? servJson.data : [];
      let noticesResult = notJson.success ? notJson.data : [];

      // Filter global notices search client-side
      if (noticesResult.length > 0) {
        const query = searchQuery.toLowerCase();
        noticesResult = noticesResult.filter(
          (not: Notice) =>
            not.title.toLowerCase().includes(query) ||
            not.content.toLowerCase().includes(query)
        );
      }

      setSearchResults({
        products: productsResult,
        services: servicesResult,
        notices: noticesResult,
      });
    } catch {
      showToast('Error executing parallel database query', 'error');
    }
  };

  // Create Cooperation Request Submission
  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      openAuthModal();
      return;
    }

    if (!reqTitle.trim() || !reqDesc.trim() || !reqCategory.trim()) {
      showToast('Please fill out all fields first', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: reqTitle,
          description: reqDesc,
          budget: reqBudget ? parseFloat(reqBudget) : undefined,
          category: reqCategory,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Collaboration request post added!', 'success');
        setRequirements([json.data, ...requirements]);
        setShowReqModal(false);
        // Clear
        setReqTitle('');
        setReqDesc('');
        setReqBudget('');
      } else {
        showToast(json.message || 'Error occurred', 'error');
      }
    } catch {
      showToast('Network error while saving post', 'error');
    }
  };

  // Submit Answer/Proposal to cooperation listing
  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      openAuthModal();
      return;
    }

    if (!respondingTo) return;
    if (!proposalMessage.trim()) {
      showToast('Proposal message cannot be blank', 'warning');
      return;
    }

    setSubmittingProposal(true);
    try {
      const res = await fetch(`/api/requirements/${respondingTo.id}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: proposalMessage }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Your proposal was forwarded to their profile inbox!', 'success');
        setRespondingTo(null);
        setProposalMessage('');
        fetchRequirements(); // refresh list with state
      } else {
        showToast(json.message || 'Failed to send proposal', 'error');
      }
    } catch {
      showToast('Failed to connect to backend api', 'error');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleCloseRequirement = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/requirements/${id}/close`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        showToast('Requirement completed and closed', 'success');
        fetchRequirements();
      }
    } catch {
      showToast('Failed to change status', 'error');
    }
  };

  return (
    <div className="space-y-12">
      {/* Visual Hero Header Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl py-12 px-8 sm:px-12 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 text-teal-300 text-sm font-medium rounded-full mb-4 border border-teal-500/20">
            <Sparkles className="w-4 h-4" />
            <span>Connecting Academic Pioneers</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight leading-tight mb-4">
            Nandha College of <span className="text-teal-400">Technology</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-6">
            Welcome to the official CampusConnect platform for NCT students. Securely buy/sell lab gear, swap programming skills, view department noticeboards, and track real-time faculty availability.
          </p>

          {/* Large Consolidated Search Form */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex-1 flex items-center px-3 gap-2">
              <Search className="w-5 h-5 text-slate-300 shrink-0" />
              <input
                type="text"
                placeholder="Search across products, services, study sessions, lost & found..."
                className="w-full bg-transparent text-white border-0 outline-hidden placeholder:text-slate-400 text-sm py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 px-1">
              <select
                className="bg-slate-800 text-slate-200 border-0 outline-hidden rounded-xl py-2 px-3 text-xs w-full sm:w-auto"
                value={searchCategory}
                onChange={(e: any) => setSearchCategory(e.target.value)}
              >
                <option value="all">Search All</option>
                <option value="products">In Marketplace</option>
                <option value="services">In Skill Hub</option>
                <option value="notices">In Notices</option>
              </select>
              <button
                type="submit"
                className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 transition px-5 py-2 text-sm font-semibold text-slate-900 rounded-xl"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Unified Parallel Search Results Feed */}
      {isSearching && (
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-teal-600" />
              <span>Search Results for "{searchQuery}"</span>
            </h2>
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Clear Results
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Products Found Column */}
            {(searchCategory === 'all' || searchCategory === 'products') && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Marketplace Products</span>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {searchResults.products.length}
                  </span>
                </h3>
                {searchResults.products.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No products matched.</p>
                ) : (
                  searchResults.products.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-150 p-3 rounded-xl shadow-xs flex gap-3 hover:border-teal-400 transition cursor-pointer" onClick={() => onNavigate('marketplace')}>
                      <img src={item.imageUrl} className="w-12 h-12 object-cover rounded-lg" alt="" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{item.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{item.description}</p>
                        <p className="text-xs font-bold text-teal-600 mt-1">₹{item.price}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. Services Found Column */}
            {(searchCategory === 'all' || searchCategory === 'services') && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Tutoring & Services</span>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {searchResults.services.length}
                  </span>
                </h3>
                {searchResults.services.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No services posted.</p>
                ) : (
                  searchResults.services.map((srv) => (
                    <div key={srv.id} className="bg-white border border-slate-150 p-3 rounded-xl shadow-xs hover:border-slate-350 transition cursor-pointer" onClick={() => onNavigate('skillhub')}>
                      <h4 className="text-sm font-bold text-slate-800 truncate">{srv.skillCategory}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{srv.description}</p>
                      <div className="flex-justify-between items-center mt-2 pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400">By {srv.providerName}</span>
                        <span className="text-xs font-bold text-slate-900">₹{srv.startingPrice ? `${srv.startingPrice} start` : `${srv.hourlyRate}/hr`}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. Notices Found Column */}
            {(searchCategory === 'all' || searchCategory === 'notices') && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Notices Board</span>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {searchResults.notices.length}
                  </span>
                </h3>
                {searchResults.notices.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No bulletin notice matches.</p>
                ) : (
                  searchResults.notices.map((not) => (
                    <div key={not.id} className="bg-white border border-slate-150 p-3 rounded-xl shadow-xs hover:border-teal-400 transition cursor-pointer" onClick={() => onNavigate('notices')}>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{not.title}</h4>
                        <span className="text-[9px] bg-sky-50 text-sky-700 font-bold px-1.5 py-0.5 rounded-sm shrink-0">{not.type}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{not.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cooperation Exchange Board Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900 flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-teal-700" />
              <span>Project Cooperation Board</span>
            </h2>
            <p className="text-slate-500 text-sm">
              Discover academic partners, find project team players, hardware designers, and campus opportunities.
            </p>
          </div>
          <button
            onClick={() => (token ? setShowReqModal(true) : openAuthModal())}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-xs w-fit"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Project Call</span>
          </button>
        </div>

        {loadingReqs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white h-48 border border-slate-200 rounded-2xl animate-pulse"></div>
            <div className="bg-white h-48 border border-slate-200 rounded-2xl animate-pulse"></div>
          </div>
        ) : requirements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Cooperation board is empty</h3>
            <p className="text-sm text-slate-500 mt-1">Be the first to call for a project partner, homework help, or hacker guild!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {requirements.map((req) => (
              <div
                key={req.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition hover:shadow-md ${
                  req.isOpen ? 'border-slate-150' : 'border-slate-100 bg-slate-50/50 opacity-75'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-sm">
                      {req.category}
                    </span>
                    {req.budget !== undefined && (
                      <span className="text-sm font-extrabold text-slate-930 flex items-center gap-0.5">
                        <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{req.budget}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mt-3 font-display">
                    {req.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line line-clamp-3">
                    {req.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {req.posterName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-850 truncate">{req.posterName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{req.posterDepartment}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Show active responses */}
                      {req.responses && req.responses.length > 0 && (
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{req.responses.length} responses</span>
                        </span>
                      )}

                      {req.isOpen ? (
                        currentUser && currentUser.id === req.posterId ? (
                          <button
                            onClick={() => handleCloseRequirement(req.id)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            Mark Fulfilled
                          </button>
                        ) : (
                          <button
                            onClick={() => setRespondingTo(req)}
                            className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-1.5 rounded-lg transition shadow-xs"
                          >
                            Respond
                          </button>
                        )
                      ) : (
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-sm">
                          Fulfilled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Received Responses if Current User is Poster */}
                {currentUser && currentUser.id === req.posterId && req.responses && req.responses.length > 0 && (
                  <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Inbox Responses:</p>
                    {req.responses.map((resp, i) => (
                      <div key={i} className="text-xs bg-white border border-slate-100 p-2.5 rounded-lg">
                        <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                          <span>{resp.responderName}</span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(resp.respondedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600 italic">"{resp.message}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: Create Cooperation Notice */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowReqModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 relative z-10 shadow-xl border border-slate-150 animate-slideUp">
            <h3 className="text-xl font-bold text-slate-900 font-display mb-4">Post Project Cooperation Call</h3>
            <form onSubmit={handleCreateRequirement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Project Category</label>
                <select
                  className="w-full border border-slate-200 outline-hidden rounded-xl p-2.5 text-sm bg-slate-50 focus:bg-white focus:border-teal-400"
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value)}
                >
                  <option value="Study Partner">Study Partner</option>
                  <option value="Hackathon Team">Hackathon Team</option>
                  <option value="Electrical Design">Electrical / IoT Hardware</option>
                  <option value="Software/Design">Software Design / Programming</option>
                  <option value="Lab Assistant">Laboratory Project Support</option>
                  <option value="Other Assistance">Other Academic Task</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. Seeking EEE Senior for Solar Inverter circuit review"
                  className="w-full border border-slate-200 outline-hidden rounded-xl p-2.5 text-sm focus:border-teal-400"
                  required
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Details & Core Tasks</label>
                <textarea
                  placeholder="Describe your goals, tech stack, or study timetable..."
                  rows={4}
                  className="w-full border border-slate-200 outline-hidden rounded-xl p-2.5 text-sm focus:border-teal-400"
                  required
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Offering Budget (Optional, ₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500 (Leave empty if academic swapping)"
                  className="w-full border border-slate-200 outline-hidden rounded-xl p-2.5 text-sm focus:border-teal-400"
                  value={reqBudget}
                  onChange={(e) => setReqBudget(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-550 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2 rounded-xl transition"
                >
                  Publish Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Respond Proposal Form */}
      {respondingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setRespondingTo(null)}></div>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 relative z-10 shadow-xl border border-slate-150 animate-slideUp">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900 font-display">Respond to Collaboration Request</h3>
              <p className="text-xs text-slate-550 mt-1 font-mono">Request by {respondingTo.posterName}</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 text-xs">
              <p className="font-bold text-slate-750">{respondingTo.title}</p>
              <p className="text-slate-650 mt-1 line-clamp-2">{respondingTo.description}</p>
            </div>

            <form onSubmit={handleSendProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your Pitch / Contact Proposition</label>
                <textarea
                  placeholder="Hey! I can help with this. I have a lot of experience design PCB schemas. Let's meet at canteen or message me on discord: user#123..."
                  rows={4}
                  className="w-full border border-slate-200 outline-hidden rounded-xl p-2.5 text-sm focus:border-teal-400"
                  required
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRespondingTo(null)}
                  disabled={submittingProposal}
                  className="px-4 py-2 text-sm font-semibold text-slate-550 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProposal}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-5 py-2 rounded-xl transition disabled:opacity-50"
                >
                  {submittingProposal ? 'Sending...' : 'Send to Poster Inbox'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
