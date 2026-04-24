import React, { useState, useEffect, useContext } from 'react';
import { reportAPI } from '../utils/api';
import { toast } from 'sonner';
import { FileSpreadsheet, FileText, Loader2, Calendar, Users, Package, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AuthContext } from '../context/AuthContext';
import InputField from '../components/ui/InputField';

const Reports = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');
  const [activeTab, setActiveTab] = useState('weekly');
  const [summary, setSummary] = useState({
    weeklySummary: [],
    monthlySummary: [],
    buyerSummary: [],
    itemSummary: [],
    totals: {
      totalSales: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalReceived: 0,
      totalOutstanding: 0
    },
    sales: []
  });
  const [filters, setFilters] = useState({
    from: '',
    to: ''
  });

  useEffect(() => {

  const fetchSummary = async () => {
    try {
      setLoading(true);

      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const response = await reportAPI.getSummary(params);
      setSummary(response.data);

    } catch (error) {
      toast.error('Failed to load reports');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  fetchSummary();

}, [filters]);

  const handleExport = async (type) => {
    try {
      setExporting(type);

      if (type === 'containers') {
        const response = await reportAPI.exportContainers();
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'containers.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Containers exported successfully');
      } else if (type === 'sales') {
        const response = await reportAPI.exportSales();
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sales.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Sales exported successfully');
      } else if (type === 'pdf') {
        const params = {};
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;
        const response = await reportAPI.exportPDF(params);
        const blob = new Blob([response.data], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.success('Summary report opened — use Print to save as PDF');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${type}`);
    } finally {
      setExporting('');
    }
  };

  const totals = summary.totals || {};
  const showProfit = user?.role === 'admin';
  const profitMargin = totals.totalRevenue > 0 && showProfit
    ? ((totals.totalProfit / totals.totalRevenue) * 100).toFixed(1)
    : '0.0';
  const collectionRate = totals.totalRevenue > 0
    ? ((totals.totalReceived / totals.totalRevenue) * 100).toFixed(1)
    : '0.0';

  const timeData = activeTab === 'weekly' ? summary.weeklySummary : summary.monthlySummary;

  // Prepare chart data (reverse so oldest is on left)
  const chartData = [...(timeData || [])].reverse().map(entry => {
    const data = {
      name: activeTab === 'weekly' ? entry.label : entry.month,
      Revenue: entry.revenue,
      Cost: entry.cost
    };

    if (showProfit) {
      data.Profit = entry.profit;
    }

    return data;
  });

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold font-heading uppercase text-slate-900 tracking-tight">
          Reports
        </h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">Detailed sales analytics with weekly and monthly breakdowns</p>
      </div>

      {/* Export Buttons */}
      <div className="card p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold font-heading text-slate-800 mb-4">Export Data</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <button
            onClick={() => handleExport('containers')}
            disabled={!!exporting}
            className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting === 'containers' ? <Loader2 size={20} className="animate-spin" /> : <FileSpreadsheet size={20} />}
            {exporting === 'containers' ? 'Exporting...' : 'Export Containers (.xlsx)'}
          </button>
          <button
            onClick={() => handleExport('sales')}
            disabled={!!exporting}
            className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting === 'sales' ? <Loader2 size={20} className="animate-spin" /> : <FileSpreadsheet size={20} />}
            {exporting === 'sales' ? 'Exporting...' : 'Export Sales (.xlsx)'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting === 'pdf' ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
            {exporting === 'pdf' ? 'Exporting...' : 'Export Summary (.pdf)'}
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold font-heading text-slate-800 mb-4">Filter by Date Range</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <InputField
            label="From Date"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
          <InputField
            label="To Date"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
          <button
            onClick={() => setFilters({ from: '', to: '' })}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center">
          <Loader2 size={32} className="animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">Loading reports...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
            <div className="card p-4 border-l-4 border-l-blue-500">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">Total Sales</p>
              <p className="text-2xl font-bold font-heading text-slate-900">{totals.totalSales || 0}</p>
            </div>
            <div className="card p-4 border-l-4 border-l-primary">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">Revenue</p>
              <p className="text-2xl font-bold font-heading text-slate-900">AED {(totals.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="card p-4 border-l-4 border-l-amber-500">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">Cost Basis</p>
              <p className="text-2xl font-bold font-heading text-slate-900">AED {(totals.totalCost || 0).toLocaleString()}</p>
            </div>
            {showProfit && (
              <div className="card p-4 border-l-4 border-l-emerald-500">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">Profit</p>
                <p className={`text-2xl font-bold font-heading ${(totals.totalProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  AED {(totals.totalProfit || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">{profitMargin}% margin</p>
              </div>
            )}
            <div className="card p-4 border-l-4 border-l-teal-500">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">Received</p>
              <p className="text-2xl font-bold font-heading text-teal-600">AED {(totals.totalReceived || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">{collectionRate}% collected</p>
            </div>
            <div className="card p-4 border-l-4 border-l-red-500">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">Outstanding</p>
              <p className="text-2xl font-bold font-heading text-red-600">AED {(totals.totalOutstanding || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Weekly / Monthly Toggle */}
          <div className="card overflow-hidden mb-6">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('weekly')}
                className={`flex-1 px-6 py-3 text-sm font-bold uppercase tracking-wider font-mono transition-colors ${
                  activeTab === 'weekly'
                    ? 'bg-primary text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar size={16} className="inline mr-2 -mt-0.5" />
                Weekly Breakdown
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`flex-1 px-6 py-3 text-sm font-bold uppercase tracking-wider font-mono transition-colors ${
                  activeTab === 'monthly'
                    ? 'bg-primary text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BarChart3 size={16} className="inline mr-2 -mt-0.5" />
                Monthly Breakdown
              </button>
            </div>

            <div className="p-6">
              {(timeData || []).length === 0 ? (
                <p className="text-slate-500 text-center py-4">No data available for this period</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left">{activeTab === 'weekly' ? 'Week' : 'Month'}</th>
                        <th className="px-4 py-3 text-right">Sales</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                        <th className="px-4 py-3 text-right">Cost</th>
                        {showProfit && <th className="px-4 py-3 text-right">Profit</th>}
                        <th className="px-4 py-3 text-right">Received</th>
                        <th className="px-4 py-3 text-right">Outstanding</th>
                        {showProfit && <th className="px-4 py-3 text-right">Margin</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {timeData.map((entry) => {
                        const margin = entry.revenue > 0
                          ? ((entry.profit / entry.revenue) * 100).toFixed(1)
                          : '0.0';
                        return (
                          <tr
                            key={activeTab === 'weekly' ? entry.week : entry.month}
                            className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                          >
                            <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-900">
                              {activeTab === 'weekly' ? entry.label : entry.month}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-slate-900 font-semibold">
                              {entry.count}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-slate-900">
                              AED {entry.revenue.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-amber-700">
                              AED {entry.cost.toLocaleString()}
                            </td>
                            {showProfit && (
                              <td className={`px-4 py-3 text-sm text-right font-semibold ${entry.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                AED {entry.profit.toLocaleString()}
                              </td>
                            )}
                            <td className="px-4 py-3 text-sm text-right text-teal-600">
                              AED {entry.received.toLocaleString()}
                            </td>
                            <td className={`px-4 py-3 text-sm text-right ${entry.outstanding > 0 ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                              AED {entry.outstanding.toLocaleString()}
                            </td>
                            {showProfit && (
                              <td className={`px-4 py-3 text-sm text-right font-mono ${parseFloat(margin) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {margin}%
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                      <tr className="font-semibold">
                        <td className="px-4 py-3 text-sm text-slate-900 uppercase">Total</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-900">
                          {(timeData || []).reduce((s, e) => s + e.count, 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-900">
                          AED {(timeData || []).reduce((s, e) => s + e.revenue, 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-amber-700">
                          AED {(timeData || []).reduce((s, e) => s + e.cost, 0).toLocaleString()}
                        </td>
                        {showProfit && (
                          <td className="px-4 py-3 text-sm text-right text-emerald-600">
                            AED {(timeData || []).reduce((s, e) => s + e.profit, 0).toLocaleString()}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-right text-teal-600">
                          AED {(timeData || []).reduce((s, e) => s + e.received, 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">
                          AED {(timeData || []).reduce((s, e) => s + e.outstanding, 0).toLocaleString()}
                        </td>
                        {showProfit && (
                          <td className="px-4 py-3 text-sm text-right font-mono text-emerald-600">
                            {profitMargin}%
                          </td>
                        )}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Revenue / Cost / Profit Chart */}
          {chartData.length > 0 && (
            <div className="card p-4 sm:p-6 mb-6">
              <h2 className="text-base sm:text-lg font-semibold font-heading text-slate-800 mb-4">
                {activeTab === 'weekly' ? 'Weekly' : 'Monthly'} Revenue {showProfit ? '& Profit' : ''} Trend
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => [`AED ${value.toLocaleString()}`]}
                      contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend />
                    <Bar dataKey="Revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Cost" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                    {showProfit && <Bar dataKey="Profit" fill="#10b981" radius={[2, 2, 0, 0]} />}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Buyer Summary & Item Summary side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Buyer Summary */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h2 className="text-lg font-semibold font-heading text-slate-800 flex items-center gap-2">
                  <Users size={20} className="text-primary" />
                  Buyer-wise Summary
                </h2>
              </div>
              {(summary.buyerSummary || []).length === 0 ? (
                <div className="p-6">
                  <p className="text-slate-500 text-center">No buyer data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left">Buyer</th>
                        <th className="px-4 py-3 text-right">Sales</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                        {showProfit && <th className="px-4 py-3 text-right">Profit</th>}
                        <th className="px-4 py-3 text-right">Received</th>
                        <th className="px-4 py-3 text-right">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.buyerSummary.map((buyer) => (
                        <tr
                          key={buyer.name}
                          className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                        >
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">{buyer.name}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-700">{buyer.count}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900">AED {buyer.revenue.toLocaleString()}</td>
                          {showProfit && (
                            <td className={`px-4 py-3 text-sm text-right font-semibold ${buyer.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              AED {buyer.profit.toLocaleString()}
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm text-right text-teal-600">AED {buyer.received.toLocaleString()}</td>
                          <td className={`px-4 py-3 text-sm text-right ${buyer.outstanding > 0 ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                            AED {buyer.outstanding.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Item Summary */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h2 className="text-lg font-semibold font-heading text-slate-800 flex items-center gap-2">
                  <Package size={20} className="text-primary" />
                  Item-wise Summary
                </h2>
              </div>
              {(summary.itemSummary || []).length === 0 ? (
                <div className="p-6">
                  <p className="text-slate-500 text-center">No item data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left">Item</th>
                        <th className="px-4 py-3 text-right">Qty Sold</th>
                        <th className="px-4 py-3 text-left">Unit</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                        <th className="px-4 py-3 text-right">Cost</th>
                        {showProfit && <th className="px-4 py-3 text-right">Profit</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {summary.itemSummary.map((item) => {
                        const itemProfit = (item.totalRevenue || 0) - (item.totalCost || 0);
                        return (
                          <tr
                            key={`${item.name}-${item.unit}`}
                            className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                          >
                            <td className="px-4 py-3 text-sm font-semibold text-slate-900">{item.name}</td>
                            <td className="px-4 py-3 text-sm text-right text-slate-900 font-mono">{item.totalQty.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{item.unit}</td>
                            <td className="px-4 py-3 text-sm text-right text-slate-900">AED {(item.totalRevenue || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-right text-amber-700">AED {(item.totalCost || 0).toLocaleString()}</td>
                            {showProfit && (
                              <td className={`px-4 py-3 text-sm text-right font-semibold ${itemProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                AED {itemProfit.toLocaleString()}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent Sales Detail */}
          {(summary.sales || []).length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h2 className="text-lg font-semibold font-heading text-slate-800">
                  All Sales ({summary.sales.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Container</th>
                      <th className="px-4 py-3 text-left">Buyer</th>
                      <th className="px-4 py-3 text-left">Items</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                      {showProfit && <th className="px-4 py-3 text-right">Profit</th>}
                      <th className="px-4 py-3 text-right">Received</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.sales.map((sale, index) => (
                      <tr
                        key={sale._id}
                        className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {new Date(sale.sellingDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-900">
                          {sale.containerId?.containerNo || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">{sale.buyerName}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {sale.items && sale.items.length > 0
                            ? sale.items.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')
                            : `${sale.quantity || 1} ${sale.unit || 'Unit'}`
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-900 font-semibold">
                          AED {sale.sellingPrice.toLocaleString()}
                        </td>
                        {showProfit && (
                          <td className={`px-4 py-3 text-sm text-right font-semibold ${sale.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            AED {sale.profit.toLocaleString()}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-right text-teal-600">
                          AED {sale.amountReceived.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`status-badge ${
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
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
