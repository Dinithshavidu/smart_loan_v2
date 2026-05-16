import { useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { Clock, Search, Menu, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Sidebar } from './sidebar';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { location } = useRouterState();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="lg:pl-64">
        <header className="fixed top-0 right-0 left-0 lg:left-64 bg-white border-b border-slate-200 z-30 px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 lg:hidden">
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <div className="hidden sm:flex items-center gap-4 text-sm text-slate-500">
              <span className="hover:text-emerald-600 cursor-pointer">Overview</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-slate-900 lowercase first-letter:uppercase">{location.pathname.replace('/', '') || 'Dashboard'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input type="text" placeholder="Search customer..." className="pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm w-64 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none" />
              <Search className="w-4 h-4 absolute left-4 top-2.5 text-slate-400" />
            </div>
            <div className="flex items-center gap-2 text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>{format(new Date(), 'MMM do')}</span>
            </div>
          </div>
        </header>

        <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
