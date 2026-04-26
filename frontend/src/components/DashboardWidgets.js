import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export const formatAED = (n) => {
  if (!n && n !== 0) return 'AED 0';
  if (n >= 1000000) return `AED ${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `AED ${(n/1000).toFixed(1)}K`;
  return `AED ${n.toLocaleString()}`;
};

export const KPICard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend, trendUp, accent }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trend}
        </div>
      )}
    </div>
    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
    <p className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">{value}</p>
    <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
    {accent && <div className={`mt-3 h-1 w-full rounded-full bg-slate-100 overflow-hidden`}><div className={`h-full rounded-full ${accent}`} style={{width:'60%'}} /></div>}
  </div>
);

export const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-5">
    <h2 className="text-base font-bold text-slate-800 tracking-tight">{title}</h2>
    {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
  </div>
);

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}>{children}</div>
);

const statusStyles = {
  Full: 'bg-emerald-50 text-emerald-700',
  Partial: 'bg-amber-50 text-amber-700',
  Pending: 'bg-red-50 text-red-600',
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusStyles[status] || 'bg-slate-100 text-slate-600'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${status==='Full'?'bg-emerald-500':status==='Partial'?'bg-amber-500':'bg-red-500'}`} />
    {status}
  </span>
);

export const AlertItem = ({ type, message, time }) => {
  const cfg = {
    warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', icon_c: 'text-amber-500' },
    pending: { icon: Clock, bg: 'bg-blue-50', border: 'border-blue-200', icon_c: 'text-blue-500' },
    success: { icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', icon_c: 'text-emerald-500' },
  }[type] || { icon: AlertTriangle, bg: 'bg-slate-50', border: 'border-slate-200', icon_c: 'text-slate-400' };
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
      <cfg.icon size={15} className={`mt-0.5 shrink-0 ${cfg.icon_c}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700">{message}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{time}</p>
      </div>
    </div>
  );
};

export const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {formatAED(p.value)}</p>
      ))}
    </div>
  );
};
