import { useNavigate, useRouterState } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  Building2,
  Users,
  Wallet,
  Clock,
  CheckCircle2,
  LogOut,
  PieChart,
  TrendingUp,
  History,
  Layers,
  BookOpen,
  X,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  const menuItems = {
    SUPER_ADMIN: [
      { name: 'Dashboard', icon: PieChart, path: '/' },
      { name: 'Providers', icon: Building2, path: '/providers' },
      { name: 'Loan Types', icon: Layers, path: '/loan-types' },
      { name: 'Policies', icon: BookOpen, path: '/provider-policies' },
    ],
    PROVIDER: [
      { name: 'Dashboard', icon: PieChart, path: '/' },
      { name: 'Loans', icon: Wallet, path: '/loans' },
      { name: 'Collectors', icon: Users, path: '/collectors' },
      { name: 'Customers', icon: Users, path: '/customers' },
      { name: 'Approvals', icon: Clock, path: '/approvals' },
      { name: 'Policies', icon: BookOpen, path: '/policies' },
    ],
    COLLECTOR: [
      { name: 'Collections', icon: CheckCircle2, path: '/' },
      { name: 'History', icon: History, path: '/history' },
    ],
    CUSTOMER: [
      { name: 'My Loans', icon: Wallet, path: '/' },
      { name: 'History', icon: History, path: '/history' },
    ]
  };

  const currentMenu = user ? menuItems[user.role] : [];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.div
        className={`fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white z-50 transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">LendFlow</span>
          </div>

          <nav className="space-y-1">
            {currentMenu.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate({ to: item.path });
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-6 py-3 transition-colors text-left group border-r-4 ${
                  location.pathname === item.path
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500'
                  : 'border-transparent text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-6 px-4">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-emerald-400 font-bold uppercase shrink-0">
              {user?.name[0]}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium truncate text-sm">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase mt-0.5 tracking-wider">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.div>
    </>
  );
};
