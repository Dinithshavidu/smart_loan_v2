import { useState, useEffect } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Clock, Search, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { rootRoute } from './__root';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import type { LoanType } from '../types';

const LoanCreation = () => {
  const [collectors, setCollectors] = useState<any[]>([]);
  const [assignedLoanTypes, setAssignedLoanTypes] = useState<LoanType[]>([]);
  const [nicQuery, setNicQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [phase, setPhase] = useState<'search' | 'register' | 'loan'>('search');
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loanLoading, setLoanLoading] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/provider/collectors', token).then(setCollectors).catch(() => {});
    api.get('/api/provider/assigned-loan-types', token).then(setAssignedLoanTypes).catch(() => {});
  }, []);

  const handleNICSearch = async () => {
    if (!nicQuery.trim()) return;
    setSearching(true);
    try {
      const customer = await api.get(`/api/provider/customers/nic/${nicQuery.trim()}`, token);
      setFoundCustomer(customer);
      setPhase('loan');
      toast.success('Customer found!');
    } catch {
      setFoundCustomer(null);
      setPhase('register');
    } finally {
      setSearching(false);
    }
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setRegisterLoading(true);
    const formData = new FormData(e.target);
    const body: any = Object.fromEntries(formData.entries());
    if (!body.nic) body.nic = nicQuery.trim();
    try {
      await api.post('/api/provider/customers', body, token);
      const customer = await api.get(`/api/provider/customers/nic/${body.nic}`, token);
      setFoundCustomer(customer);
      toast.success('Customer registered!');
      setPhase('loan');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    if (!selectedLoanType) { toast.error('Please select a loan type'); return; }
    setLoanLoading(true);
    const formData = new FormData(e.target);
    const body: any = Object.fromEntries(formData.entries());
    body.customer_id = foundCustomer.id;
    body.interest_rate = selectedLoanType.interest_rate;
    body.loan_type_id = selectedLoanType.id;
    try {
      await api.post('/api/provider/loans', body, token);
      toast.success('Loan created successfully!');
      navigate({ to: '/' });
    } catch {
      toast.error('Failed to create loan');
    } finally {
      setLoanLoading(false);
    }
  };

  const reset = () => {
    setPhase('search');
    setNicQuery('');
    setFoundCustomer(null);
    setSelectedLoanType(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        {phase !== 'search' && (
          <button onClick={reset} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            <ArrowRight className="w-4 h-4 rotate-180 text-slate-600" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {phase === 'search' && 'New Loan Agreement'}
            {phase === 'register' && 'Register New Customer'}
            {phase === 'loan' && 'Issue Loan Contract'}
          </h1>
          <p className="text-slate-500 text-sm">
            {phase === 'search' && 'Look up borrower by NIC number'}
            {phase === 'register' && `NIC ${nicQuery} not found — register the customer first`}
            {phase === 'loan' && `Lending to ${foundCustomer?.name}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(['search', 'register', 'loan'] as const).map((s, i) => {
          const steps = phase === 'register'
            ? ['search', 'register', 'loan']
            : ['search', 'loan'];
          const idx = steps.indexOf(s);
          const currentIdx = steps.indexOf(phase);
          if (idx === -1) return null;
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && phase !== 'register' && s === 'loan' && <div className="w-8 h-px bg-slate-200" />}
              {i > 0 && phase === 'register' && <div className="w-8 h-px bg-slate-200" />}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                s === phase ? 'bg-emerald-600 text-white' : currentIdx > idx ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
              }`}>
                <span>{idx + 1}</span>
                <span className="capitalize">{s === 'search' ? 'Find' : s === 'register' ? 'Register' : 'Loan'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'search' && (
          <motion.div key="search" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                placeholder="Enter customer NIC number..."
                className="flex-1 outline-none text-sm font-medium placeholder:text-slate-300"
                value={nicQuery}
                onChange={(e) => setNicQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNICSearch()}
                autoFocus
              />
              <button
                onClick={handleNICSearch}
                disabled={searching || !nicQuery.trim()}
                className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                {searching ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center font-medium">
              If the NIC is not registered, you'll be prompted to add the customer first.
            </p>
          </motion.div>
        )}

        {phase === 'register' && (
          <motion.div key="register" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 text-sm">No customer found for NIC: <span className="font-mono">{nicQuery}</span></p>
                <p className="text-xs text-amber-700 mt-0.5">Fill in the details below to register them, then proceed to create the loan.</p>
              </div>
            </div>
            <form onSubmit={handleRegister} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100 space-y-4">
              <input name="name" placeholder="Full Name" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
              <input name="email" type="email" placeholder="Email Address" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
              <input name="nic" placeholder="NIC Number" defaultValue={nicQuery} className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
              <input name="address" placeholder="Residential Address" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
              <button disabled={registerLoading} className="w-full bg-emerald-600 text-white font-bold p-4 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
                {registerLoading ? 'Registering...' : 'Register & Continue to Loan →'}
              </button>
            </form>
          </motion.div>
        )}

        {phase === 'loan' && (
          <motion.div key="loan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center font-bold text-emerald-600">
                  {foundCustomer?.name?.[0]}
                </div>
                <div>
                  <p className="font-bold text-emerald-900">{foundCustomer?.name}</p>
                  <p className="text-xs text-emerald-600 font-medium">NIC: {foundCustomer?.nic} · Active Loans: {foundCustomer?.active_loans ?? 0}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-wider">Verified</span>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-700 mb-3 ml-1">Select Loan Type</p>
              {assignedLoanTypes.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-slate-400 text-sm font-medium">No loan types assigned to your account yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Contact the Super Admin to assign policies.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {assignedLoanTypes.map((lt) => (
                    <button
                      key={lt.id}
                      type="button"
                      onClick={() => setSelectedLoanType(lt)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                        selectedLoanType?.id === lt.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900">{lt.name}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedLoanType?.id === lt.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                        }`}>
                          {selectedLoanType?.id === lt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs font-bold">
                        <span className="text-slate-500">Term: <span className="text-slate-800">{lt.term_value} {lt.term_unit}{lt.term_value !== 1 ? 's' : ''}</span></span>
                        <span className="text-slate-500">Interest: <span className="text-emerald-600">{lt.interest_rate}%</span></span>
                        <span className="text-slate-500">Late fee: <span className="text-red-500">{lt.late_fee_rate}%/{lt.late_fee_value}{lt.late_fee_unit[0]}</span></span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedLoanType && (
              <motion.form
                key={selectedLoanType.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleCreate}
                className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 space-y-5"
              >
                <div className="p-4 bg-slate-50 rounded-2xl text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Loan Type</span>
                    <span className="font-bold">{selectedLoanType.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Interest Rate</span>
                    <span className="font-bold text-emerald-600">{selectedLoanType.interest_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Late Fee</span>
                    <span className="font-bold text-red-500">{selectedLoanType.late_fee_rate}% per {selectedLoanType.late_fee_value} {selectedLoanType.late_fee_unit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Assigned Collector</label>
                  <select name="collector_id" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium appearance-none" required>
                    <option value="">Select a collector...</option>
                    {collectors.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Principal Amount (Rs)</label>
                  <input name="amount" type="number" min="1" placeholder="50000" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-bold text-lg" required />
                </div>

                <button disabled={loanLoading} className="w-full bg-slate-900 text-white font-bold p-5 rounded-2xl shadow-xl shadow-slate-300 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50">
                  {loanLoading ? 'Processing...' : 'Issue Loan Contract'}
                </button>
              </motion.form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const loansRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/loans',
  component: LoanCreation,
});
