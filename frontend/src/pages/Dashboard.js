import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportAPI } from '../utils/api';
import {
  Package, PackageCheck, TrendingUp, TrendingDown, Wallet, AlertCircle,
  Plus, ShoppingCart, ArrowUpRight, ArrowDownRight, BarChart3, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { AuthContext } from '../context/AuthContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';

const COLORS = {
  primary: '#FF4F00',
  emerald: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  slate: '#64748B',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  cyan: '#06B6D4'
};

const PIE_COLORS = [COLORS.emerald, COLORS.amber, COLORS.slate];
const PAYMENT_COLORS = [COLORS.emerald, COLORS.amber, COLORS.red];

const formatAED = (num) => {
  if (num >= 1000000) return `AED ${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `AED ${(num / 1000).toFixed(1)}K`;
  return `AED ${num.toLocaleString()}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-lg p-3">
      <p className="text-xs font-mono font-bold text-slate-600 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: AED {(entry.value || 0).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.getDashboard();
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold font-heading uppercase text-slate-900 mb-6 sm:mb-8">Dashboard</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-2/3 mb-3"></div>
              <div className="h-7 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {[1, 2].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-48 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { containers, sales } = data;
  const showProfit = user?.role === 'admin';
  const totalProfit = sales.totalProfit || 0;
  const profitMargin = sales.totalRevenue > 0
    ? ((totalProfit / sales.totalRevenue) * 100).toFixed(1)
    : 0;

  const kpiCards = [
    {
      title: 'Total Containers',
      value: containers.total,
      subtitle: `${containers.available} available`,
      icon: Package,
      color: 'border-l-blue-500',
      iconBg: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Total Sales',
      value: sales.totalCount,
      subtitle: `${sales.paymentBreakdown.find(p => p.name === 'Full')?.value || 0} fully paid`,
      icon: ShoppingCart,
      color: 'border-l-purple-500',
      iconBg: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Total Revenue',
      value: `AED ${sales.totalRevenue.toLocaleString()}`,
      subtitle: `${sales.totalCount} transactions`,
      icon: TrendingUp,
      color: 'border-l-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
      valueClass: 'text-emerald-700'
    },
    ...(showProfit ? [{
      title: 'Total Profit',
      value: `AED ${totalProfit.toLocaleString()}`,
      subtitle: `${profitMargin}% margin`,
      icon: totalProfit >= 0 ? ArrowUpRight : ArrowDownRight,
      color: 'border-l-primary',
      iconBg: totalProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
      valueClass: totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
    }] : []),
    {
      title: 'Inventory Value',
      value: `AED ${containers.inventoryValue.toLocaleString()}`,
      subtitle: `${containers.available + containers.reserved} containers`,
      icon: Wallet,
      color: 'border-l-cyan-500',
      iconBg: 'bg-cyan-50 text-cyan-600'
    },
    {
      title: 'Outstanding',
      value: `AED ${sales.totalOutstanding.toLocaleString()}`,
      subtitle: `${(sales.paymentBreakdown.find(p => p.name === 'Partial')?.value || 0) + (sales.paymentBreakdown.find(p => p.name === 'Pending')?.value || 0)} pending`,
      icon: AlertCircle,
      color: 'border-l-amber-500',
      iconBg: 'bg-amber-50 text-amber-600',
      valueClass: sales.totalOutstanding > 0 ? 'text-amber-700' : 'text-slate-900'
    }
  ];

  // Format month labels
  const trendData = sales.monthlyTrend.map(m => ({
    ...m,
    label: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold font-heading uppercase text-slate-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">Business overview and key performance indicators</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {kpiCards.map((card) => (
          <div
            key={card.title}
            className={`card p-4 border-l-4 ${card.color} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono leading-tight">
                {card.title}
              </p>
              <div className={`w-7 h-7 rounded flex items-center justify-center ${card.iconBg}`}>
                <card.icon size={14} />
              </div>
            </div>
            <p className={`text-xl font-bold font-heading ${card.valueClass || 'text-slate-900'}`}>
              {card.value}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => navigate('/containers/new')}
          className="card p-4 flex items-center gap-3 hover:shadow-md hover:border-primary transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Plus size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm font-heading text-slate-900">Add Container</h3>
            <p className="text-xs text-slate-500">Register new purchase</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/sell')}
          className="card p-4 flex items-center gap-3 hover:shadow-md hover:border-primary transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-sm bg-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm font-heading text-slate-900">Sell Container</h3>
            <p className="text-xs text-slate-500">Create sale transaction</p>
          </div>
        </button>
      </div>

      {/* Charts Row 1: Revenue Trend + Container Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue & Profit Trend */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-900">Revenue {showProfit ? '& Profit' : ''} Trend</h2>
              <p className="text-xs text-slate-500">Monthly performance overview</p>
            </div>
            <BarChart3 size={20} className="text-slate-300" />
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatAED(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.blue} fill="url(#gradRevenue)" strokeWidth={2} />
                {showProfit && (
                  <Area type="monotone" dataKey="profit" name="Profit" stroke={COLORS.emerald} fill="url(#gradProfit)" strokeWidth={2} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No sales data yet</div>
          )}
        </div>

        {/* Container Status Pie */}
        <div className="card p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold font-heading text-slate-900">Container Status</h2>
            <p className="text-xs text-slate-500">Current inventory breakdown</p>
          </div>
          {containers.statusChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={containers.statusChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {containers.statusChart.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No containers</div>
          )}
          {/* Status counts */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center p-2 bg-emerald-50 rounded">
              <p className="text-lg font-bold text-emerald-700">{containers.available}</p>
              <p className="text-[10px] text-emerald-600 font-mono uppercase">Available</p>
            </div>
            <div className="text-center p-2 bg-amber-50 rounded">
              <p className="text-lg font-bold text-amber-700">{containers.reserved}</p>
              <p className="text-[10px] text-amber-600 font-mono uppercase">Reserved</p>
            </div>
            <div className="text-center p-2 bg-slate-100 rounded">
              <p className="text-lg font-bold text-slate-700">{containers.sold}</p>
              <p className="text-[10px] text-slate-600 font-mono uppercase">Sold</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Payment Status + Container Types/Sizes + Top Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Payment Status */}
        <div className="card p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold font-heading text-slate-900">Payment Status</h2>
            <p className="text-xs text-slate-500">Sales payment breakdown</p>
          </div>
          {sales.paymentBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sales.paymentBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {sales.paymentBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} sales`, name]} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No sales</div>
          )}
          {/* Financial summary */}
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Total Received</span>
              <span className="font-semibold text-emerald-600">AED {sales.totalReceived.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Outstanding</span>
              <span className="font-semibold text-amber-600">AED {sales.totalOutstanding.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Container Type & Size */}
        <div className="card p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold font-heading text-slate-900">Container Distribution</h2>
            <p className="text-xs text-slate-500">By type and size</p>
          </div>
          {containers.byType.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">By Type</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={containers.byType} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip formatter={(v) => [v, 'Count']} />
                  <Bar dataKey="value" fill={COLORS.blue} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
          {containers.bySize.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2 mt-4">By Size</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={containers.bySize} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip formatter={(v) => [v, 'Count']} />
                  <Bar dataKey="value" fill={COLORS.purple} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Top Sold Items */}
        <div className="card p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold font-heading text-slate-900">Top Sold Items</h2>
            <p className="text-xs text-slate-500">By revenue generated</p>
          </div>
          {sales.topItems.length > 0 ? (
            <div className="space-y-2.5">
              {sales.topItems.map((item, i) => {
                const maxRev = sales.topItems[0]?.totalRevenue || 1;
                const pct = (item.totalRevenue / maxRev) * 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{item.name}</span>
                      <span className="text-slate-500">{item.totalQty} {item.unit}</span>
                    </div>
                    <div className="relative h-5 bg-slate-100 rounded overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary/20 rounded"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-semibold text-slate-600">
                        AED {item.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No item data</div>
          )}
        </div>
      </div>

      {/* Bottom: Recent Sales + Top Buyers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-6 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-heading text-slate-900">Recent Sales</h2>
                <p className="text-xs text-slate-500">Latest transactions</p>
              </div>
              <button
                onClick={() => navigate('/sales')}
                className="text-xs font-semibold text-primary hover:text-primary/80 uppercase tracking-wider font-mono"
              >
                View All
              </button>
            </div>
            {sales.recentSales.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-400 text-sm">No sales recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-2.5 text-left">Container</th>
                      <th className="px-6 py-2.5 text-left">Buyer</th>
                      <th className="px-6 py-2.5 text-left">Items</th>
                      <th className="px-6 py-2.5 text-right">Revenue</th>
                      <th className="px-6 py-2.5 text-right">Profit</th>
                      <th className="px-6 py-2.5 text-left">Date</th>
                      <th className="px-6 py-2.5 text-left">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.recentSales.map((sale) => (
                      <tr
                        key={sale._id}
                        className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        <td className="px-6 py-3 font-mono text-xs font-semibold text-slate-900">
                          {sale.containerId?.containerNo || 'N/A'}
                        </td>
                        <td className="px-6 py-3 text-xs text-slate-700">
                          {sale.buyerName}
                        </td>
                        <td className="px-6 py-3 text-xs text-slate-600">
                          {sale.items && sale.items.length > 0
                            ? sale.items.map(i => i.name).join(', ')
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-3 text-xs font-semibold text-slate-900 text-right">
                          AED {sale.sellingPrice.toLocaleString()}
                        </td>
                        <td className={`px-6 py-3 text-xs font-semibold text-right ${sale.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          AED {sale.profit.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-xs text-slate-500">
                          {new Date(sale.sellingDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`status-badge text-[10px] ${
                            sale.paymentStatus === 'Full' ? 'status-available' :
                            sale.paymentStatus === 'Partial' ? 'status-reserved' :
                            'bg-red-100 text-red-700 border-red-200'
                          }`}>
                            {sale.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Top Buyers */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-900">Top Buyers</h2>
              <p className="text-xs text-slate-500">By total revenue</p>
            </div>
            <Users size={20} className="text-slate-300" />
          </div>
          {sales.topBuyers.length > 0 ? (
            <div className="space-y-3">
              {sales.topBuyers.map((buyer, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs font-mono">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{buyer.name}</p>
                    <p className="text-[10px] text-slate-500">{buyer.count} transaction{buyer.count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-900">AED {buyer.revenue.toLocaleString()}</p>
                    <p className={`text-[10px] font-medium ${buyer.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {buyer.profit >= 0 ? '+' : ''}AED {buyer.profit.toLocaleString()} profit
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No buyers yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
