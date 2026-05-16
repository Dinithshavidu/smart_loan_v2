import { useState, useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, Clock, ChevronRight, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { rootRoute } from './__root';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import type { LoanType } from '../types';

const SuperAdminProviderPolicies = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [allLoanTypes, setAllLoanTypes] = useState<LoanType[]>([]);
  const [providerPolicies, setProviderPolicies] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedProvider, setExpandedProvider] = useState<number | null>(null);
  const [operationLoading, setOperationLoading] = useState<string>('');
  const { token } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [providersData, loanTypesData] = await Promise.all([
        api.get('/api/admin/providers', token),
        api.get('/api/admin/loan-types', token)
      ]);
      setProviders(providersData);
      setAllLoanTypes(loanTypesData);

      const policiesMap: Record<number, number[]> = {};
      for (const provider of providersData) {
        try {
          const policies = await api.get(`/api/admin/provider-policies/${provider.id}`, token);
          policiesMap[provider.id] = policies.map((p: any) => p.loan_type_id);
        } catch (err) {
          console.error(`Failed to fetch policies for provider ${provider.id}:`, err);
          policiesMap[provider.id] = [];
        }
      }
      setProviderPolicies(policiesMap);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleLoanType = async (providerId: number, loanTypeId: number, isAssigned: boolean) => {
    const key = `${providerId}-${loanTypeId}`;
    setOperationLoading(key);
    try {
      if (isAssigned) {
        await api.post('/api/admin/provider-policies/remove',
          { provider_id: providerId, loan_type_id: loanTypeId },
          token
        );
      } else {
        await api.post('/api/admin/provider-policies/assign',
          { provider_id: providerId, loan_type_id: loanTypeId },
          token
        );
      }
      setProviderPolicies(prev => ({
        ...prev,
        [providerId]: isAssigned
          ? prev[providerId].filter(id => id !== loanTypeId)
          : [...(prev[providerId] || []), loanTypeId]
      }));
      toast.success(isAssigned ? 'Policy removed' : 'Policy assigned');
    } catch (err: any) {
      console.error('Policy update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update policy');
    } finally {
      setOperationLoading('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Clock className="w-8 h-8 text-slate-400 animate-spin" />
          <p className="text-slate-500 font-medium">Loading policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Provider Policies</h1>
        <p className="text-slate-500 mt-2">Assign loan types to providers for them to offer to customers</p>
      </div>

      {providers.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No providers registered</p>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((provider: any) => {
            const assignedIds = providerPolicies[provider.id] || [];
            return (
              <motion.div
                key={provider.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <button
                  onClick={() => setExpandedProvider(expandedProvider === provider.id ? null : provider.id)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600">
                      {provider.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{provider.name}</p>
                      <p className="text-sm text-slate-500">
                        {assignedIds.length} of {allLoanTypes.length} loan type{assignedIds.length !== 1 ? 's' : ''} assigned
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                      expandedProvider === provider.id ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedProvider === provider.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 bg-slate-50"
                    >
                      <div className="p-6 space-y-3">
                        {allLoanTypes.length === 0 ? (
                          <p className="text-slate-400 text-sm text-center py-4">No loan types defined yet</p>
                        ) : (
                          allLoanTypes.map((loanType) => {
                            const isAssigned = assignedIds.includes(loanType.id);
                            const key = `${provider.id}-${loanType.id}`;
                            return (
                              <div
                                key={loanType.id}
                                className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-all"
                              >
                                <div className="flex-1">
                                  <p className="font-bold text-slate-900">{loanType.name}</p>
                                  <div className="flex gap-4 mt-1 text-xs text-slate-500">
                                    <span>Term: {loanType.term_value} {loanType.term_unit}{loanType.term_value !== 1 ? 's' : ''}</span>
                                    <span>Interest: {loanType.interest_rate}%</span>
                                    <span>Late fee: {loanType.late_fee_rate}%</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleToggleLoanType(provider.id, loanType.id, isAssigned)}
                                  disabled={operationLoading === key}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                    isAssigned
                                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  } disabled:opacity-50`}
                                >
                                  {operationLoading === key && <Clock className="w-4 h-4 animate-spin" />}
                                  {isAssigned ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      Assigned
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4" />
                                      Assign
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const providerPoliciesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/provider-policies',
  component: SuperAdminProviderPolicies,
});
