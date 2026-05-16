import { useState, useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { rootRoute } from './__root';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { EmptyState } from '../components/shared-ui';

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

export const providersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/providers',
  component: ProviderManagement,
});
