import React, { useState, useEffect } from 'react';
import { Search, Tag, DollarSign, PlusCircle, CheckCircle, Trash2, Mail, ExternalLink, HelpCircle, Eye } from 'lucide-react';
import { MarketplaceItem, MarketplaceCategory, MarketplaceStatus } from '../types.js';
import { CardSkeleton } from './Skeletons.js';

interface MarketplaceProps {
  token: string | null;
  currentUser: any;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  openAuthModal: () => void;
}

export function MarketplaceView({ token, currentUser, showToast, openAuthModal }: MarketplaceProps) {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [status, setStatus] = useState<string>('Available');

  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [showContact, setShowContact] = useState(false);

  // Create Listing Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState<MarketplaceCategory>(MarketplaceCategory.Books);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Listings on load/filter change
  const fetchMarketplace = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category);
      if (search) params.append('search', search);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (status) params.append('status', status);

      const res = await fetch(`/api/marketplace?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch {
      showToast('Could not load marketplace items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplace();
  }, [category, status, minPrice, maxPrice]); // load trigger

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMarketplace();
  };

  // Submit Listing
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      openAuthModal();
      return;
    }

    if (!newTitle.trim() || !newDesc.trim() || !newPrice) {
      showToast('Please fill in some description details and price first!', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          price: parseFloat(newPrice),
          category: newCategory,
          imageUrl: newImageUrl,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Merchandise listing posted successfully!', 'success');
        setItems([json.data, ...items]);
        setShowCreateModal(false);
        // Reset
        setNewTitle('');
        setNewDesc('');
        setNewPrice('');
        setNewImageUrl('');
        setNewCategory(MarketplaceCategory.Books);
      } else {
        showToast(json.message || 'Listing creation failed', 'error');
      }
    } catch {
      showToast('Network error while saving item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Mark Listing as sold
  const handleMarkSold = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;

    try {
      const res = await fetch(`/api/marketplace/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: MarketplaceStatus.Sold }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Listing marked as SOLD', 'success');
        setItems(items.map((item) => (item.id === id ? { ...item, status: MarketplaceStatus.Sold } : item)));
        if (selectedItem?.id === id) {
          setSelectedItem(json.data);
        }
      }
    } catch {
      showToast('Communication error', 'error');
    }
  };

  // Delete Listing
  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;

    if (!window.confirm('Are you sure you want to permanently delete this listing?')) {
      return;
    }

    try {
      const res = await fetch(`/api/marketplace/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (json.success) {
        showToast('Listing deleted successfully', 'success');
        setItems(items.filter((item) => item.id !== id));
        if (selectedItem?.id === id) {
          setSelectedItem(null);
        }
      }
    } catch {
      showToast('Communication error', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900 flex items-center gap-1.5">
            <Tag className="w-6 h-6 text-teal-700" />
            <span>Student Marketplace</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Flea-market hub to acquire academic reference books, electronic lab gadgets, or sports gears from graduating peers.
          </p>
        </div>
        <button
          onClick={() => (token ? setShowCreateModal(true) : openAuthModal())}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-xs w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Listing</span>
        </button>
      </div>

      {/* Main Grid: Filters Sidebar + Grid Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-6 h-fit">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Filter Listings</h3>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">Keyword Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. chemistry, calculator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400 focus:bg-slate-50/20"
              />
              <button type="submit" className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Categories select/list */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-200 outline-hidden bg-slate-50/50 rounded-xl p-2.5 text-xs focus:bg-white focus:border-teal-400"
            >
              <option value="all">All Merchandise</option>
              {Object.values(MarketplaceCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">Disposal Status</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setStatus('Available')}
                className={`flex-1 text-center py-1 rounded-md text-xs font-medium transition ${
                  status === 'Available' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Available
              </button>
              <button
                type="button"
                onClick={() => setStatus('Sold')}
                className={`flex-1 text-center py-1 rounded-md text-xs font-medium transition ${
                  status === 'Sold' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sold
              </button>
            </div>
          </div>

          {/* Pricing boundaries */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">Price Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:border-teal-400 text-center"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:border-teal-400 text-center"
              />
            </div>
          </div>
        </div>

        {/* Product Cards Grid Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white border rounded-2xl p-12 text-center max-w-sm mx-auto shadow-xs">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No products matched</h3>
              <p className="text-sm text-slate-500 mt-1">Try resetting category query tags or adjusting pricing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setShowContact(false);
                  }}
                  className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-slate-350 transition duration-250 flex flex-col justify-between cursor-pointer group"
                >
                  <div className="relative">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-44 object-cover group-hover:scale-102 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-xs text-white">
                      {item.category}
                    </span>
                    {item.status === MarketplaceStatus.Sold && (
                      <span className="absolute inset-0 bg-slate-900/65 flex items-center justify-center text-white text-lg font-extrabold uppercase tracking-wide">
                        Sold Out
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-900 font-display text-base tracking-tight leading-tight line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 text-ellipsis line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Offer Price</p>
                        <p className="text-base font-extrabold text-teal-700 font-display">₹{item.price}</p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        {currentUser && (currentUser.id === item.sellerId || currentUser.role === 'admin') ? (
                          <div className="flex items-center gap-1">
                            {item.status === MarketplaceStatus.Available && (
                              <button
                                onClick={(e) => handleMarkSold(item.id, e)}
                                title="Mark as Sold"
                                className="p-1 px-2 border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 bg-slate-50 text-slate-650 rounded-md transition"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteItem(item.id, e)}
                              title="Delete Listing"
                              className="p-1 px-2 border border-slate-200 hover:border-red-650 hover:bg-red-50 hover:text-red-650 text-slate-650 rounded-md transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-sm border border-slate-100">
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span>View details</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Add Marketplace Item */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setShowCreateModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 relative z-10 shadow-xl border border-slate-150 animate-slideUp">
            <h3 className="text-xl font-bold text-slate-950 font-display mb-4">Add For-Sale Merchandise</h3>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Item Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MarketplaceCategory)}
                  className="w-full border border-slate-200 outline-hidden bg-slate-50 focus:bg-white focus:border-teal-400 p-2.5 rounded-xl text-xs"
                >
                  {Object.values(MarketplaceCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Listing Name/Title</label>
                <input
                  type="text"
                  placeholder="e.g. Casio fx-991EX Scientific Calculator"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    required
                    min={0}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Image URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://example.com/item.jpg"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Item Description & Condition</label>
                <textarea
                  placeholder="In superb working condition. Minimal scratches. Handing over at Central Library or Canteen..."
                  rows={4}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-slate-550 hover:bg-slate-550/10 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition"
                >
                  {submitting ? 'Adding...' : 'Post Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Details and anti-scraping Contact display */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-bg bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="absolute inset-0" onClick={() => setSelectedItem(null)}></div>
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 relative z-10 shadow-xl border border-slate-150 animate-slideUp overflow-hidden max-h-[92vh] flex flex-col justify-between">
            <div>
              <div className="relative h-56 rounded-2xl overflow-hidden mb-4">
                <img src={selectedItem.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-xs text-white uppercase">
                  {selectedItem.category}
                </span>
                {selectedItem.status === MarketplaceStatus.Sold && (
                  <span className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-white text-xl font-bold uppercase tracking-wider">
                    SOLD OUT
                  </span>
                )}
              </div>

              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xl font-bold font-display text-slate-950">{selectedItem.title}</h4>
                <p className="text-xl font-extrabold text-teal-700">₹{selectedItem.price}</p>
              </div>

              <p className="text-xs text-slate-400 font-mono">Posted on {new Date(selectedItem.createdAt).toLocaleDateString()}</p>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Product Details</p>
                <p className="text-sm text-slate-650 leading-relaxed max-h-40 overflow-y-auto pr-1 whitespace-pre-line">{selectedItem.description}</p>
              </div>

              {/* Seller details card */}
              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-200 font-bold text-slate-700 flex items-center justify-center">
                    {selectedItem.sellerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{selectedItem.sellerName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{selectedItem.sellerDepartment} Department</p>
                  </div>
                </div>

                <div>
                  {selectedItem.status === MarketplaceStatus.Sold ? (
                    <span className="text-xs font-bold text-slate-400 bg-slate-200 px-3 py-1.5 rounded-lg">Product Disposed</span>
                  ) : showContact ? (
                    <a
                      href={`mailto:${selectedItem.sellerEmail}?subject=CampusConnect: Buying ${encodeURIComponent(selectedItem.title)}`}
                      className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{selectedItem.sellerEmail}</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => setShowContact(true)}
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                    >
                      <Mail className="w-3.5 h-3.5 animate-bounce" />
                      <span>Reveal Seller Contact</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
