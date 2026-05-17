import { useState, useRef, useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { Clock, Search, Menu, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { Sidebar } from './sidebar';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { location } = useRouterState();
  const { user, token } = useAuth();

  const [nicQuery, setNicQuery] = useState('');
  const [nicResult, setNicResult] = useState<any>(null);
  const [nicError, setNicError] = useState('');
  const [nicLoading, setNicLoading] = useState(false);
  const [showNicPanel, setShowNicPanel] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const handleNicSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const nic = nicQuery.trim();
    if (!nic) return;
    setNicLoading(true);
    setNicResult(null);
    setNicError('');
    setShowNicPanel(true);
    try {
      const result = await api.get(`/api/admin/customers/nic/${encodeURIComponent(nic)}`, token);
      setNicResult(result);
    } catch {
      setNicError('Customer not found for NIC: ' + nic);
    } finally {
      setNicLoading(false);
    }
  };

  const clearNicSearch = () => {
    setNicQuery('');
    setNicResult(null);
    setNicError('');
    setShowNicPanel(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowNicPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="lg:pl-64">
        <header className="fixed top-0 right-0 left-0 lg:left-64 bg-white border-b border-slate-200 z-30 px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 lg:hidden">
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <div className="hidden sm:flex items-center gap-4 text-sm text-slate-500">
              <span className="hover:text-emerald-600 cursor-pointer">Overview</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-slate-900 lowercase first-letter:uppercase">{location.pathname.replace('/', '') || 'Dashboard'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isSuperAdmin ? (
              <div className="relative hidden md:block" ref={searchRef}>
                <form onSubmit={handleNicSearch}>
                  <input
                    type="text"
                    value={nicQuery}
                    onChange={(e) => setNicQuery(e.target.value)}
                    onFocus={() => { if (nicResult || nicError) setShowNicPanel(true); }}
                    placeholder="Search by NIC..."
                    className="pl-10 pr-8 py-2 bg-slate-100 rounded-full text-sm w-64 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  />
                  <Search className="w-4 h-4 absolute left-4 top-2.5 text-slate-400" />
                  {nicQuery && (
                    <button type="button" onClick={clearNicSearch} className="absolute right-3 top-2.5">
                      <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </form>
                {showNicPanel && (
                  <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50">
                    {nicLoading && <p className="text-sm text-slate-400 text-center py-2">Searching...</p>}
                    {nicError && <p className="text-sm text-red-500 font-medium">{nicError}</p>}
                    {nicResult && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Found</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${nicResult.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{nicResult.status}</span>
                        </div>
                        <p className="font-bold text-slate-900">{nicResult.name}</p>
                        <p className="text-xs text-slate-500">{nicResult.email}</p>
                        <p className="text-xs text-slate-500">NIC: {nicResult.nic}</p>
                        {nicResult.address && <p className="text-xs text-slate-500">{nicResult.address}</p>}
                        {nicResult.company_name && <p className="text-xs text-slate-500">Provider: {nicResult.company_name}</p>}
                        <div className="flex gap-4 pt-1 border-t border-slate-50">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Active Loans</p>
                            <p className="font-bold text-sm">{nicResult.active_loans}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Total Debt</p>
                            <p className="font-bold text-sm">Rs {(nicResult.total_debt || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative hidden md:block">
                <input type="text" placeholder="Search customer..." className="pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm w-64 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none" />
                <Search className="w-4 h-4 absolute left-4 top-2.5 text-slate-400" />
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>{format(new Date(), 'MMM do')}</span>
            </div>
          </div>
        </header>

        <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
