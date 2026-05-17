import { useState, useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, X, Wallet, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { rootRoute } from './__root';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { EmptyState } from '../components/shared-ui';

const CollectorManagement = () => {
  const [collectors, setCollectors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState<any>(null);
  const [collectorLoans, setCollectorLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchCollectors = () => api.get('/api/provider/collectors', token).then(setCollectors).catch(() => toast.error('Failed to load collectors'));
  useEffect(() => { fetchCollectors(); }, [token]);

  const fetchCollectorDetails = async (collector: any) => {
    setSelectedCollector(collector);
    try {
      const loans = await api.get(`/api/provider/loans/collector/${collector.id}`, token);
      setCollectorLoans(loans);
    } catch {
      setCollectorLoans([]);
      toast.error('Failed to load collector loans');
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());
    try {
      await api.post('/api/provider/collectors', body, token);
      toast.success('Collector added!');
      setIsModalOpen(false);
      e.target.reset();
      await fetchCollectors();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error adding collector');
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
          <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-emerald-200 transition-colors cursor-pointer group shadow-sm" onClick={() => { console.log('Clicking collector:', c); fetchCollectorDetails(c); }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 font-bold group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
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
        {collectors.length === 0 && (
          <EmptyState
            icon={Users}
            title="No collectors yet"
            description="Start by adding a field collector to manage loan collections."
            action={<button onClick={() => setIsModalOpen(true)} className="text-emerald-600 font-bold border-b-2 border-emerald-600">Add First Collector</button>}
          />
        )}
      </div>

      <AnimatePresence>
        {selectedCollector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl p-8 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded-2xl text-2xl font-bold text-slate-400">
                      {selectedCollector.name[0]}
                   </div>
                   <div>
                      <h2 className="text-2xl font-black">{selectedCollector.name}</h2>
                      <p className="text-sm text-slate-500">{selectedCollector.email}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedCollector(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>

              <div className="space-y-4">
                 <h3 className="font-bold flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    Assigned Loans
                 </h3>
                 <div className="space-y-3">
                    {collectorLoans.map((l) => (
                      <div key={l.id} className="p-4 border border-slate-200 rounded-2xl space-y-2">
                         <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-sm">{l.customer_name}</p>
                              <p className="text-xs text-slate-400 font-mono">NIC: {l.customer_nic}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${l.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>{l.status}</span>
                         </div>
                         <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Rs {l.amount.toLocaleString()} + {l.interest_rate}%</span>
                            <p className="font-black text-slate-900">Rs {l.balance.toLocaleString()} remaining</p>
                         </div>
                      </div>
                    ))}
                    {collectorLoans.length === 0 && <p className="text-center py-8 text-slate-400 text-sm font-medium">No loans assigned to this collector.</p>}
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

export const collectorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/collectors',
  component: CollectorManagement,
});
