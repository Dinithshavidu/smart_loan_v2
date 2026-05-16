import { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, TrendingUp, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/api/auth/login', { email, password });
      login(data.token, data.user);
      toast.success('Successfully logged in!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-slate-200"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 mb-4">
            <TrendingUp className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">LendFlow</h1>
          <p className="text-slate-500 mt-1">Loan Management Made Simple</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="name@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 h-[56px]"
          >
            {loading ? (
              <Clock className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col items-center gap-2">
           <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            <Shield className="w-3 h-3" />
            Secure Enterprise Login
          </div>
          <p className="text-[11px] text-slate-400 text-center px-4 leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy. All activities are monitored and logged.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
