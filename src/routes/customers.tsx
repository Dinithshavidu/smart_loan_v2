import { useState, useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Users, Plus, X, ChevronRight, FileBadge, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { rootRoute } from './__root';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { EmptyState } from '../components/shared-ui';

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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error adding customer');
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
                <input name="email" type="email" placeholder="Email Address (optional)" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium" />
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

export const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/customers',
  component: CustomerManagement,
});
