const express = require('express');
const fs = require('fs');
const path = require('path');
const Container = require('../models/Container');
const Sale = require('../models/Sale');
const { authMiddleware, requireRole } = require('../middleware/auth');
const XLSX = require('xlsx');
const router = express.Router();

// Load logo as base64 for invoice embedding
let logoDataUri = '';
try {
  const logoPath = path.join(__dirname, '..', 'assets', 'lmh.png');
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');
  logoDataUri = `data:image/png;base64,${logoBase64}`;
} catch (e) {
  console.warn('Logo file not found at assets/lmh.png');
}

router.use(authMiddleware, requireRole('admin', 'finance'));

const stripProfit = (payload) => {
  if (!payload) return payload;
  const copy = JSON.parse(JSON.stringify(payload));

  if (copy.sales) {
    copy.sales.totalProfit = undefined;
    if (Array.isArray(copy.sales.monthlyTrend)) {
      copy.sales.monthlyTrend = copy.sales.monthlyTrend.map(entry => {
        const { profit, ...rest } = entry;
        return rest;
      });
    }
    if (Array.isArray(copy.sales.topBuyers)) {
      copy.sales.topBuyers = copy.sales.topBuyers.map(buyer => {
        const { profit, ...rest } = buyer;
        return rest;
      });
    }
  }

  if (copy.weeklySummary) {
    copy.weeklySummary = copy.weeklySummary.map(entry => {
      const { profit, ...rest } = entry;
      return rest;
    });
  }
  if (copy.monthlySummary) {
    copy.monthlySummary = copy.monthlySummary.map(entry => {
      const { profit, ...rest } = entry;
      return rest;
    });
  }
  if (copy.buyerSummary) {
    copy.buyerSummary = copy.buyerSummary.map(entry => {
      const { profit, ...rest } = entry;
      return rest;
    });
  }
  if (copy.totals) {
    delete copy.totals.totalProfit;
  }

  if (Array.isArray(copy.sales)) {
    copy.sales = copy.sales.map(sale => {
      const { profit, ...rest } = sale;
      return rest;
    });
  }

  return copy;
};

// Simple in-memory TTL cache for the dashboard (30s)
const dashCache = new Map();
const DASH_TTL_MS = 30_000;

const STATUS_COLORS = { Available: '#10B981', Reserved: '#F59E0B', Sold: '#64748B' };
const PAYMENT_COLORS = { Full: '#10B981', Partial: '#F59E0B', Pending: '#EF4444' };

// Comprehensive dashboard endpoint — aggregation-based
router.get('/dashboard', async (req, res) => {
  try {
    const cacheKey = req.user.role;
    const hit = dashCache.get(cacheKey);
    if (hit && Date.now() - hit.at < DASH_TTL_MS) {
      return res.json(hit.payload);
    }

    const [containerAgg, salesAgg, recentSalesRaw] = await Promise.all([
      Container.aggregate([
        {
          $facet: {
            byStatus: [{ $group: { _id: '$status', count: { $sum: 1 }, purchaseSum: { $sum: '$purchasePrice' } } }],
            byType: [{ $group: { _id: '$type', value: { $sum: 1 } } }],
            bySize: [{ $group: { _id: '$size', value: { $sum: 1 } } }]
          }
        }
      ]),
      Sale.aggregate([
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  totalCount: { $sum: 1 },
                  totalRevenue: { $sum: '$sellingPrice' },
                  totalProfit: { $sum: '$profit' },
                  totalReceived: { $sum: '$amountReceived' },
                  totalOutstanding: {
                    $sum: {
                      $cond: [
                        { $ne: ['$paymentStatus', 'Full'] },
                        { $subtract: ['$sellingPrice', { $ifNull: ['$amountReceived', 0] }] },
                        0
                      ]
                    }
                  }
                }
              }
            ],
            paymentBreakdown: [{ $group: { _id: '$paymentStatus', count: { $sum: 1 } } }],
            monthlyTrend: [
              {
                $group: {
                  _id: { y: { $year: '$sellingDate' }, m: { $month: '$sellingDate' } },
                  revenue: { $sum: '$sellingPrice' },
                  profit: { $sum: '$profit' },
                  count: { $sum: 1 }
                }
              },
              { $sort: { '_id.y': -1, '_id.m': -1 } },
              { $limit: 12 }
            ],
            topBuyers: [
              {
                $group: {
                  _id: '$buyerName',
                  count: { $sum: 1 },
                  revenue: { $sum: '$sellingPrice' },
                  profit: { $sum: '$profit' }
                }
              },
              { $sort: { revenue: -1 } },
              { $limit: 5 }
            ],
            topItems: [
              { $unwind: { path: '$items', preserveNullAndEmptyArrays: false } },
              {
                $group: {
                  _id: '$items.name',
                  totalQty: { $sum: '$items.quantity' },
                  totalRevenue: { $sum: '$items.sellingPrice' },
                  unit: { $first: '$items.unit' }
                }
              },
              { $sort: { totalRevenue: -1 } },
              { $limit: 8 }
            ]
          }
        }
      ]),
      Sale.find({})
        .populate('containerId', 'containerNo size type')
        .sort({ sellingDate: -1 })
        .limit(10)
        .lean()
    ]);

    const statusMap = { Available: 0, Reserved: 0, Sold: 0 };
    let inventoryValue = 0;
    let totalContainers = 0;
    (containerAgg[0]?.byStatus || []).forEach((r) => {
      statusMap[r._id] = r.count;
      totalContainers += r.count;
      if (r._id !== 'Sold') inventoryValue += r.purchaseSum || 0;
    });

    const byType = (containerAgg[0]?.byType || []).map((r) => ({ name: r._id, value: r.value }));
    const bySize = (containerAgg[0]?.bySize || []).map((r) => ({ name: r._id, value: r.value }));

    const salesFacet = salesAgg[0] || {};
    const totals = salesFacet.totals?.[0] || {};
    const paymentMap = { Full: 0, Partial: 0, Pending: 0 };
    (salesFacet.paymentBreakdown || []).forEach((r) => {
      paymentMap[r._id] = r.count;
    });

    const monthlyTrend = (salesFacet.monthlyTrend || [])
      .map((r) => {
        const month = `${r._id.y}-${String(r._id.m).padStart(2, '0')}`;
        return {
          month,
          revenue: r.revenue || 0,
          profit: r.profit || 0,
          cost: (r.revenue || 0) - (r.profit || 0),
          count: r.count || 0
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    const topBuyers = (salesFacet.topBuyers || []).map((r) => ({
      name: r._id,
      count: r.count,
      revenue: r.revenue || 0,
      profit: r.profit || 0
    }));
    const topItems = (salesFacet.topItems || []).map((r) => ({
      name: r._id,
      totalQty: r.totalQty || 0,
      totalRevenue: r.totalRevenue || 0,
      unit: r.unit
    }));

    const response = {
      containers: {
        total: totalContainers,
        available: statusMap.Available,
        reserved: statusMap.Reserved,
        sold: statusMap.Sold,
        inventoryValue,
        byType,
        bySize,
        statusChart: ['Available', 'Reserved', 'Sold']
          .map((name) => ({ name, value: statusMap[name], color: STATUS_COLORS[name] }))
          .filter((s) => s.value > 0)
      },
      sales: {
        totalCount: totals.totalCount || 0,
        totalRevenue: totals.totalRevenue || 0,
        totalProfit: totals.totalProfit || 0,
        totalReceived: totals.totalReceived || 0,
        totalOutstanding: totals.totalOutstanding || 0,
        paymentBreakdown: ['Full', 'Partial', 'Pending']
          .map((name) => ({ name, value: paymentMap[name], color: PAYMENT_COLORS[name] }))
          .filter((s) => s.value > 0),
        monthlyTrend,
        topBuyers,
        topItems,
        recentSales: recentSalesRaw
      }
    };

    const finalPayload = req.user.role !== 'admin' ? stripProfit(response) : response;
    dashCache.set(cacheKey, { at: Date.now(), payload: finalPayload });
    res.json(finalPayload);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Helper: get ISO week string like "2024-W05"
function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 4);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// Helper: get week date range label like "Jan 06 - Jan 12, 2024"
function getWeekRange(weekKey) {
  const [yearStr, wStr] = weekKey.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  return `${fmt(monday)} - ${fmt(sunday)}, ${sunday.getFullYear()}`;
}

router.get('/summary', async (req, res) => {
  try {
    const { from, to } = req.query;

    const query = {};
    if (from || to) {
      query.sellingDate = {};
      if (from) query.sellingDate.$gte = new Date(from);
      if (to) query.sellingDate.$lte = new Date(to);
    }

    const sales = await Sale.find(query).populate('containerId').sort({ sellingDate: -1 }).limit(5000);

    const weeklySummary = {};
    const monthlySummary = {};
    const buyerSummary = {};
    const itemSummary = {};

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;

    sales.forEach(sale => {
      const revenue = sale.sellingPrice || 0;
      const profit = sale.profit || 0;
      const cost = revenue - profit;
      const received = sale.amountReceived || 0;
      const outstanding = sale.paymentStatus !== 'Full' ? (revenue - received) : 0;

      totalRevenue += revenue;
      totalCost += cost;
      totalProfit += profit;
      totalReceived += received;
      totalOutstanding += outstanding;

      // Weekly
      const weekKey = getWeekKey(sale.sellingDate);
      if (!weeklySummary[weekKey]) {
        weeklySummary[weekKey] = { week: weekKey, label: getWeekRange(weekKey), count: 0, revenue: 0, cost: 0, profit: 0, received: 0, outstanding: 0 };
      }
      weeklySummary[weekKey].count++;
      weeklySummary[weekKey].revenue += revenue;
      weeklySummary[weekKey].cost += cost;
      weeklySummary[weekKey].profit += profit;
      weeklySummary[weekKey].received += received;
      weeklySummary[weekKey].outstanding += outstanding;

      // Monthly
      const month = new Date(sale.sellingDate).toISOString().substring(0, 7);
      if (!monthlySummary[month]) {
        monthlySummary[month] = { month, count: 0, revenue: 0, cost: 0, profit: 0, received: 0, outstanding: 0 };
      }
      monthlySummary[month].count++;
      monthlySummary[month].revenue += revenue;
      monthlySummary[month].cost += cost;
      monthlySummary[month].profit += profit;
      monthlySummary[month].received += received;
      monthlySummary[month].outstanding += outstanding;

      // Buyer
      if (!buyerSummary[sale.buyerName]) {
        buyerSummary[sale.buyerName] = { name: sale.buyerName, count: 0, revenue: 0, cost: 0, profit: 0, received: 0, outstanding: 0 };
      }
      buyerSummary[sale.buyerName].count++;
      buyerSummary[sale.buyerName].revenue += revenue;
      buyerSummary[sale.buyerName].cost += cost;
      buyerSummary[sale.buyerName].profit += profit;
      buyerSummary[sale.buyerName].received += received;
      buyerSummary[sale.buyerName].outstanding += outstanding;

      // Items
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach(item => {
          const key = item.name;
          if (!itemSummary[key]) itemSummary[key] = { name: key, unit: item.unit, totalQty: 0, totalRevenue: 0, totalCost: 0 };
          itemSummary[key].totalQty += item.quantity || 0;
          itemSummary[key].totalRevenue += item.sellingPrice || 0;
          itemSummary[key].totalCost += (item.unitPrice || 0) * (item.quantity || 0);
        });
      }
    });

    const response = {
      weeklySummary: Object.values(weeklySummary).sort((a, b) => b.week.localeCompare(a.week)),
      monthlySummary: Object.values(monthlySummary).sort((a, b) => b.month.localeCompare(a.month)),
      buyerSummary: Object.values(buyerSummary).sort((a, b) => b.revenue - a.revenue),
      itemSummary: Object.values(itemSummary).sort((a, b) => b.totalRevenue - a.totalRevenue),
      totals: { totalSales: sales.length, totalRevenue, totalCost, totalProfit, totalReceived, totalOutstanding },
      sales
    };

    if (req.user.role !== 'admin') {
      return res.json(stripProfit(response));
    }

    res.json(response);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

router.get('/export/containers.xlsx', async (req, res) => {
  try {
    const containers = await Container.find({}).sort({ createdAt: -1 }).limit(10000);
    
    const data = containers.map(c => ({
      'Container No': c.containerNo,
      'Size': c.size,
      'Type': c.type,
      'Purchase Price': c.purchasePrice,
      'Purchase Date': new Date(c.purchaseDate).toISOString().split('T')[0],
      'Location': c.location,
      'Status': c.status,
      'Notes': c.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Containers');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=containers.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Export containers error:', error);
    res.status(500).json({ error: 'Failed to export containers' });
  }
});

router.get('/export/sales.xlsx', async (req, res) => {
  try {
    const sales = await Sale.find({}).populate('containerId').sort({ sellingDate: -1 }).limit(5000);
    
    const data = sales.map(s => {
      const row = {
        'Container No': s.containerId ? s.containerId.containerNo : 'N/A',
        'Buyer Name': s.buyerName,
        'Buyer Phone': s.buyerPhone || '',
        'Selling Price': s.sellingPrice,
        'Selling Date': new Date(s.sellingDate).toISOString().split('T')[0],
        'Payment Status': s.paymentStatus,
        'Amount Received': s.amountReceived,
        'Remarks': s.remarks || ''
      };

      if (req.user.role === 'admin') {
        row.Profit = s.profit;
      }

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Export sales error:', error);
    res.status(500).json({ error: 'Failed to export sales' });
  }
});

router.get('/export/summary.pdf', async (req, res) => {
  try {
    const { from, to } = req.query;

    const query = {};
    if (from || to) {
      query.sellingDate = {};
      if (from) query.sellingDate.$gte = new Date(from);
      if (to) query.sellingDate.$lte = new Date(to);
    }

    const sales = await Sale.find(query).populate('containerId').sort({ sellingDate: -1 }).limit(5000);
    const totalRevenue = sales.reduce((sum, s) => sum + (s.sellingPrice || 0), 0);
    const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);
    const totalCost = totalRevenue - totalProfit;
    const totalReceived = sales.reduce((sum, s) => sum + (s.amountReceived || 0), 0);
    const totalOutstanding = sales.filter(s => s.paymentStatus !== 'Full').reduce((sum, s) => sum + ((s.sellingPrice || 0) - (s.amountReceived || 0)), 0);
    const fullCount = sales.filter(s => s.paymentStatus === 'Full').length;
    const partialCount = sales.filter(s => s.paymentStatus === 'Partial').length;
    const pendingCount = sales.filter(s => s.paymentStatus === 'Pending').length;

    const periodLabel = from || to
      ? `${from ? new Date(from).toLocaleDateString('en-GB') : 'Start'} to ${to ? new Date(to).toLocaleDateString('en-GB') : 'Present'}`
      : 'All Time';

    const fmtAmt = (n) => 'AED ' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const showProfit = req.user.role === 'admin';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sales Report - LMH Trading</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #1e293b; font-size: 11px; background: #fff; }

    .no-print { margin-bottom: 14px; }
    .no-print button { padding: 8px 20px; border: none; cursor: pointer; font-weight: 600; font-size: 13px; color: white; background: #1a3a6b; border-radius: 2px; }

    .report-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1a3a6b; padding-bottom: 10px; margin-bottom: 14px; }
    .report-header h1 { font-size: 20px; color: #1a3a6b; font-weight: 700; }
    .report-header .meta { text-align: right; font-size: 10px; color: #64748b; line-height: 1.6; }

    .kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 14px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; }
    .kpi-card .label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 3px; }
    .kpi-card .value { font-size: 14px; font-weight: 700; color: #0f172a; }
    .kpi-card .value.green { color: #059669; }
    .kpi-card .value.red { color: #dc2626; }
    .kpi-card .value.amber { color: #d97706; }

    h2 { font-size: 13px; color: #1a3a6b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 14px 0 6px; border-bottom: 1.5px solid #cbd5e0; padding-bottom: 4px; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th { background: #1a3a6b; color: #fff; padding: 5px 8px; text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10.5px; }
    th.right, td.right { text-align: right; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge { display: inline-block; padding: 1px 6px; font-size: 8px; font-weight: 700; text-transform: uppercase; border-radius: 2px; }
    .badge-full { background: #d1fae5; color: #065f46; }
    .badge-partial { background: #fef3c7; color: #92400e; }
    .badge-pending { background: #fee2e2; color: #991b1b; }
    .profit { color: #059669; font-weight: 600; }
    .loss { color: #dc2626; font-weight: 600; }
    .items-detail { font-size: 9px; color: #64748b; margin-top: 1px; }

    .footer { margin-top: 20px; text-align: center; color: #94a3b8; font-size: 9px; border-top: 1px solid #e2e8f0; padding-top: 8px; }

    @media print {
      .no-print { display: none !important; }
      body { padding: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="report-header">
    <div>
      <h1>LMH Trading - FZCO</h1>
      <div style="font-size:10px;color:#64748b;">Sales Performance Report</div>
    </div>
    <div class="meta">
      Period: <strong>${periodLabel}</strong><br/>
      Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card"><div class="label">Total Sales</div><div class="value">${sales.length}</div></div>
    <div class="kpi-card"><div class="label">Revenue</div><div class="value">${fmtAmt(totalRevenue)}</div></div>
    <div class="kpi-card"><div class="label">Cost</div><div class="value">${fmtAmt(totalCost)}</div></div>
    ${showProfit ? `<div class="kpi-card"><div class="label">Profit</div><div class="value green">${fmtAmt(totalProfit)}</div></div>` : ''}
    <div class="kpi-card"><div class="label">Received</div><div class="value">${fmtAmt(totalReceived)}</div></div>
    <div class="kpi-card"><div class="label">Outstanding</div><div class="value ${totalOutstanding > 0 ? 'amber' : ''}">${fmtAmt(totalOutstanding)}</div></div>
  </div>

  <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);">
    <div class="kpi-card"><div class="label">Fully Paid</div><div class="value green">${fullCount}</div></div>
    <div class="kpi-card"><div class="label">Partial</div><div class="value amber">${partialCount}</div></div>
    <div class="kpi-card"><div class="label">Pending</div><div class="value red">${pendingCount}</div></div>
  </div>

  <h2>Sales Details</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Date</th>
        <th>Container</th>
        <th>Buyer</th>
        <th>Items</th>
        <th class="right">Revenue</th>
        <th class="right">Cost</th>
        ${showProfit ? '<th class="right">Profit</th>' : ''}
        <th class="right">Received</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${sales.map((s, idx) => {
        const cost = (s.sellingPrice || 0) - (s.profit || 0);
        const itemsText = s.items && s.items.length > 0
          ? s.items.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')
          : '-';
        const badgeClass = s.paymentStatus === 'Full' ? 'badge-full' : s.paymentStatus === 'Partial' ? 'badge-partial' : 'badge-pending';
        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${new Date(s.sellingDate).toLocaleDateString('en-GB')}</td>
            <td style="font-family:monospace;font-weight:600;">${s.containerId ? s.containerId.containerNo : 'N/A'}</td>
            <td>${s.buyerName}</td>
            <td><div class="items-detail">${itemsText}</div></td>
            <td class="right">${fmtAmt(s.sellingPrice)}</td>
            <td class="right">${fmtAmt(cost)}</td>
            ${showProfit ? `<td class="right ${s.profit >= 0 ? 'profit' : 'loss'}">${fmtAmt(s.profit)}</td>` : ''}
            <td class="right">${fmtAmt(s.amountReceived)}</td>
            <td><span class="badge ${badgeClass}">${s.paymentStatus}</span></td>
          </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    LMH Trading - FZCO | IFZA Business Park, Dubai Silicon Oasis, UAE | Generated on ${new Date().toLocaleString('en-GB')}
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// Number to words (Indian numbering system)
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function twoDigits(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  }

  function threeDigits(n) {
    if (n < 100) return twoDigits(n);
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigits(n % 100) : '');
  }

  const intPart = Math.floor(Math.abs(num));
  if (intPart === 0) return 'Zero';

  let result = '';
  const crores = Math.floor(intPart / 10000000);
  if (crores > 0) result += twoDigits(crores) + ' Crore ';
  const lakhs = Math.floor((intPart % 10000000) / 100000);
  if (lakhs > 0) result += twoDigits(lakhs) + ' Lakh ';
  const thousands = Math.floor((intPart % 100000) / 1000);
  if (thousands > 0) result += twoDigits(thousands) + ' Thousand ';
  const remainder = intPart % 1000;
  if (remainder > 0) result += threeDigits(remainder);

  return result.trim();
}

function formatAmount(num) {
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

router.get('/invoice/:saleId', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.saleId).populate('containerId');
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const container = sale.containerId;
    const invoiceNo = await Sale.countDocuments({ _id: { $lte: sale._id } });
    const balance = sale.sellingPrice - sale.amountReceived;
    const amountInWords = numberToWords(sale.sellingPrice);

    const hasItems = sale.items && sale.items.length > 0;

    // Build items rows
    let itemsRowsHtml = '';
    if (hasItems) {
      sale.items.forEach((item, idx) => {
        const unitSP = item.quantity > 0 ? (item.sellingPrice || 0) / item.quantity : 0;
        itemsRowsHtml += `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.quantity || 0}</td>
            <td>${item.unit || '-'}</td>
            <td class="right">AED ${formatAmount(unitSP)}</td>
            <td class="right">AED ${formatAmount(item.sellingPrice || 0)}</td>
          </tr>`;
      });
    } else {
      const saleQty = sale.quantity || 1;
      const saleUnit = sale.unit || 'Unit';
      const pricePerUnit = sale.sellingPrice / saleQty;
      itemsRowsHtml = `
        <tr>
          <td>1</td>
          <td><strong>CONTAINER ${container ? container.containerNo : 'N/A'}</strong></td>
          <td>${saleQty}</td>
          <td>${saleUnit}</td>
          <td class="right">AED ${formatAmount(pricePerUnit)}</td>
          <td class="right">AED ${formatAmount(sale.sellingPrice)}</td>
        </tr>`;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoiceNo} - ${container ? container.containerNo : 'N/A'}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #2d3748; max-width: 820px; margin: 0 auto; background: #fff; font-size: 12px; }

    .no-print { margin-bottom: 16px; display: flex; gap: 8px; }
    .no-print button {
      padding: 8px 20px; border: none; cursor: pointer; border-radius: 2px;
      font-weight: 600; font-size: 13px; color: white; background: #1a3a6b;
    }

    .header { display: flex; justify-content: space-between; align-items: flex-start; }
    .company-info { max-width: 450px; }
    .company-name { font-size: 20px; font-weight: bold; color: #1a3a6b; letter-spacing: 0.5px; }
    .company-detail { font-size: 10.5px; color: #4a5568; line-height: 1.6; margin-top: 3px; }
    .logo { width: 90px; height: 90px; object-fit: contain; }

    .invoice-title {
      text-align: center; font-size: 18px; font-weight: bold;
      color: #1a3a6b; border-top: 2px solid #1a3a6b; border-bottom: 2px solid #1a3a6b;
      padding: 6px 0; margin: 10px 0;
    }

    .bill-section { display: flex; justify-content: space-between; margin: 12px 0 10px; }
    .bill-to { flex: 1; }
    .section-label { font-weight: bold; font-size: 12px; color: #1a3a6b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .buyer-name { font-weight: bold; font-size: 13px; color: #1a3a6b; }
    .detail-text { font-size: 11px; color: #4a5568; line-height: 1.7; }
    .invoice-details { text-align: right; }

    .container-info { background: #f1f5f9; padding: 8px 12px; margin-bottom: 8px; border-left: 3px solid #1a3a6b; }
    .container-info span { font-size: 11px; color: #475569; margin-right: 16px; }
    .container-info strong { color: #1a3a6b; }

    .items-table { width: 100%; border-collapse: collapse; margin: 6px 0; }
    .items-table th {
      background: #1a3a6b; color: #fff; padding: 7px 10px;
      text-align: left; font-weight: 600; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .items-table th.right, .items-table td.right { text-align: right; }
    .items-table td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11.5px; }
    .items-table .total-row td { font-weight: bold; border-top: 2px solid #1a3a6b; border-bottom: 2px solid #1a3a6b; background: #f8fafc; }
    .items-table .subtotal-row td { font-weight: 600; border-top: 1px solid #94a3b8; background: #f8fafc; font-size: 11px; }

    .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; margin-top: 8px; gap: 12px; }
    .bottom-left { }
    .bottom-right { }

    .section-header { background: #1a3a6b; color: #fff; padding: 4px 10px; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .section-box { padding: 7px 10px; font-size: 11px; line-height: 1.6; border: 1px solid #cbd5e0; border-top: none; min-height: 28px; color: #2d3748; }

    .amounts-table { width: 100%; border-collapse: collapse; }
    .amounts-table td { padding: 6px 10px; font-size: 11.5px; border: 1px solid #cbd5e0; }
    .amounts-table .total-row td { font-weight: bold; font-size: 12px; background: #f1f5f9; }
    .amounts-table td:last-child { text-align: right; font-family: 'Segoe UI', monospace; }

    .signatory-box {
      margin-top: 16px; padding: 12px; text-align: right;
      border: 1px solid #cbd5e0; min-height: 80px;
      display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end;
    }
    .signatory-name { font-size: 11px; color: #1a3a6b; font-weight: 600; }
    .signatory-label { font-weight: bold; font-style: italic; font-size: 11px; color: #2d3748; }

    .spacer { margin-top: 8px; }
    .payment-badge { display: inline-block; padding: 2px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 2px; }
    .badge-full { background: #d1fae5; color: #065f46; }
    .badge-partial { background: #fef3c7; color: #92400e; }
    .badge-pending { background: #fee2e2; color: #991b1b; }

    @media print {
      .no-print { display: none !important; }
      body { padding: 15px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div class="company-info">
      <div class="company-name">LMH Trading - FZCO</div>
      <div class="company-detail">
        IFZA Business Park, Dubai Digital Park<br/>
        Premises No: 55507-001, Building A1<br/>
        Dubai Silicon Oasis, Dubai, UAE
      </div>
    </div>
    ${logoDataUri ? `<img src="${logoDataUri}" class="logo" />` : '<div class="logo" style="background:#1a3a6b;display:flex;align-items:center;justify-content:center;color:#e8b830;font-size:28px;font-weight:bold;font-family:serif;border-radius:4px;">LMH</div>'}
  </div>
  <div class="invoice-title">Tax Invoice</div>

  <div class="bill-section">
    <div class="bill-to">
      <div class="section-label">Bill To</div>
      <div class="buyer-name">${sale.buyerName}</div>
      <div class="detail-text">
        ${sale.buyerPhone ? 'Phone: ' + sale.buyerPhone : ''}
      </div>
    </div>
    <div class="invoice-details">
      <div class="section-label">Invoice Details</div>
      <div class="detail-text">
        Invoice No.: <strong>${invoiceNo}</strong><br/>
        Date: <strong>${formatDate(sale.sellingDate)}</strong><br/>
        Status: <span class="payment-badge ${sale.paymentStatus === 'Full' ? 'badge-full' : sale.paymentStatus === 'Partial' ? 'badge-partial' : 'badge-pending'}">${sale.paymentStatus}</span>
      </div>
    </div>
  </div>

  ${container ? `
  <div class="container-info">
    <span>Container: <strong>${container.containerNo}</strong></span>
    <span>Size: <strong>${container.size}</strong></span>
    <span>Type: <strong>${container.type}</strong></span>
  </div>` : ''}

  <table class="items-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Item</th>
        <th>Qty</th>
        <th>Unit</th>
        <th class="right">Rate</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRowsHtml}
      <tr class="subtotal-row">
        <td></td>
        <td>Sub Total</td>
        <td></td>
        <td></td>
        <td></td>
        <td class="right">AED ${formatAmount(sale.sellingPrice)}</td>
      </tr>
      <tr class="total-row">
        <td></td>
        <td><strong>Total Amount</strong></td>
        <td></td>
        <td></td>
        <td></td>
        <td class="right"><strong>AED ${formatAmount(sale.sellingPrice)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="bottom-grid">
    <div class="bottom-left">
      <div class="section-header">Amount In Words</div>
      <div class="section-box">${amountInWords} Dirhams Only</div>

      <div class="section-header spacer">Description</div>
      <div class="section-box">
        ${container ? 'Container: ' + container.containerNo + '<br/>' : ''}
        ${container ? 'Size: ' + container.size + ' | Type: ' + container.type : ''}
        ${sale.remarks ? '<br/>Remarks: ' + sale.remarks : ''}
      </div>

      <div class="section-header spacer">Terms &amp; Conditions</div>
      <div class="section-box">Thanks for doing business with us!</div>

      <div class="section-header spacer">Bank Details</div>
      <div class="section-box">Account Holder: LMH Trading - FZCO</div>
    </div>

    <div class="bottom-right">
      <table class="amounts-table">
        <tr><td class="section-header" colspan="2" style="text-align:left;">Payment Summary</td></tr>
        <tr><td>Sub Total</td><td>AED ${formatAmount(sale.sellingPrice)}</td></tr>
        <tr class="total-row"><td><strong>Total Due</strong></td><td><strong>AED ${formatAmount(sale.sellingPrice)}</strong></td></tr>
        <tr><td>Amount Received</td><td>AED ${formatAmount(sale.amountReceived)}</td></tr>
        <tr style="${balance > 0 ? 'color:#dc2626;font-weight:600;' : ''}"><td>Balance Due</td><td>AED ${formatAmount(balance)}</td></tr>
      </table>

      <div class="signatory-box">
        <div class="signatory-name">For: LMH Trading - FZCO</div>
        <div class="signatory-label">Authorized Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

module.exports = router;
