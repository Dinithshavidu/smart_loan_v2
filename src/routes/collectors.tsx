import { useState, useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { rootRoute } from './__root';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

const CollectorManagement = () => {
  const [collectors, setCollectors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchCollectors = () => api.get('/api/provider/collectors', token).then(setCollectors);
  useEffect(() => { fetchCollectors(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());
    try {
      await api.post('/api/provider/collectors', body, token);
      toast.success('Collector added!');
      setIsModalOpen(false);
      fetchCollectors();
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

export const collectorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/collectors',
  component: CollectorManagement,
});
