import { useState, useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Layers, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { rootRoute } from './__root';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { EmptyState } from '../components/shared-ui';
import type { LoanType } from '../types';

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
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Loan Type Name</label>
                  <input name="name" placeholder="e.g. Personal Short-Term Loan" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
                </div>

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

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Interest Rate</label>
                  <div className="relative">
                    <input name="interest_rate" type="number" min="0" step="0.01" placeholder="10.5" className="w-full p-4 pr-12 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-bold" required />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">%</span>
                  </div>
                </div>

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

export const loanTypesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/loan-types',
  component: LoanTypeManagement,
});
