import React, { useState, useEffect, useRef } from 'react';
import { User, PortfolioLink, Department, UserRole, MarketplaceItem } from '../types.js';
import { UserCheck, BookOpen, ExternalLink, Plus, X, Tag, Trash, Edit2, Mail, Save, FileText, Camera, Upload } from 'lucide-react';

interface ProfileProps {
  token: string | null;
  currentUser: User;
  onProfileUpdated: (updatedUser: User) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function ProfileView({ token, currentUser, onProfileUpdated, showToast }: ProfileProps) {
  const [name, setName] = useState(currentUser.name);
  const [dept, setDept] = useState<Department>(currentUser.department);
  const [profilePic, setProfilePic] = useState(currentUser.profilePicture);

  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (PNG, JPG, etc.)', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size is too large. Please select an image under 2MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setProfilePic(e.target.result);
        showToast('Photo uploaded successfully! Save your profile to finalize.', 'success');
      }
    };
    reader.onerror = () => {
      showToast('Could not read image file', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Skills input state
  const [skills, setSkills] = useState<string[]>(currentUser.skills || []);
  const [skillInput, setSkillInput] = useState('');

  // Portfolio Links State
  const [links, setLinks] = useState<PortfolioLink[]>(currentUser.portfolioLinks || []);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const [saving, setSaving] = useState(false);

  // User's own marketplace items
  const [myItems, setMyItems] = useState<MarketplaceItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Fetch only my items on mount
  const fetchMyItems = async () => {
    try {
      setLoadingItems(true);
      const res = await fetch(`/api/marketplace`);
      const json = await res.json();
      if (json.success) {
        // Filter personal items
        const list = (json.data as MarketplaceItem[]).filter((item) => item.sellerId === currentUser.id);
        setMyItems(list);
      }
    } catch {
      showToast('Error syncing personal marketplace items', 'error');
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchMyItems();
  }, [currentUser]);

  // Handle Skill Tag addition
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const val = skillInput.trim();
    if (!val) return;
    if (skills.includes(val)) {
      showToast('This skill tag is already in your list', 'warning');
      return;
    }
    setSkills([...skills, val]);
    setSkillInput('');
  };

  const handleRemoveSkill = (tag: string) => {
    setSkills(skills.filter((sk) => sk !== tag));
  };

  // Portfolio links helpers
  const handleAddLink = () => {
    const t = newTitle.trim();
    const u = newUrl.trim();
    if (!t || !u) {
      showToast('Please type both title and website link first', 'warning');
      return;
    }
    // Validation
    if (!u.startsWith('http://') && !u.startsWith('https://')) {
      showToast('Link url must start with http:// or https://', 'warning');
      return;
    }

    setLinks([...links, { title: t, url: u }]);
    setNewTitle('');
    setNewUrl('');
  };

  const handleRemoveLink = (idx: number) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  // Submit portfolio modifications
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          department: dept,
          profilePicture: profilePic,
          skills,
          portfolioLinks: links,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Your campus profile saved successfully!', 'success');
        onProfileUpdated(json.data);
      } else {
        showToast(json.message || 'Error updating profile', 'error');
      }
    } catch {
      showToast('Backend connection refused', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!token) return;
    if (!window.confirm('Erase this product listing permanently?')) return;

    try {
      const res = await fetch(`/api/marketplace/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        showToast('Item deleted successfully', 'success');
        setMyItems(myItems.filter((it) => it.id !== id));
      }
    } catch {
      showToast('Error removing item', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Visual top board */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center gap-6 shadow-xl border border-slate-850 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl"></div>

        <img
          src={profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
          className="w-20 h-20 rounded-full object-cover border-4 border-teal-500/20 shadow-md shrink-0"
          alt=""
          referrerPolicy="no-referrer"
        />

        <div className="text-center sm:text-left flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <h2 className="text-2xl font-bold font-display">{currentUser.name}</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/20">
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1 flex items-center justify-center sm:justify-start gap-1">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span>{currentUser.email}</span>
            <span>•</span>
            <span>ID: {currentUser.rollNumber}</span>
          </p>
          <p className="text-xs text-slate-500 font-mono mt-1">Enrolled since {new Date(currentUser.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Settings Left Panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-lg font-bold font-display text-slate-900 border-b border-slate-100 pb-3 mb-5">
              Edit Account Attributes
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value as Department)}
                    className="w-full border border-slate-200 bg-slate-50 outline-hidden focus:bg-white focus:border-teal-400 p-2.5 rounded-xl text-xs font-semibold"
                  >
                    {Object.values(Department).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Profile Photo
                </label>
                
                {/* File Drop and Click Area */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-teal-500 bg-teal-50/40'
                      : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50/40'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFile(e.target.files[0]);
                      }
                    }}
                  />

                  {profilePic ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative group">
                        <img
                          src={profilePic}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-teal-500 shadow-md"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-700">Click or drag here to replace photo</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG, WebP up to 2MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center py-2">
                      <div className="p-3 bg-slate-50 rounded-full text-slate-400 border border-slate-100">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Upload your own photo</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Drag & drop or click to browse</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Web URL Input Toggle */}
                <div className="flex justify-between items-center px-1">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-xs text-teal-650 hover:text-teal-750 font-bold transition flex items-center gap-1"
                  >
                    <span>{showUrlInput ? 'Hide URL field' : 'Or paste an image web URL'}</span>
                  </button>

                  {profilePic && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePic('');
                        showToast('Photo cleared. Save your profile to apply.', 'info');
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-bold transition"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {showUrlInput && (
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Direct Image Web Link
                    </label>
                    <input
                      type="text"
                      value={profilePic}
                      onChange={(e) => setProfilePic(e.target.value)}
                      placeholder="https://images.unsplash.com/your-avatar.jpg"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Skills tags area */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Expertise Skill Tags</label>
                <div className="flex flex-wrap gap-1.5 p-3 min-h-12 border border-slate-200 rounded-xl bg-slate-50/50">
                  {skills.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">No skills listed. Type tags below to pop.</span>
                  ) : (
                    skills.map((st) => (
                      <span key={st} className="inline-flex items-center gap-1 bg-white border border-slate-150 rounded-lg pl-2.5 pr-1.5 py-1 text-xs font-semibold text-slate-700 shadow-xs">
                        <span>{st}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(st)}
                          className="hover:bg-slate-100 rounded-md p-0.5 ml-1 select-none text-slate-400 hover:text-slate-700 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. PCB Design, Node.js, Public Speaking..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-850 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Portfolio Links area */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Portfolio & Social Anchors</label>
                <div className="space-y-2">
                  {links.map((link, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-900">{link.title}:</span>
                        <span className="text-slate-400 select-all truncate">{link.url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(i)}
                        className="text-red-500 hover:text-red-700 font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <input
                    type="text"
                    placeholder="Link Name (e.g. GitHub Repository)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="flex-1 border border-slate-250 bg-white rounded-xl p-2.5 text-xs outline-hidden"
                  />
                  <input
                    type="text"
                    placeholder="Website address (https://...)"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="flex-2 border border-slate-250 bg-white rounded-xl p-2.5 text-xs outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="bg-teal-650 hover:bg-teal-750 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition"
                  >
                    Register Link
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Publishing Updates...' : 'Save Portfolio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Tab: Personal Classified Listings */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs whitespace-normal">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">
              My Marketplace Sales
            </h3>

            {loadingItems ? (
              <div className="space-y-4">
                <div className="h-16 bg-slate-100 animate-pulse rounded-xl"></div>
                <div className="h-16 bg-slate-100 animate-pulse rounded-xl"></div>
              </div>
            ) : myItems.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                You have no active classified sales listed.
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {myItems.map((item) => (
                  <div key={item.id} className="p-3 border border-slate-150 rounded-xl flex gap-3 hover:bg-slate-50/20 transition">
                    <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover shrink-0" alt="" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{item.title}</h4>
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 rounded shrink-0 ${
                          item.status === 'Available' ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-teal-600 mt-1">${item.price}</p>
                      
                      <div className="flex gap-2 justify-end mt-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5"
                        >
                          <Trash className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
