import { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Building2, 
  Users, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  LogOut, 
  Menu, 
  X, 
  PieChart, 
  TrendingUp,
  AlertCircle,
  Plus,
  Search,
  ChevronRight,
  CreditCard,
  History,
  Shield,
  Filter,
  ArrowRight,
  UserPlus,
  DollarSign,
  FileBadge,
  Layers,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

// --- Types ---
type Role = 'SUPER_ADMIN' | 'PROVIDER' | 'COLLECTOR' | 'CUSTOMER';

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  company_id: number | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

interface LoanType {
  id: number;
  name: string;
  term_value: number;
  term_unit: 'day' | 'month';
  interest_rate: number;
  late_fee_value: number;
  late_fee_unit: 'day' | 'year';
  late_fee_rate: number;
}

// --- Context ---
const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- API Helpers ---
const api = {
  get: async (url: string, token: string | null) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('API Error');
    return res.json();
  },
  post: async (url: string, body: any, token?: string | null) => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw { response: { data: errorData } };
    }
    return res.json();
  }
};

// --- Components ---

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = {
    SUPER_ADMIN: [
      { name: 'Dashboard', icon: PieChart, path: '/' },
      { name: 'Providers', icon: Building2, path: '/providers' },
      { name: 'Loan Types', icon: Layers, path: '/loan-types' },
    ],
    PROVIDER: [
      { name: 'Dashboard', icon: PieChart, path: '/' },
      { name: 'Loans', icon: Wallet, path: '/loans' },
      { name: 'Collectors', icon: Users, path: '/collectors' },
      { name: 'Customers', icon: Users, path: '/customers' },
      { name: 'Approvals', icon: Clock, path: '/approvals' },
      { name: 'Policies', icon: BookOpen, path: '/policies' },
    ],
    COLLECTOR: [
      { name: 'Collections', icon: CheckCircle2, path: '/' },
      { name: 'History', icon: History, path: '/history' },
    ],
    CUSTOMER: [
      { name: 'My Loans', icon: Wallet, path: '/' },
      { name: 'History', icon: History, path: '/history' },
    ]
  };

  const currentMenu = user ? menuItems[user.role] : [];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.div
        className={`fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white z-50 transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">LendFlow</span>
          </div>

          <nav className="space-y-1">
            {currentMenu.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-6 py-3 transition-colors text-left group border-r-4 ${
                  window.location.pathname === item.path 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' 
                  : 'border-transparent text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${window.location.pathname === item.path ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-6 px-4">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-emerald-400 font-bold uppercase shrink-0">
              {user?.name[0]}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium truncate text-sm">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase mt-0.5 tracking-wider">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.div>
    </>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

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
              <span className="font-medium text-slate-900 lowercase first-letter:uppercase">{window.location.pathname.replace('/', '') || 'Dashboard'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input type="text" placeholder="Search customer..." className="pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm w-64 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none" />
              <Search className="w-4 h-4 absolute left-4 top-2.5 text-slate-400" />
            </div>
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/api/auth/login', { email, password });
      login(data.token, data.user);
      toast.success('Successfully logged in!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-slate-200"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 mb-4">
            <TrendingUp className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">LendFlow</h1>
          <p className="text-slate-500 mt-1">Loan Management Made Simple</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="name@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 h-[56px]"
          >
            {loading ? (
              <Clock className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col items-center gap-2">
           <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            <Shield className="w-3 h-3" />
            Secure Enterprise Login
          </div>
          <p className="text-[11px] text-slate-400 text-center px-4 leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy. All activities are monitored and logged.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// --- Shared UI ---

const Card = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
      {title}
      {trend && (
        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
           {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="flex items-end justify-between">
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, description, action }: any) => (
  <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8 text-slate-300" />
    </div>
    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    <p className="text-slate-500 text-sm max-w-[240px] mx-auto mt-1 mb-6">{description}</p>
    {action}
  </div>
);

// --- Super Admin Configuration ---

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const { token } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();

  const fetchStats = () => api.get('/api/admin/stats', token).then(setStats);
  useEffect(() => { fetchStats(); }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.post('/api/admin/seed', {}, token);
      toast.success('Demo data seeded successfully!');
      fetchStats();
    } catch {
      toast.error('Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  if (!stats) return <div className="flex items-center justify-center h-64"><Clock className="animate-spin text-emerald-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
          <p className="text-slate-500 text-sm">Super Admin Control Panel</p>
        </div>
        <button 
          onClick={handleSeed} 
          disabled={seeding}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {seeding ? <Clock className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          <span>{seeding ? 'Seeding...' : 'Seed Demo Data'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Providers" value={stats.total_providers.count} icon={Building2} color="bg-emerald-50 text-emerald-600" />
        <Card title="Active Loans" value={stats.total_active_loans.count} icon={Wallet} color="bg-blue-50 text-blue-600" />
        <Card title="Total Revenue" value={`Rs ${(stats.total_revenue.total || 0).toLocaleString()}`} icon={DollarSign} color="bg-indigo-50 text-indigo-600" />
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200">
        <div className="max-w-lg">
          <h2 className="text-3xl font-black mb-3">Welcome Back, Administrator</h2>
          <p className="text-indigo-100 text-base mb-8 leading-relaxed opacity-90">
            Manage your network of loan providers, monitor global metrics, and ensure system stability from this central dashboard.
          </p>
          <div className="flex flex-wrap gap-3">
             <button onClick={() => navigate('/providers')} className="bg-white text-indigo-900 px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-900/20 hover:bg-indigo-50 transition-all active:scale-95">Manage Providers</button>
             <button className="bg-indigo-500/30 text-white border border-indigo-400/50 px-8 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-500/50 transition-all active:scale-95">System Logs</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoanTypeManagement = () => {
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termUnit, setTermUnit] = useState<'day' | 'month'>('month');
  const [lateFeeUnit, setLateFeeUnit] = useState<'day' | 'year'>('day');
  const { token } = useAuth();

  const fetchLoanTypes = () => api.get('/api/admin/loan-types', token).then(setLoanTypes).catch(() => setLoanTypes([]));
  useEffect(() => { fetchLoanTypes(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const body = {
      name: formData.get('name'),
      term_value: Number(formData.get('term_value')),
      term_unit: termUnit,
      interest_rate: Number(formData.get('interest_rate')),
      late_fee_value: Number(formData.get('late_fee_value')),
      late_fee_unit: lateFeeUnit,
      late_fee_rate: Number(formData.get('late_fee_rate')),
    };
    try {
      await api.post('/api/admin/loan-types', body, token);
      toast.success('Loan type created!');
      setIsModalOpen(false);
      e.target.reset();
      setTermUnit('month');
      setLateFeeUnit('day');
      fetchLoanTypes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating loan type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Loan Types</h1>
          <p className="text-slate-500 text-sm">Global loan policies available for providers</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
          <Plus className="w-4 h-4" />
          <span>New Loan Type</span>
        </button>
      </div>

      <div className="grid gap-4">
        {loanTypes.map((lt) => (
          <div key={lt.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{lt.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loan Type #{lt.id}</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Active</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Term</p>
                <p className="font-bold text-slate-800">{lt.term_value} {lt.term_unit}{lt.term_value !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Interest Rate</p>
                <p className="font-bold text-emerald-600">{lt.interest_rate}%</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Late Fee</p>
                <p className="font-bold text-red-500">{lt.late_fee_rate}% / {lt.late_fee_value} {lt.late_fee_unit}{lt.late_fee_value !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        ))}
        {loanTypes.length === 0 && (
          <EmptyState
            icon={Layers}
            title="No loan types defined"
            description="Create your first loan type to allow providers to configure their loan policies."
            action={<button onClick={() => setIsModalOpen(true)} className="text-emerald-600 font-bold border-b-2 border-emerald-600 pb-0.5">Create Loan Type</button>}
          />
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black">New Loan Type</h2>
                  <p className="text-slate-500 text-sm mt-0.5">Define the loan policy structure</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Loan Type Name</label>
                  <input name="name" placeholder="e.g. Personal Short-Term Loan" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
                </div>

                {/* Term */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Loan Term</label>
                  <div className="flex gap-3">
                    <input name="term_value" type="number" min="1" placeholder="12" className="flex-1 p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-bold" required />
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                      <button type="button" onClick={() => setTermUnit('day')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${termUnit === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Day</button>
                      <button type="button" onClick={() => setTermUnit('month')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${termUnit === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Month</button>
                    </div>
                  </div>
                </div>

                {/* Interest Rate */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Interest Rate</label>
                  <div className="relative">
                    <input name="interest_rate" type="number" min="0" step="0.01" placeholder="10.5" className="w-full p-4 pr-12 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-bold" required />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">%</span>
                  </div>
                </div>

                {/* Late Fee */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Late Payment Fee</label>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-center">
                      <span className="text-sm text-slate-500 font-medium shrink-0">Per</span>
                      <input name="late_fee_value" type="number" min="1" placeholder="1" className="flex-1 p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-bold" required />
                      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                        <button type="button" onClick={() => setLateFeeUnit('day')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${lateFeeUnit === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Day</button>
                        <button type="button" onClick={() => setLateFeeUnit('year')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${lateFeeUnit === 'year' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Year</button>
                      </div>
                    </div>
                    <div className="relative">
                      <input name="late_fee_rate" type="number" min="0" step="0.01" placeholder="2.5" className="w-full p-4 pr-12 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-red-400 transition-all font-bold" required />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">%</span>
                    </div>
                  </div>
                </div>

                <button disabled={loading} className="w-full bg-emerald-600 text-white font-bold p-5 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Loan Type'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProviderManagement = () => {
  const [providers, setProviders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchProviders = () => api.get('/api/admin/providers', token).then(setProviders);
  useEffect(() => { fetchProviders(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());
    try {
      await api.post('/api/admin/providers', body, token);
      toast.success('Provider added successfully!');
      setIsModalOpen(false);
      fetchProviders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error adding provider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Loan Providers</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-emerald-100">
          <Plus className="w-4 h-4" />
          <span>Register Provider</span>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Company Name</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {providers.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-400">00{p.id}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {providers.length === 0 && (
           <EmptyState icon={Building2} title="No providers" description="You have no loan providers registered in the system yet." action={<button onClick={() => setIsModalOpen(true)} className="text-emerald-600 font-bold border-b-2 border-emerald-600">Add First Provider</button>} />
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black">Register Provider</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Company Details</label>
                  <input name="name" placeholder="Company Full Legal Name" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Admin Account</label>
                  <div className="space-y-3">
                    <input name="admin_name" placeholder="Admin Full Name" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
                    <input name="email" type="email" placeholder="Admin Official Email" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
                    <input name="password" type="password" placeholder="Initial Admin Password" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
                  </div>
                </div>
                <button disabled={loading} className="w-full bg-emerald-600 text-white font-bold p-5 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'Provisioning...' : 'Provision Infrastructure'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Provider Dashboard & Related ---

const ProviderDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/provider/stats', token).then(setStats);
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-64"><Clock className="animate-spin text-emerald-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Performance metrics and operations</p>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => navigate('/customers')} className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
          <button onClick={() => navigate('/loans')} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
            <Plus className="w-4 h-4" />
            <span>Create Loan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Active Loans" value={stats.active_loans.count} icon={Wallet} color="bg-emerald-50 text-emerald-600" trend={12} />
        <Card title="Total Customers" value={stats.total_customers.count} icon={Users} color="bg-purple-50 text-purple-600" trend={5} />
        <Card title="Pending Review" value={stats.pending_collections.count} icon={Clock} color="bg-orange-50 text-orange-600" />
        <Card title="Total Balance" value={`Rs ${(stats.total_balance.total || 0).toLocaleString()}`} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-lg">Ongoing Collections</h2>
              <button className="text-emerald-600 text-sm font-bold hover:underline">View All</button>
            </div>
            <div className="divide-y divide-slate-50">
               {[1,2,3].map((i) => (
                 <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400">JD</div>
                      <div>
                        <p className="font-bold text-sm">John Doe</p>
                        <p className="text-xs text-slate-500">Loan #{1000 + i}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-sm">Rs 450.00</p>
                       <p className="text-[10px] text-orange-500 font-bold uppercase tracking-tighter">Due Today</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl shadow-slate-200">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Monthly Goal
            </h3>
            <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-xs mb-1.5 opacity-60">
                   <span>Collections</span>
                   <span>75%</span>
                 </div>
                 <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-400 rounded-full" style={{ width: '75%' }}></div>
                 </div>
               </div>
               <p className="text-xs text-slate-400 leading-relaxed">
                 You are Rs 24k away from your monthly target. 12 payments pending verification.
               </p>
               <button onClick={() => navigate('/approvals')} className="w-full bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-sm font-bold transition-colors">
                 Go to Approvals
               </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
             <h3 className="font-bold mb-4">Collectors</h3>
             <div className="space-y-4">
                {[1,2].map(i => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer">
                       <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">C{i}</div>
                       <span className="text-sm font-medium">Mike Collector</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">92%</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerLoans, setCustomerLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchCustomers = () => api.get('/api/provider/customers', token).then(setCustomers);
  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomerDetails = async (customer: any) => {
    setSelectedCustomer(customer);
    try {
      const loans = await api.get(`/api/provider/loans/customer/${customer.id}`, token);
      setCustomerLoans(loans);
    } catch {
      setCustomerLoans([]);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());
    try {
      await api.post('/api/provider/customers', body, token);
      toast.success('Customer added!');
      setIsModalOpen(false);
      fetchCustomers();
    } catch {
      toast.error('Error adding customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-emerald-100">
          <Plus className="w-4 h-4" />
          <span>Add New</span>
        </button>
      </div>

      <div className="grid gap-4">
        {customers.map((c: any) => (
          <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-emerald-200 transition-colors cursor-pointer group" onClick={() => fetchCustomerDetails(c)}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 font-bold group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                {c.name[0]}
              </div>
              <div>
                <p className="font-bold text-slate-900">{c.name}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1"><FileBadge className="w-3 h-3" /> {c.nic}</span>
                  <span className="flex items-center gap-1 italic">{c.address}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Active</span>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <EmptyState 
            icon={Users} 
            title="No customers yet" 
            description="Start by registering your first loan customer to manage their portfolio."
            action={<button onClick={() => setIsModalOpen(true)} className="text-emerald-600 font-bold border-b-2 border-emerald-600 pb-0.5">Register Customer</button>}
          />
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">New Customer</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <input name="name" placeholder="Full Name" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" required />
                <input name="email" type="email" placeholder="Email Address" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" required />
                <input name="nic" placeholder="NIC Number" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" required />
                <input name="address" placeholder="Residential Address" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" required />
                <button disabled={loading} className="w-full bg-emerald-600 text-white font-bold p-4 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'Processing...' : 'Register Customer'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl p-8 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded-2xl text-2xl font-bold text-slate-400">
                      {selectedCustomer.name[0]}
                   </div>
                   <div>
                      <h2 className="text-2xl font-black">{selectedCustomer.name}</h2>
                      <p className="text-sm text-slate-500">{selectedCustomer.email}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">NIC Number</p>
                    <p className="font-bold">{selectedCustomer.nic}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Address</p>
                    <p className="font-bold truncate">{selectedCustomer.address}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <h3 className="font-bold flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    Loan Portfolio
                 </h3>
                 <div className="space-y-3">
                    {customerLoans.map((l) => (
                      <div key={l.id} className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between">
                         <div>
                            <p className="font-bold text-sm">Rs {l.amount.toLocaleString()} + {l.interest_rate}% Interest</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Status: {l.status}</p>
                         </div>
                         <div className="text-right">
                            <p className="font-black text-slate-900">Rs {l.balance.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-black">Remaining</p>
                         </div>
                      </div>
                    ))}
                    {customerLoans.length === 0 && <p className="text-center py-8 text-slate-400 text-sm font-medium">No loans issued to this customer.</p>}
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LoanCreation = () => {
  const [customers, setCustomers] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nicQuery, setNicQuery] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/provider/collectors', token).then(setCollectors);
    api.get('/api/provider/customers', token).then(setCustomers);
  }, []);

  const handleNICSearch = async () => {
    if (!nicQuery) return;
    try {
      const customer = await api.get(`/api/provider/customers/nic/${nicQuery}`, token);
      setFoundCustomer(customer);
      toast.success('Customer found!');
    } catch {
      toast.error('Customer not found with this NIC');
      setFoundCustomer(null);
    }
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());
    try {
      await api.post('/api/provider/loans', body, token);
      toast.success('Loan created successfully!');
      navigate('/');
    } catch {
      toast.error('Failed to create loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
         <h1 className="text-3xl font-bold">New Loan Agreement</h1>
         <p className="text-slate-500 mt-2">Initialize a new financial contract</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-3">
         <Search className="w-5 h-5 text-slate-400" />
         <input 
          placeholder="Lookup Customer by NIC..." 
          className="flex-1 outline-none text-sm font-medium"
          value={nicQuery}
          onChange={(e) => setNicQuery(e.target.value)}
        />
         <button onClick={handleNICSearch} className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">Search</button>
      </div>

      {foundCustomer && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
           <div>
             <p className="font-bold text-emerald-900">{foundCustomer.name}</p>
             <p className="text-xs text-emerald-600 font-medium">Active Loans: {foundCustomer.active_loans}</p>
           </div>
           <div className="text-right">
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">Verified Customer</p>
           </div>
        </motion.div>
      )}

      <form onSubmit={handleCreate} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Borrower</label>
          <select name="customer_id" defaultValue={foundCustomer?.id || ''} className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium appearance-none" required>
            <option value="">Select a borrower...</option>
            {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.nic})</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Assigned Collector</label>
          <select name="collector_id" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium appearance-none" required>
            <option value="">Select a collector...</option>
            {collectors.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Principal Amount</label>
            <input name="amount" type="number" placeholder="5000" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-bold" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Interest Rate (%)</label>
            <input name="interest_rate" type="number" placeholder="10" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-bold" required />
          </div>
        </div>

        <button disabled={loading} className="w-full bg-slate-900 text-white font-bold p-5 rounded-2xl shadow-xl shadow-slate-300 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50">
          {loading ? 'Processing...' : 'Issue Loan Contract'}
        </button>
      </form>
    </div>
  );
};

const PaymentApprovals = () => {
  const [payments, setPayments] = useState([]);
  const { token } = useAuth();

  const fetchPayments = () => api.get('/api/provider/pending-payments', token).then(setPayments);
  useEffect(() => { fetchPayments(); }, []);

  const handleAction = async (payment_id: number, status: string) => {
    try {
      await api.post('/api/provider/approve-payment', { payment_id, status }, token);
      toast.success(`Payment ${status}`);
      fetchPayments();
    } catch {
      toast.error('Error updating payment');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pending Verifications</h1>
      <div className="grid gap-4">
        {payments.map((p: any) => (
          <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-slate-400" />
              </div>
              <div>
                <p className="font-bold text-lg">Rs {p.amount.toLocaleString()}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1">
                  <span className="flex items-center gap-1 text-slate-500 font-medium"><Users className="w-3.5 h-3.5" /> {p.customer_name}</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold"><PieChart className="w-3.5 h-3.5" /> via {p.collector_name}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <button onClick={() => handleAction(p.id, 'rejected')} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-colors">Reject</button>
               <button onClick={() => handleAction(p.id, 'approved')} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">Approve</button>
            </div>
          </div>
        ))}
        {payments.length === 0 && (
          <EmptyState 
            icon={CheckCircle2} 
            title="All caught up" 
            description="You have no pending collection approvals at this time."
          />
        )}
      </div>
    </div>
  );
};

const CollectorManagement = () => {
  const [collectors, setCollectors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetch = () => api.get('/api/provider/collectors', token).then(setCollectors);
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());
    try {
      await api.post('/api/provider/collectors', body, token);
      toast.success('Collector added!');
      setIsModalOpen(false);
      fetch();
    } catch {
      toast.error('Error adding collector');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collectors</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-emerald-100">
          <Plus className="w-4 h-4" />
          <span>New Collector</span>
        </button>
      </div>

      <div className="grid gap-4">
        {collectors.map((c: any) => (
          <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-xl font-bold text-slate-400">
                {c.name[0]}
              </div>
              <div>
                <p className="font-bold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500 font-medium">{c.email}</p>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Staff</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">New Field Collector</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <input name="name" placeholder="Full Name" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
                <input name="email" type="email" placeholder="Work Email" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
                <input name="password" type="password" placeholder="Default Password" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
                <button disabled={loading} className="w-full bg-emerald-600 text-white font-bold p-4 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'Adding...' : 'Register Collector'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProviderPolicies = () => {
  const [allLoanTypes, setAllLoanTypes] = useState<LoanType[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [toggling, setToggling] = useState<number | null>(null);
  const { token } = useAuth();

  const fetchData = async () => {
    try {
      const [all, assigned] = await Promise.all([
        api.get('/api/provider/loan-types', token),
        api.get('/api/provider/policies', token),
      ]);
      setAllLoanTypes(all);
      setAssignedIds(new Set((assigned as any[]).map((p: any) => p.loan_type_id ?? p.id)));
    } catch {
      setAllLoanTypes([]);
      setAssignedIds(new Set());
    }
  };

  useEffect(() => { fetchData(); }, []);

  const togglePolicy = async (loanTypeId: number, assigned: boolean) => {
    setToggling(loanTypeId);
    try {
      if (assigned) {
        await api.post('/api/provider/policies/remove', { loan_type_id: loanTypeId }, token);
        toast.success('Policy removed');
      } else {
        await api.post('/api/provider/policies', { loan_type_id: loanTypeId }, token);
        toast.success('Policy assigned!');
      }
      await fetchData();
    } catch {
      toast.error('Failed to update policy');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Loan Policies</h1>
        <p className="text-slate-500 text-sm mt-1">Enable loan types that your company will offer to customers</p>
      </div>

      <div className="grid gap-4">
        {allLoanTypes.map((lt) => {
          const isAssigned = assignedIds.has(lt.id);
          return (
            <div key={lt.id} className={`bg-white p-6 rounded-2xl border-2 shadow-sm transition-all ${isAssigned ? 'border-emerald-300 shadow-emerald-50' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isAssigned ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                    <BookOpen className={`w-5 h-5 ${isAssigned ? 'text-emerald-500' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{lt.name}</h3>
                    {isAssigned && <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Enabled</span>}
                  </div>
                </div>
                <button
                  onClick={() => togglePolicy(lt.id, isAssigned)}
                  disabled={toggling === lt.id}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 shrink-0 ${
                    isAssigned
                      ? 'bg-red-50 text-red-500 hover:bg-red-100'
                      : 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700'
                  }`}
                >
                  {toggling === lt.id ? <Clock className="w-4 h-4 animate-spin" /> : isAssigned ? 'Remove' : 'Assign'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Term</p>
                  <p className="font-bold text-slate-800 text-sm">{lt.term_value} {lt.term_unit}{lt.term_value !== 1 ? 's' : ''}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Interest</p>
                  <p className="font-bold text-emerald-600 text-sm">{lt.interest_rate}%</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Late Fee</p>
                  <p className="font-bold text-red-500 text-sm">{lt.late_fee_rate}% / {lt.late_fee_value} {lt.late_fee_unit}{lt.late_fee_value !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          );
        })}
        {allLoanTypes.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title="No loan types available"
            description="The system administrator hasn't created any loan types yet. Contact your administrator."
          />
        )}
      </div>
    </div>
  );
};

// --- Customer Feature ---

const CustomerDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/customer/stats', token).then(setStats);
    api.get('/api/customer/loans', token).then(setLoans);
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-64"><Clock className="animate-spin text-emerald-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] mb-2">Total Outstanding</p>
          <h1 className="text-5xl font-black mb-6">Rs {(stats.total_balance.total || 0).toLocaleString()}</h1>
          <div className="flex gap-4">
             <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                <p className="text-[10px] opacity-60 uppercase font-black">Active Loans</p>
                <p className="font-bold">{stats.active_loans.count}</p>
             </div>
             <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                <p className="text-[10px] opacity-60 uppercase font-black">Settled</p>
                <p className="font-bold">{stats.settled_loans.count}</p>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-500" />
          Active Loans
        </h2>
        <div className="grid gap-4">
          {loans.filter(l => l.status === 'active').map(loan => {
            const paid = loan.total_repayable - loan.balance;
            const percentage = Math.round((paid / loan.total_repayable) * 100);
            
            return (
              <div key={loan.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-lg">{loan.company_name}</h3>
                    <p className="text-xs text-slate-500">Loan ID: #LN{1000 + loan.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">Rs {loan.balance.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Balance</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">{percentage}% Repaid</span>
                    <span className="text-emerald-600">Rs {paid.toLocaleString()} / Rs {loan.total_repayable.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5" />
                      Issued {format(new Date(loan.created_at), 'MMM dd, yyyy')}
                   </div>
                   <button onClick={() => navigate('/history')} className="text-emerald-600 font-bold text-xs hover:underline">Payment Details</button>
                </div>
              </div>
            );
          })}
          {loans.filter(l => l.status === 'active').length === 0 && (
            <EmptyState icon={Wallet} title="No active loans" description="You don't have any open loan contracts at the moment." />
          )}
        </div>
      </div>
    </div>
  );
};

const CustomerHistory = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    api.get('/api/customer/payments', token).then(setPayments);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Repayment History</h1>
        <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase">
          {payments.length} Transactions
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          {payments.map((p) => (
            <div key={p.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  p.status === 'approved' ? 'bg-emerald-50 text-emerald-500' : 
                  p.status === 'pending' ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'
                }`}>
                  {p.status === 'approved' ? <CheckCircle2 className="w-6 h-6" /> : 
                   p.status === 'pending' ? <Clock className="w-6 h-6" /> : <X className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold text-slate-900">Rs {p.amount.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{format(new Date(p.created_at), 'MMM dd, yyyy • hh:mm a')}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                  p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
          {payments.length === 0 && (
            <div className="p-20 text-center text-slate-400 font-bold">
              No payment activities yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Collector Feature ---

const CollectorDashboard = () => {
  const [collections, setCollections] = useState([]);
  const { token } = useAuth();
  const [showPayModal, setShowPayModal] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const fetch = () => api.get('/api/collector/collections', token).then(setCollections);
  useEffect(() => { fetch(); }, []);

  const handlePay = async () => {
    if (!showPayModal || !payAmount) return;
    try {
      await api.post('/api/collector/payments', { loan_id: showPayModal, amount: parseFloat(payAmount), proof_url: 'dummy_url' }, token);
      toast.success('Submitted for approval!');
      setShowPayModal(null);
      setPayAmount('');
      fetch();
    } catch {
      toast.error('Submission failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-emerald-600 p-8 rounded-[2rem] text-white shadow-2xl shadow-emerald-200">
         <p className="text-emerald-100 font-medium mb-1">Today's Target</p>
         <h1 className="text-4xl font-black">Rs 45,200</h1>
         <div className="flex items-center justify-between mt-6 pt-6 border-t border-emerald-500/30">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Pending</span>
              <span className="font-bold">{collections.length} Borrowers</span>
            </div>
            <div className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-bold">
               8:00 AM - 5:00 PM
            </div>
         </div>
      </div>

      <div className="space-y-4">
        {collections.map((c: any) => (
          <div key={c.loan_id} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer" onClick={() => setShowPayModal(c.loan_id)}>
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-xl font-bold text-slate-400">{c.customer_name[0]}</div>
               <div>
                  <p className="font-bold text-slate-900">{c.customer_name}</p>
                  <p className="text-xs text-slate-500 font-medium">Due: Rs {c.balance.toLocaleString()}</p>
               </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-full">
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:p-4">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white w-full max-w-md p-8 rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl">
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 sm:hidden"></div>
              <h2 className="text-2xl font-black mb-1">Confirm Collection</h2>
              <p className="text-slate-500 text-sm mb-8 font-medium">Enter the actual amount received from customer</p>
              
              <div className="space-y-6">
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">Rs</span>
                  <input autoFocus type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" className="w-full text-4xl p-6 pl-12 bg-slate-50 rounded-3xl outline-none font-black text-slate-900 border-2 border-transparent focus:border-emerald-500 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => setShowPayModal(null)} className="py-5 rounded-2xl font-bold bg-slate-100 text-slate-500 transition-colors">Cancel</button>
                   <button onClick={handlePay} className="py-5 rounded-2xl font-bold bg-emerald-600 text-white shadow-xl shadow-emerald-100">Submit</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CollectorHistory = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    // We can reuse the provider's stats or a specific collector history route
    // For now let's assume we want to see payments collected by this specific user
    api.get('/api/collector/history', token).then(setPayments);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Collection History</h1>
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {payments.map((p: any) => (
              <tr key={p.id}>
                <td className="px-6 py-4 font-bold">{p.customer_name}</td>
                <td className="px-6 py-4 text-right font-black">Rs {p.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                    p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main Router ---

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const login = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ className: 'font-sans font-bold py-3 px-5 rounded-xl shadow-2xl' }} />
        <Routes>
          {!token ? (
            <Route path="*" element={<Login />} />
          ) : (
            <Route path="*" element={
              <Layout>
                <Routes>
                  {user?.role === 'SUPER_ADMIN' && (
                    <>
                      <Route path="/" element={<SuperAdminDashboard />} />
                      <Route path="/providers" element={<ProviderManagement />} />
                      <Route path="/loan-types" element={<LoanTypeManagement />} />
                    </>
                  )}
                  {user?.role === 'PROVIDER' && (
                    <>
                      <Route path="/" element={<ProviderDashboard />} />
                      <Route path="/customers" element={<CustomerManagement />} />
                      <Route path="/loans" element={<LoanCreation />} />
                      <Route path="/approvals" element={<PaymentApprovals />} />
                      <Route path="/collectors" element={<CollectorManagement />} />
                      <Route path="/policies" element={<ProviderPolicies />} />
                    </>
                  )}
                  {user?.role === 'COLLECTOR' && (
                    <>
                      <Route path="/" element={<CollectorDashboard />} />
                      <Route path="/history" element={<CollectorHistory />} />
                    </>
                  )}
                  {user?.role === 'CUSTOMER' && (
                    <>
                      <Route path="/" element={<CustomerDashboard />} />
                      <Route path="/history" element={<CustomerHistory />} />
                    </>
                  )}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            } />
          )}
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
