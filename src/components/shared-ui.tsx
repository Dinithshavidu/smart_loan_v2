export const Card = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
      {title}
      {trend && (
        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
           {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="flex items-end justify-between">
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }: any) => (
  <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8 text-slate-300" />
    </div>
    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    <p className="text-slate-500 text-sm max-w-[240px] mx-auto mt-1 mb-6">{description}</p>
    {action}
  </div>
);
