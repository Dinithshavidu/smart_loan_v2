import { useState, useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';
import { CheckCircle2, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { rootRoute } from './__root';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

// --- Collector History ---

const CollectorHistory = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const { token } = useAuth();

  useEffect(() => {
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

// --- Customer History ---

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

// --- History Route (role-based) ---

function HistoryPage() {
  const { user } = useAuth();
  if (user?.role === 'COLLECTOR') return <CollectorHistory />;
  if (user?.role === 'CUSTOMER') return <CustomerHistory />;
  return null;
}

export const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryPage,
});
