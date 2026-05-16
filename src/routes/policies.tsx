import { useState, useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';
import { BookOpen, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { rootRoute } from './__root';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { EmptyState } from '../components/shared-ui';
import type { LoanType } from '../types';

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

export const policiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/policies',
  component: ProviderPolicies,
});
