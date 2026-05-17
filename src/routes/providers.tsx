import { useState, useEffect } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, Lock, Plus, Power, Users, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { rootRoute } from './__root';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { EmptyState } from '../components/shared-ui';

type Company = {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  provider_count: number;
  collector_count: number;
  customer_count: number;
  total_user_count: number;
};

type ProviderUser = {
  id: number;
  name: string;
  email: string;
  role: 'PROVIDER';
  company_id: number | null;
  company_name?: string | null;
  status: 'active' | 'inactive';
};

type CompanyUser = {
  id: number;
  company_id: number | null;
  name: string;
  email: string;
  role: 'PROVIDER' | 'COLLECTOR' | 'CUSTOMER' | 'SUPER_ADMIN';
  status: 'active' | 'inactive';
  nic?: string | null;
  address?: string | null;
};

const ProviderManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [providers, setProviders] = useState<ProviderUser[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);

  const [isCreateProviderModalOpen, setIsCreateProviderModalOpen] = useState(false);
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'PROVIDER' | 'COLLECTOR' | 'CUSTOMER'>('ALL');

  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [providerFormError, setProviderFormError] = useState('');
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const fetchBaseData = async () => {
    try {
      const [companiesData, providersData] = await Promise.all([
        api.get('/api/admin/companies', token),
        api.get('/api/admin/users/providers', token),
      ]);
      setCompanies(companiesData);
      setProviders(providersData);
    } catch {
      toast.error('Failed to load admin data');
    }
  };

  const fetchCompanyUsers = async (companyId: number, role: 'ALL' | 'PROVIDER' | 'COLLECTOR' | 'CUSTOMER' = 'ALL') => {
    setDetailsLoading(true);
    setSelectedCompanyId(companyId);
    setSelectedRoleFilter(role);

    try {
      const suffix = role === 'ALL' ? '' : `?role=${role}`;
      const users = await api.get(`/api/admin/companies/${companyId}/users${suffix}`, token);
      setCompanyUsers(users);
    } catch {
      setCompanyUsers([]);
      toast.error('Failed to load company users');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') {
      navigate({ to: '/' });
      return;
    }
    fetchBaseData();
  }, [user?.role]);

  const handleCreateProvider = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());
    if (!body.company_id) {
      setProviderFormError('Please select a company.');
      return;
    }
    setProviderFormError('');
    setLoading(true);
    try {
      await api.post('/api/admin/providers', body, token);
      toast.success('Provider registered successfully!');
      setIsCreateProviderModalOpen(false);
      e.target.reset();
      await fetchBaseData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error registering provider');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const name = formData.get('company_name');

    try {
      await api.post('/api/admin/companies', { name }, token);
      toast.success('Company created successfully');
      setIsCreateCompanyModalOpen(false);
      e.target.reset();
      await fetchBaseData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyStatusChange = async (companyId: number, nextAction: 'activate' | 'deactivate') => {
    try {
      await api.post(`/api/admin/companies/${companyId}/${nextAction}`, {}, token);
      toast.success(nextAction === 'deactivate' ? 'Company and related users deactivated' : 'Company activated');
      await fetchBaseData();
      if (selectedCompanyId === companyId) {
        await fetchCompanyUsers(companyId, selectedRoleFilter);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update company status');
    }
  };



  const handleResetPassword = async (e: any) => {
    e.preventDefault();
    if (!selectedUser) {
      return;
    }

    setLoading(true);
    const formData = new FormData(e.target);
    const newPassword = formData.get('new_password');

    try {
      await api.post(`/api/admin/users/${selectedUser.id}/reset-password`, { new_password: newPassword }, token);
      toast.success(`Password reset for ${selectedUser.name}`);
      setIsResetPasswordModalOpen(false);
      setSelectedUser(null);
      e.target.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const activeCompany = companies.find((company) => company.id === selectedCompanyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Company & Provider Management</h1>
          <p className="text-slate-500 text-sm mt-1">Create or deactivate companies, allocate providers, and manage user access.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsCreateCompanyModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-indigo-100">
            <Plus className="w-4 h-4" />
            <span>New Company</span>
          </button>
          <button onClick={() => setIsCreateProviderModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-emerald-100">
            <Plus className="w-4 h-4" />
            <span>Register Provider</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Company Name</th>
              <th className="px-6 py-4">Providers</th>
              <th className="px-6 py-4">Collectors</th>
              <th className="px-6 py-4">Customers</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-400">00{company.id}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{company.name}</td>
                <td className="px-6 py-4">{company.provider_count}</td>
                <td className="px-6 py-4">{company.collector_count}</td>
                <td className="px-6 py-4">{company.customer_count}</td>
                <td className="px-6 py-4">
                  {company.status === 'active' ? (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Active</span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchCompanyUsers(company.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                    >
                      View Users
                    </button>
                    {company.status === 'active' ? (
                      <button
                        onClick={() => handleCompanyStatusChange(company.id, 'deactivate')}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCompanyStatusChange(company.id, 'activate')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {companies.length === 0 && (
          <EmptyState
            icon={Building2}
            title="No companies"
            description="Create your first company to start onboarding providers and users."
            action={<button onClick={() => setIsCreateCompanyModalOpen(true)} className="text-indigo-600 font-bold border-b-2 border-indigo-600">Add First Company</button>}
          />
        )}
      </div>

      {selectedCompanyId && (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Company Details: {activeCompany?.name}</h2>
              <p className="text-slate-500 text-sm">View providers, collectors, and users. Reset passwords when needed.</p>
            </div>
            <div className="flex items-center gap-2">
              {(['ALL', 'PROVIDER', 'COLLECTOR', 'CUSTOMER'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => fetchCompanyUsers(selectedCompanyId, role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    selectedRoleFilter === role ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {detailsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading users...</td>
                  </tr>
                ) : (
                  companyUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{user.name}</td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3 text-slate-600">{user.role}</td>
                      <td className="px-4 py-3">
                        {user.status === 'active' ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Active</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsResetPasswordModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100"
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {!detailsLoading && companyUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No users found for this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isCreateProviderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black">Register Provider</h2>
                <button onClick={() => { setIsCreateProviderModalOpen(false); setProviderFormError(''); }} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleCreateProvider} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Company</label>
                  <div>
                    <select
                      name="company_id"
                      onChange={() => { if (providerFormError) setProviderFormError(''); }}
                      defaultValue=""
                      className={`w-full p-4 bg-slate-50 rounded-xl outline-none border transition-all font-medium ${
                        providerFormError ? 'border-red-400 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'
                      }`}
                    >
                      <option value="">Select company *</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                    {providerFormError && (
                      <p className="text-red-500 text-xs font-semibold mt-1.5">{providerFormError}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Provider Account</label>
                  <div className="space-y-3">
                    <input name="admin_name" placeholder="Full Name" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" />
                    <input name="email" type="email" placeholder="Email *" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
                    <input name="password" type="password" placeholder="Initial Password *" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-emerald-500 transition-all font-medium" required />
                  </div>
                </div>
                <button disabled={loading} className="w-full bg-emerald-600 text-white font-bold p-5 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'Registering...' : 'Register Provider'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreateCompanyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black">Create Company</h2>
                <button onClick={() => setIsCreateCompanyModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleCreateCompany} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Company Name</label>
                  <input name="company_name" placeholder="Company Full Legal Name" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-indigo-500 transition-all font-medium" required />
                </div>
                <button disabled={loading} className="w-full bg-indigo-600 text-white font-bold p-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Company'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isResetPasswordModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black">Reset Password</h2>
                  <p className="text-slate-500 text-sm mt-1">{selectedUser.name} ({selectedUser.role})</p>
                </div>
                <button onClick={() => setIsResetPasswordModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">New Password</label>
                  <input name="new_password" type="password" minLength={6} placeholder="Enter new password" className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-amber-500 transition-all font-medium" required />
                </div>
                <button disabled={loading} className="w-full bg-amber-500 text-white font-bold p-5 rounded-2xl shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'Resetting...' : 'Reset Password'}
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
