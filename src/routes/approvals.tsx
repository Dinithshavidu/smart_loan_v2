import { useState, useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';
import { CreditCard, Users, PieChart, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { rootRoute } from './__root';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { EmptyState } from '../components/shared-ui';

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

export const approvalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/approvals',
  component: PaymentApprovals,
});
