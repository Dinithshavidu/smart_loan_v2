import { useState, useEffect } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  Clock, Building2, Wallet, DollarSign, Users, Plus,
  TrendingUp, UserPlus, ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { rootRoute } from './__root';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { Card, EmptyState } from '../components/shared-ui';

// --- Super Admin Dashboard ---

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
             <button onClick={() => navigate({ to: '/providers' })} className="bg-white text-indigo-900 px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-900/20 hover:bg-indigo-50 transition-all active:scale-95">Manage Providers</button>
             <button className="bg-indigo-500/30 text-white border border-indigo-400/50 px-8 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-500/50 transition-all active:scale-95">System Logs</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Provider Dashboard ---

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
           <button onClick={() => navigate({ to: '/customers' })} className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
          <button onClick={() => navigate({ to: '/loans' })} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
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
               <button onClick={() => navigate({ to: '/approvals' })} className="w-full bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-sm font-bold transition-colors">
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

// --- Collector Dashboard ---

const CollectorDashboard = () => {
  const [collections, setCollections] = useState([]);
  const { token } = useAuth();
  const [showPayModal, setShowPayModal] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const fetchCollections = () => api.get('/api/collector/collections', token).then(setCollections);
  useEffect(() => { fetchCollections(); }, []);

  const handlePay = async () => {
    if (!showPayModal || !payAmount) return;
    try {
      await api.post('/api/collector/payments', { loan_id: showPayModal, amount: parseFloat(payAmount), proof_url: 'dummy_url' }, token);
      toast.success('Submitted for approval!');
      setShowPayModal(null);
      setPayAmount('');
      fetchCollections();
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

// --- Customer Dashboard ---

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
                   <button onClick={() => navigate({ to: '/history' })} className="text-emerald-600 font-bold text-xs hover:underline">Payment Details</button>
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

// --- Index Route (role-based dashboard) ---

function IndexPage() {
  const { user } = useAuth();
  if (user?.role === 'SUPER_ADMIN') return <SuperAdminDashboard />;
  if (user?.role === 'PROVIDER') return <ProviderDashboard />;
  if (user?.role === 'COLLECTOR') return <CollectorDashboard />;
  if (user?.role === 'CUSTOMER') return <CustomerDashboard />;
  return null;
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});
