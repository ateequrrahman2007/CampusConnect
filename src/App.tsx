import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Tag,
  Megaphone,
  UserCheck,
  User as UserIcon,
  LogOut,
  Sparkles,
  BookOpen,
  Menu,
  X,
  Lock,
  Mail,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

import { User, UserRole, Department } from './types.js';
import { DashboardView } from './components/DashboardView.jsx';
import { MarketplaceView } from './components/MarketplaceView.jsx';
import { SkillHubView } from './components/SkillHubView.jsx';
import { NoticesView } from './components/NoticesView.jsx';
import { StaffTrackerView } from './components/StaffTrackerView.jsx';
import { ProfileView } from './components/ProfileView.jsx';

// Toast structure
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<string>('dashboard');
  
  // Mobile nav toggles
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Floating structured Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Auth Overlay Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');

  // Dual Auth registration variables
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRoll, setRegRoll] = useState('');
  const [regDept, setRegDept] = useState<Department>(Department.CSE);

  // Fetch /api/auth/me to restore session token
  const initAuth = async (savedToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${savedToken}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setCurrentUser(json.data);
        setToken(savedToken);
      } else {
        localStorage.removeItem('campusconnect_token');
      }
    } catch {
      localStorage.removeItem('campusconnect_token');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('campusconnect_token');
    if (saved) {
      initAuth(saved);
    }
  }, []);

  // Floating Notification Toast System
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!loginEmail.trim() || !loginPassword) {
      setAuthError('Email and Password tags are necessary.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const json = await res.json();

      if (json.success) {
        setToken(json.data.token);
        setCurrentUser(json.data.user);
        localStorage.setItem('campusconnect_token', json.data.token);
        showToast(`Welcome back, ${json.data.user.name}!`, 'success');
        setShowAuthModal(false);
        // Clear
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setAuthError(json.message || 'Invalid parameters');
      }
    } catch {
      setAuthError('Connection backend failed');
    }
  };

  // Submit Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!regName.trim() || !regEmail.trim() || !regPassword || !regRoll.trim()) {
      setAuthError('All registration fields are requested.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          rollNumber: regRoll,
          department: regDept,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setToken(json.data.token);
        setCurrentUser(json.data.user);
        localStorage.setItem('campusconnect_token', json.data.token);
        showToast('Registration enrollment complete!', 'success');
        setShowAuthModal(false);
        // Clear
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegRoll('');
      } else {
        setAuthError(json.message || 'Registration rejected');
      }
    } catch {
      setAuthError('Connection failure while registering info');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('campusconnect_token');
    setToken(null);
    setCurrentUser(null);
    showToast('Logged out of CampusConnect session.', 'info');
    setCurrentSection('dashboard');
  };

  // Navigations switcher (locks profiles and resets screen toggles)
  const navigateTo = (sec: string) => {
    if (sec === 'profile' && !token) {
      setAuthTab('login');
      setShowAuthModal(true);
      return;
    }
    setCurrentSection(sec);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* 1. Sticky Navigation Top Header */}
      <nav className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Platform branding */}
            <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigateTo('dashboard')}>
              <div className="bg-teal-500 text-slate-950 p-2 rounded-xl shadow-inner font-black flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-extrabold text-lg tracking-tight text-white block">
                  Campus<span className="text-teal-400">Connect</span>
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block -mt-1 font-mono">
                  Nandha College of Tech
                </span>
              </div>
            </div>

            {/* Desktop Navigation Anchors */}
            <div className="hidden md:flex gap-1.5 font-semibold text-xs tracking-wide uppercase">
              <button
                onClick={() => navigateTo('dashboard')}
                className={`py-2 px-3.5 rounded-lg transition ${
                  currentSection === 'dashboard' ? 'bg-slate-800 text-teal-400 border border-slate-705' : 'hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                Board
              </button>
              <button
                onClick={() => navigateTo('marketplace')}
                className={`py-2 px-3.5 rounded-lg transition ${
                  currentSection === 'marketplace' ? 'bg-slate-800 text-teal-400 border border-slate-705' : 'hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                Marketplace
              </button>
              <button
                onClick={() => navigateTo('skillhub')}
                className={`py-2 px-3.5 rounded-lg transition ${
                  currentSection === 'skillhub' ? 'bg-slate-800 text-teal-400 border border-slate-705' : 'hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                Skill Hub
              </button>
              <button
                onClick={() => navigateTo('notices')}
                className={`py-2 px-3.5 rounded-lg transition ${
                  currentSection === 'notices' ? 'bg-slate-800 text-teal-400 border border-slate-705' : 'hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                Noticeboard
              </button>
              <button
                onClick={() => navigateTo('staff')}
                className={`py-2 px-3.5 rounded-lg transition ${
                  currentSection === 'staff' ? 'bg-slate-800 text-teal-400 border border-slate-705' : 'hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                Staff Tracker
              </button>
            </div>

            {/* Authentications indicators */}
            <div className="hidden md:flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => navigateTo('profile')}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-850 hover:bg-slate-850 transition cursor-pointer"
                  >
                    <img
                      src={currentUser.profilePicture}
                      className="w-7 h-7 rounded-full object-cover border border-teal-500/35"
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left font-sans">
                      <p className="text-xs font-bold leading-none">{currentUser.name.split(' ')[0]}</p>
                      <p className="text-[9px] text-slate-400 block mt-0.5 leading-none font-mono uppercase">
                        {currentUser.department}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    title="Exit CampusConnect Session"
                    className="p-2 border border-slate-800 hover:border-red-500 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthTab('login');
                    setShowAuthModal(true);
                  }}
                  className="bg-teal-500 hover:bg-teal-600 border border-teal-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wide transition shadow-sm"
                >
                  Join Community
                </button>
              )}
            </div>

            {/* Mobile Hamburg toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Panels */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-2 font-semibold text-xs tracking-wide uppercase"
            >
              <button
                onClick={() => navigateTo('dashboard')}
                className={`block w-full text-left p-2.5 rounded-lg ${currentSection === 'dashboard' ? 'bg-slate-800 text-teal-400' : 'text-slate-300'}`}
              >
                Dashboard Call
              </button>
              <button
                onClick={() => navigateTo('marketplace')}
                className={`block w-full text-left p-2.5 rounded-lg ${currentSection === 'marketplace' ? 'bg-slate-800 text-teal-400' : 'text-slate-300'}`}
              >
                Marketplace Sales
              </button>
              <button
                onClick={() => navigateTo('skillhub')}
                className={`block w-full text-left p-2.5 rounded-lg ${currentSection === 'skillhub' ? 'bg-slate-800 text-teal-400' : 'text-slate-300'}`}
              >
                Peer Skills Hub
              </button>
              <button
                onClick={() => navigateTo('notices')}
                className={`block w-full text-left p-2.5 rounded-lg ${currentSection === 'notices' ? 'bg-slate-800 text-teal-400' : 'text-slate-300'}`}
              >
                Notices Board
              </button>
              <button
                onClick={() => navigateTo('staff')}
                className={`block w-full text-left p-2.5 rounded-lg ${currentSection === 'staff' ? 'bg-slate-800 text-teal-400' : 'text-slate-300'}`}
              >
                Staff Tracker
              </button>

              <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
                {currentUser ? (
                  <>
                    <button
                      onClick={() => navigateTo('profile')}
                      className="flex items-center gap-2 p-2.5 text-slate-300 hover:text-white"
                    >
                      <img src={currentUser.profilePicture} className="w-6 h-6 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                      <span>{currentUser.name} Profiling</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 p-2.5 text-rose-450 hover:text-rose-500 w-full text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout Account</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setAuthTab('login');
                      setShowAuthModal(true);
                    }}
                    className="bg-teal-500 text-slate-950 font-bold p-2.5 rounded-xl uppercase tracking-wide text-center"
                  >
                    Join Platform
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 2. Structured Views Sections render block */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentSection === 'dashboard' && (
              <DashboardView
                token={token}
                currentUser={currentUser}
                onNavigate={navigateTo}
                showToast={showToast}
                openAuthModal={() => {
                  setAuthTab('login');
                  setShowAuthModal(true);
                }}
              />
            )}
            {currentSection === 'marketplace' && (
              <MarketplaceView
                token={token}
                currentUser={currentUser}
                showToast={showToast}
                openAuthModal={() => {
                  setAuthTab('login');
                  setShowAuthModal(true);
                }}
              />
            )}
            {currentSection === 'skillhub' && (
              <SkillHubView
                token={token}
                currentUser={currentUser}
                showToast={showToast}
                openAuthModal={() => {
                  setAuthTab('login');
                  setShowAuthModal(true);
                }}
              />
            )}
            {currentSection === 'notices' && (
              <NoticesView
                token={token}
                currentUser={currentUser}
                showToast={showToast}
                openAuthModal={() => {
                  setAuthTab('login');
                  setShowAuthModal(true);
                }}
              />
            )}
            {currentSection === 'staff' && (
              <StaffTrackerView
                token={token}
                currentUser={currentUser}
                showToast={showToast}
                openAuthModal={() => {
                  setAuthTab('login');
                  setShowAuthModal(true);
                }}
              />
            )}
            {currentSection === 'profile' && currentUser && (
              <ProfileView
                token={token}
                currentUser={currentUser}
                onProfileUpdated={(user) => setCurrentUser(user)}
                showToast={showToast}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Humble Footer board */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 CampusConnect Platform. Created for student micro-synergies.</p>
          <div className="flex gap-4">
            <span className="hover:text-white transition cursor-pointer" onClick={() => navigateTo('dashboard')}>Board</span>
            <span className="hover:text-white transition cursor-pointer" onClick={() => navigateTo('marketplace')}>Market</span>
            <span className="hover:text-white transition cursor-pointer" onClick={() => navigateTo('skillhub')}>Skills</span>
            <span className="hover:text-white transition cursor-pointer" onClick={() => navigateTo('staff')}>Staff Locations</span>
          </div>
        </div>
      </footer>

      {/* Dual Authorization Sliding Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs"
            onClick={() => setShowAuthModal(false)}
          ></div>

          <div className="bg-white rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl border border-slate-150 animate-slideUp">
            
            {/* Headers tabs */}
            <div className="flex border-b border-slate-100 pb-3 mb-6">
              <button
                onClick={() => {
                  setAuthTab('login');
                  setAuthError('');
                }}
                className={`flex-1 text-center font-display font-black text-lg py-1 ${
                  authTab === 'login' ? 'text-teal-700 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthTab('register');
                  setAuthError('');
                }}
                className={`flex-1 text-center font-display font-black text-lg py-1 ${
                  authTab === 'register' ? 'text-teal-700 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Join Campus
              </button>
            </div>

            {/* Error Indicators */}
            {authError && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-rose-750 text-xs mb-4">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">College Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="username@college.edu"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 pl-9 text-xs focus:border-teal-400 focus:bg-slate-50/20"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Pass Hash Key</label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 pl-9 text-xs focus:border-teal-400"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-2">
                  <span>Demo Admin credentials:</span>
                  <span className="font-bold text-slate-650 bg-slate-100 px-1 rounded">admin@college.edu</span>
                  <span>/</span>
                  <span className="font-bold text-slate-650 bg-slate-100 px-1 rounded">admin123</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-3 rounded-xl transition uppercase tracking-wider shadow-md mt-6"
                >
                  Confirm Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Liam Mercer"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Registration ID/Roll</label>
                    <input
                      type="text"
                      placeholder="e.g. CSE-24-001"
                      required
                      value={regRoll}
                      onChange={(e) => setRegRoll(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Department</label>
                    <select
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value as Department)}
                      className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-xl text-xs"
                    >
                      {Object.values(Department).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">College Email Address</label>
                  <input
                    type="email"
                    placeholder="username@college.edu (Must end with .edu)"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 leading-none italic font-medium">Domain match required (e.g. ends with @college.edu).</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Secret Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    required
                    min={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-teal-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-3 rounded-xl transition uppercase tracking-wider shadow-md mt-6"
                >
                  Register Account
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating notifications Toaster stack */}
      <div className="fixed top-20 right-6 z-55 flex flex-col gap-2 max-w-sm w-full font-semibold select-none pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isErr = toast.type === 'error';
            const isWarn = toast.type === 'warning';
            const isInfo = toast.type === 'info';
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs shadow-lg pointer-events-auto ${
                  isErr
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : isWarn
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : isInfo
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-emerald-50 border-emerald-250 text-emerald-800'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  isErr ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : isInfo ? 'bg-blue-500' : 'bg-emerald-500'
                }`}></div>
                <span>{toast.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
