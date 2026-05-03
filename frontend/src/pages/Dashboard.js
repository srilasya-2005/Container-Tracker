import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportAPI } from '../utils/api';
import { toast } from 'sonner';
import { AuthContext } from '../context/AuthContext';
import {
  Package, ShoppingCart, TrendingUp, ArrowUpRight, Wallet, AlertCircle,
  Plus, BarChart3, Users, Bell, Search, Download, ChevronDown, RefreshCw,
  Settings, ArrowRight, Star
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';
import { KPICard, Card, SectionTitle, StatusBadge, AlertItem, ChartTooltip, formatAED } from '../components/DashboardWidgets';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const r = await reportAPI.getDashboard();
      setData(r.data);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-white rounded-2xl border border-slate-100" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-white rounded-2xl border border-slate-100" />
        <div className="h-80 bg-white rounded-2xl border border-slate-100" />
      </div>
    </div>
  );

  if (!data) return null;

  const { containers, sales } = data;
  const showProfit = user?.role === 'admin';
  const profit = sales.totalProfit || 0;
  const margin = sales.totalRevenue > 0 ? ((profit / sales.totalRevenue) * 100).toFixed(1) : 0;

  const kpis = [
    { title: 'Total Containers', value: containers.total, subtitle: `${containers.available} available`, icon: Package, iconBg: 'bg-slate-50', iconColor: 'text-slate-600', trend: '+5%', trendUp: true, accent: 'bg-slate-500' },
    { title: 'Total Sales', value: sales.totalCount, subtitle: `${sales.paymentBreakdown.find(p => p.name === 'Full')?.value || 0} fully paid`, icon: ShoppingCart, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', trend: '+12%', trendUp: true, accent: 'bg-indigo-500' },
    { title: 'Total Revenue', value: formatAED(sales.totalRevenue), subtitle: `${sales.totalCount} transactions`, icon: TrendingUp, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', trend: '+8%', trendUp: true, accent: 'bg-emerald-500' },
    ...(showProfit ? [{ title: 'Total Profit', value: formatAED(profit), subtitle: `${margin}% margin`, icon: ArrowUpRight, iconBg: profit >= 0 ? 'bg-emerald-50' : 'bg-rose-50', iconColor: profit >= 0 ? 'text-emerald-600' : 'text-rose-600', trend: profit >= 0 ? '+14%' : '-3%', trendUp: profit >= 0, accent: profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500' }] : []),
    { title: 'Inventory Value', value: formatAED(containers.inventoryValue), subtitle: `${containers.available + containers.reserved} in stock`, icon: Wallet, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', trend: '+3%', trendUp: true, accent: 'bg-blue-500' },
    { title: 'Outstanding', value: formatAED(sales.totalOutstanding), subtitle: 'pending collection', icon: AlertCircle, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', trend: sales.totalOutstanding > 0 ? 'Due' : 'Clear', trendUp: sales.totalOutstanding === 0, accent: 'bg-amber-500' },
  ];

  const trendData = sales.monthlyTrend.map(m => ({
    ...m,
    label: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }));

  const pieData = containers.statusChart || [];

  const alerts = [
    ...(containers.available < 3 ? [{ type: 'warning', message: `Low stock: only ${containers.available} containers available`, time: 'Just now' }] : []),
    ...(sales.totalOutstanding > 0 ? [{ type: 'pending', message: `${formatAED(sales.totalOutstanding)} outstanding across pending payments`, time: '1 hour ago' }] : []),
    ...(sales.recentSales?.length > 0 ? [{ type: 'success', message: `New sale recorded for ${sales.recentSales[0]?.buyerName}`, time: '2 hours ago' }] : []),
  ];

  const cols = ['Customer', 'Container', 'Amount', 'Status', 'Date'];

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Business overview and key performance indicators</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date range */}
            <button className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors">
              <span>This Month</span>
              <ChevronDown size={13} />
            </button>
            {/* Search */}
            <div className="relative hidden sm:flex items-center">
              <Search size={14} className="absolute left-3 text-slate-400" />
              <input className="text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl w-40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" placeholder="Search..." />
            </div>
            {/* Notification */}
            <button className="relative w-9 h-9 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
              <Bell size={15} className="text-slate-500" />
              {alerts.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              {(user?.name || user?.email || 'A')[0].toUpperCase()}
            </div>
            {/* Export */}
            <button onClick={() => navigate('/reports')} className="flex items-center gap-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors">
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={fetchDashboard} className="w-9 h-9 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
              <RefreshCw size={14} className="text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(k => <KPICard key={k.title} {...k} />)}
      </div>

      {/* ── Action Buttons ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Add Container', sub: 'Register purchase', icon: Plus, color: 'bg-indigo-50 text-indigo-600', path: '/containers/new' },
          { label: 'Sell Container', sub: 'Create transaction', icon: ShoppingCart, color: 'bg-blue-50 text-blue-600', path: '/sell' },
          { label: 'View Reports', sub: 'Analytics & exports', icon: BarChart3, color: 'bg-emerald-50 text-emerald-600', path: '/reports' },
          { label: 'Manage Stock', sub: 'Inventory control', icon: Settings, color: 'bg-slate-50 text-slate-600', path: '/containers' },
        ].map(btn => (
          <button key={btn.label} onClick={() => navigate(btn.path)}
            className="group flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left">
            <div className={`w-10 h-10 rounded-xl ${btn.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
              <btn.icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{btn.label}</p>
              <p className="text-[11px] text-slate-400 truncate">{btn.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Trend */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Revenue {showProfit ? '& Profit' : ''} Trend</h2>
              <p className="text-xs text-slate-400 mt-0.5">Monthly performance overview</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Revenue</span>
              {showProfit && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Profit</span>}
            </div>
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={formatAED} width={70} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4F46E5" strokeWidth={2.5} fill="url(#gRev)" dot={false} activeDot={{ r: 5, fill: '#4F46E5' }} />
                {showProfit && <Area type="monotone" dataKey="profit" name="Profit" stroke="#10B981" strokeWidth={2.5} fill="url(#gProfit)" dot={false} activeDot={{ r: 5, fill: '#10B981' }} />}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300">
              <BarChart3 size={40} className="mb-2" />
              <p className="text-sm">No sales data yet</p>
            </div>
          )}
        </Card>

        {/* Container Status Donut */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-800">Container Status</h2>
            <p className="text-xs text-slate-400 mt-0.5">Current inventory breakdown</p>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-slate-500 font-medium">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm">No data</div>
          )}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { l: 'Available', v: containers.available, cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
              { l: 'Reserved', v: containers.reserved, cls: 'bg-amber-50 text-amber-700 border-amber-100' },
              { l: 'Sold', v: containers.sold, cls: 'bg-slate-50 text-slate-600 border-slate-200' },
            ].map(s => (
              <div key={s.l} className={`text-center p-2.5 rounded-xl border ${s.cls}`}>
                <p className="text-lg font-bold">{s.v}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Payment Status | Container Distribution | Top Sold Items ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Payment Status Donut */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Payment Status</h2>
              <p className="text-xs text-slate-400 mt-0.5">Sales payment breakdown</p>
            </div>
          </div>
          <div className="flex flex-col gap-6 h-full">
            {/* Donut */}
            <div className="w-full">
              {sales.paymentBreakdown?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={sales.paymentBreakdown}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={82}
                      paddingAngle={3} dataKey="value"
                      startAngle={90} endAngle={-270}
                    >
                      {sales.paymentBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v + ' sales', n]} />
                    <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-slate-500 font-medium">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[130px] flex items-center justify-center text-slate-300 text-sm">No data</div>
              )}
            </div>

            {/* Summary rows */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <span className="text-xs font-medium text-slate-500">Total Received</span>
                <span className="text-sm font-bold text-emerald-600">{formatAED(sales.totalReceived)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <span className="text-xs font-medium text-slate-500">Outstanding</span>
                <span className={`text-sm font-bold ${sales.totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {formatAED(sales.totalOutstanding)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['Full', 'Partial', 'Pending'].map(status => {
                  const item = sales.paymentBreakdown?.find(p => p.name === status);
                  const clsMap = { Full: 'bg-emerald-50 text-emerald-700 border-emerald-100', Partial: 'bg-amber-50 text-amber-700 border-amber-100', Pending: 'bg-red-50 text-red-600 border-red-100' };
                  return (
                    <div key={status} className={`text-center p-2 rounded-xl border ${clsMap[status]}`}>
                      <p className="text-base font-bold">{item?.value || 0}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-0.5">{status}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Container Distribution */}
        <Card className="p-6 flex flex-col h-full">
          <div className="mb-4 shrink-0">
            <h2 className="text-base font-bold text-slate-800">Container Distribution</h2>
            <p className="text-xs text-slate-400 mt-0.5">By type and size</p>
          </div>
          <div className="flex-1 flex flex-col justify-center space-y-8">
            {/* By Type */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">By Type</p>
              {containers.byType?.length > 0 ? (
                <ResponsiveContainer width="100%" height={containers.byType.length * 42 + 10}>
                  <BarChart data={containers.byType} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} barSize={14}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip cursor={{ fill: '#F8FAFC' }} formatter={(v) => [v, 'Containers']} />
                    <Bar dataKey="value" fill="#4F46E5" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-xs text-slate-300">No data</p>}
            </div>

            {/* By Size */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">By Size</p>
              {containers.bySize?.length > 0 ? (
                <ResponsiveContainer width="100%" height={containers.bySize.length * 42 + 10}>
                  <BarChart data={containers.bySize} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} barSize={14}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip cursor={{ fill: '#F8FAFC' }} formatter={(v) => [v, 'Containers']} />
                    <Bar dataKey="value" fill="#64748B" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-xs text-slate-300">No data</p>}
            </div>
          </div>
        </Card>

        {/* Top Sold Items */}
        <Card className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-800">Top Sold Items</h2>
              <p className="text-xs text-slate-400 mt-0.5">By revenue generated</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {sales.topItems?.length > 0 ? (
              <div className="space-y-4">
              {sales.topItems.slice(0, 8).map((item, i) => {
                const pct = Math.min((item.totalRevenue / (sales.topItems[0]?.totalRevenue || 1)) * 100, 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                      <span className="text-xs text-slate-400 tabular-nums">{item.totalQty} {item.unit || 'units'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-300 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600 tabular-nums shrink-0">{formatAED(item.totalRevenue)}</span>
                    </div>
                  </div>
                );
              })}
              </div>
            ) : (
              <p className="text-sm text-slate-300 text-center py-8">No item data yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* ── Recent Sales + Top Buyers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Sales */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Recent Sales</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest transactions</p>
            </div>
            <button onClick={() => navigate('/sales')} className="text-xs font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest transition-colors">
              View All
            </button>
          </div>

          {sales.recentSales?.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No sales recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Container', 'Buyer', 'Items', 'Revenue', ...(showProfit ? ['Profit'] : []), 'Date', 'Payment'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.recentSales?.map((s, idx) => {
                    const itemsText = s.items?.length > 0
                      ? s.items.map(i => i.name).filter(Boolean).join(', ')
                      : '—';
                    const profitVal = s.profit || 0;
                    const isProfit = profitVal >= 0;
                    const paymentStyle = s.paymentStatus === 'Pending' ? 'text-orange-500 font-semibold' : 'text-slate-500';
                    return (
                      <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                        <td className="px-3 py-3.5">
                          <span className="font-mono text-[13px] font-bold text-slate-800">{s.containerId?.containerNo || '—'}</span>
                        </td>
                        <td className="px-3 py-3.5 text-[13px] text-slate-600 whitespace-nowrap">{s.buyerName}</td>
                        <td className="px-3 py-3.5 max-w-[130px]">
                          <span className="text-[13px] text-slate-600 line-clamp-1 block truncate">{itemsText}</span>
                        </td>
                        <td className="px-3 py-3.5 text-[13px] font-bold text-slate-900 whitespace-nowrap">AED {s.sellingPrice?.toLocaleString()}</td>
                        {showProfit && (
                          <td className={`px-3 py-3.5 text-[13px] font-bold whitespace-nowrap ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                            AED {profitVal?.toLocaleString()}
                          </td>
                        )}
                        <td className="px-3 py-3.5 text-[13px] text-slate-400 whitespace-nowrap">
                          {new Date(s.sellingDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}
                        </td>
                        <td className={`px-3 py-3.5 text-[13px] ${paymentStyle}`}>{s.paymentStatus}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Top Buyers */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Top Buyers</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">By total revenue</p>
            </div>
            <Users size={16} className="text-slate-300" />
          </div>
          {sales.topBuyers?.length > 0 ? (
            <div className="space-y-3">
              {sales.topBuyers.slice(0, 5).map((b, i) => {
                const rankColors = [
                  'from-slate-800 to-slate-900',
                  'from-slate-700 to-slate-800',
                  'from-slate-600 to-slate-700',
                  'from-slate-500 to-slate-600',
                  'from-slate-400 to-slate-500',
                ];
                const pct = Math.min((b.revenue / (sales.topBuyers[0]?.revenue || 1)) * 100, 100);
                return (
                  <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${rankColors[i]} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-xs font-semibold text-slate-800 truncate">{b.name}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">{b.count} sale{b.count !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 tabular-nums">{formatAED(b.revenue)}</p>
                      {showProfit && b.profit != null && (
                        <p className={`text-[10px] font-semibold ${b.profit >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                          {b.profit >= 0 ? '+' : ''}{formatAED(b.profit)} profit
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Users size={18} className="text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No buyers yet</p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;
