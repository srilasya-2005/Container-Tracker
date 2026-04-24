const express = require('express');
const Container = require('../models/Container');
const Sale = require('../models/Sale');
const User = require('../models/User');
const EmployeeActivity = require('../models/EmployeeActivity');
const Investor = require('../models/Investor');
const ContainerInvestment = require('../models/ContainerInvestment');
const Payout = require('../models/Payout');
const Notification = require('../models/Notification');
const { authMiddleware, requireRole, investorAuth } = require('../middleware/auth');
const { createEmployeeOnboardingNotification, broadcastAdminUpdate } = require('../services/notificationService');
const { verifyTransport, getSmtpStatus, sendEmail } = require('../services/emailService');
const router = express.Router();

const adminDashCache = new Map();
const ADMIN_DASH_TTL_MS = 30_000;

router.get('/dashboard', authMiddleware, requireRole('admin', 'finance'), async (req, res) => {
  try {
    const cacheKey = req.user.role;
    const hit = adminDashCache.get(cacheKey);
    if (hit && Date.now() - hit.at < ADMIN_DASH_TTL_MS) {
      return res.json(hit.payload);
    }

    const now = new Date();

    const [containerAgg, salesAgg, investorCount, activeInvestorCount, investmentAgg, payoutAgg, investments, recentSalesRaw, recentActivity] = await Promise.all([
      Container.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, purchaseSum: { $sum: '$purchasePrice' } } }]),
      Sale.aggregate([
        {
          $facet: {
            totals: [{ $group: { _id: null, revenue: { $sum: '$sellingPrice' }, profit: { $sum: '$profit' } } }],
            receivables: [
              { $match: { paymentStatus: 'Pending' } },
              { $group: { _id: null, total: { $sum: '$sellingPrice' } } }
            ]
          }
        }
      ]),
      Investor.countDocuments({}),
      Investor.countDocuments({ status: 'Active' }),
      ContainerInvestment.aggregate([
        {
          $facet: {
            totals: [{ $group: { _id: null, amount: { $sum: '$investmentAmount' }, count: { $sum: 1 } } }],
            active: [{ $match: { status: 'Active' } }, { $count: 'n' }]
          }
        }
      ]),
      Payout.aggregate([
        {
          $facet: {
            byStatus: [{ $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }],
            overdue: [{ $match: { status: 'Pending', dueDate: { $lt: now } } }, { $count: 'n' }],
            upcoming: [
              {
                $match: {
                  status: 'Pending',
                  dueDate: { $gte: now, $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }
                }
              },
              { $sort: { dueDate: 1 } },
              { $limit: 25 },
              {
                $lookup: {
                  from: 'investors',
                  localField: 'investorId',
                  foreignField: '_id',
                  as: 'investorId',
                  pipeline: [{ $project: { name: 1, email: 1 } }]
                }
              },
              {
                $lookup: {
                  from: 'containers',
                  localField: 'containerId',
                  foreignField: '_id',
                  as: 'containerId',
                  pipeline: [{ $project: { containerNo: 1, size: 1 } }]
                }
              },
              { $unwind: { path: '$investorId', preserveNullAndEmptyArrays: true } },
              { $unwind: { path: '$containerId', preserveNullAndEmptyArrays: true } }
            ]
          }
        }
      ]),
      ContainerInvestment.find({}, 'containerId investorId investmentAmount profitSharePercent status').lean(),
      Sale.find({}).populate('containerId', 'containerNo size type').sort({ sellingDate: -1 }).limit(10).lean(),
      Notification.find({}).sort({ createdAt: -1 }).limit(10).lean()
    ]);

    const containerStatusMap = { Available: 0, Reserved: 0, Sold: 0 };
    let inventoryValue = 0;
    let totalContainers = 0;
    containerAgg.forEach((r) => {
      containerStatusMap[r._id] = r.count;
      totalContainers += r.count;
      if (r._id === 'Available') inventoryValue += r.purchaseSum || 0;
    });
    const available = containerStatusMap.Available;
    const sold = containerStatusMap.Sold;

    const salesFacet = salesAgg[0] || {};
    const totalRevenue = salesFacet.totals?.[0]?.revenue || 0;
    const totalProfit = salesFacet.totals?.[0]?.profit || 0;
    const totalReceivables = salesFacet.receivables?.[0]?.total || 0;

    const invFacet = investmentAgg[0] || {};
    const totalInvestments = invFacet.totals?.[0]?.amount || 0;
    const activeInvestments = invFacet.active?.[0]?.n || 0;

    const payoutFacet = payoutAgg[0] || {};
    let pendingPayoutCount = 0;
    let totalPayoutLiabilities = 0;
    (payoutFacet.byStatus || []).forEach((r) => {
      if (r._id === 'Pending') pendingPayoutCount = r.count;
      if (r._id === 'Pending' || r._id === 'Overdue') totalPayoutLiabilities += r.amount || 0;
    });
    const overduePayoutCount = payoutFacet.overdue?.[0]?.n || 0;
    const upcomingPayouts = payoutFacet.upcoming || [];

    const containerInvestmentMap = {};
    investments.forEach((inv) => {
      const key = String(inv.containerId);
      if (!containerInvestmentMap[key]) containerInvestmentMap[key] = [];
      containerInvestmentMap[key].push(inv);
    });

    const response = {
      overview: {
        totalContainers,
        availableContainers: available,
        soldContainers: sold,
        inventoryValue,
        totalProfit,
        totalRevenue,
        totalInvestors: investorCount,
        activeInvestors: activeInvestorCount,
        totalInvestments,
        activeInvestments,
        totalPayoutLiabilities,
        totalReceivables
      },
      alerts: {
        overduePayments: 0,
        overduePayouts: overduePayoutCount,
        pendingPayouts: pendingPayoutCount
      },
      containerInvestmentMap,
      recentSales: recentSalesRaw,
      upcomingPayouts,
      recentActivity
    };

    if (req.user.role !== 'admin') {
      delete response.overview.totalProfit;
      response.recentSales = response.recentSales.map((sale) => {
        const { profit, ...rest } = sale;
        return rest;
      });
    }

    adminDashCache.set(cacheKey, { at: Date.now(), payload: response });
    res.json(response);
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.get('/investor/dashboard', investorAuth, async (req, res) => {
  try {
    const [investor, investments, payouts, notifications] = await Promise.all([
      Investor.findById(req.investor.id).select('-password'),
      ContainerInvestment.find({ investorId: req.investor.id }).populate('containerId'),
      Payout.find({ investorId: req.investor.id }).populate('containerId'),
      Notification.find({ userId: req.investor.id, userType: 'Investor' })
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    const activeInvestments = investments.filter(i => i.status === 'Active');
    const completedInvestments = investments.filter(i => i.status === 'Completed');

    const totalInvested = investments.reduce((sum, i) => sum + i.investmentAmount, 0);
    const activeInvestmentValue = activeInvestments.reduce((sum, i) => sum + i.investmentAmount, 0);

    const totalReturns = payouts
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayouts = payouts.filter(p => p.status === 'Pending' || p.status === 'Overdue');
    const expectedReturns = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

    const investmentDetails = await Promise.all(
      investments.map(async (inv) => {
        const sale = await require('../models/Sale').findOne({ containerId: inv.containerId });
        const invPayouts = payouts.filter(p => p.investmentId && p.investmentId.toString() === inv._id.toString());

        let expectedReturn = 0;
        let actualReturn = 0;

        if (sale && inv.status === 'Completed') {
          expectedReturn = inv.investmentAmount + (sale.profit * inv.profitSharePercent / 100);
          actualReturn = invPayouts.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
        } else if (sale) {
          expectedReturn = inv.investmentAmount + (sale.profit * inv.profitSharePercent / 100);
        }

        return {
          ...inv.toObject(),
          sale: sale ? {
            sellingPrice: sale.sellingPrice,
            sellingDate: sale.sellingDate,
            profit: sale.profit
          } : null,
          expectedReturn,
          actualReturn,
          payouts: invPayouts
        };
      })
    );

    res.json({
      investor,
      summary: {
        totalInvested,
        activeInvestments: activeInvestments.length,
        completedInvestments: completedInvestments.length,
        activeInvestmentValue,
        totalReturns,
        expectedReturns,
        netProfit: totalReturns - totalInvested
      },
      investments: investmentDetails,
      payouts,
      notifications
    });
  } catch (error) {
    console.error('Get investor dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const { unread, page = 1, limit = 20 } = req.query;

    const query = { userId: req.user.id, userType: 'User' };
    if (unread === 'true') {
      query.read = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ ...query, read: false });

    res.json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/investor/notifications', investorAuth, async (req, res) => {
  try {
    const { unread, page = 1, limit = 20 } = req.query;

    const query = { userId: req.investor.id, userType: 'Investor' };
    if (unread === 'true') {
      query.read = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ ...query, read: false });

    res.json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get investor notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// ============ SMTP DIAGNOSTICS (admin only) ============

// GET SMTP status + optional verify
router.get('/email/status', authMiddleware, requireRole('admin'), async (req, res) => {
  const status = getSmtpStatus();
  let verify = null;
  if (req.query.verify === 'true' && status.configured) {
    verify = await verifyTransport();
  }
  res.json({ status, verify });
});

// POST send a test email to a given address
router.post('/email/test', authMiddleware, requireRole('admin'), async (req, res) => {
  const to = (req.body?.to || '').trim();
  if (!to) return res.status(400).json({ error: 'Recipient "to" is required' });

  const subject = 'SMTP test - LMH Group Container Tracker';
  const html = `
    <p>Hello,</p>
    <p>This is a test email from the deployed Container Tracker backend.</p>
    <p>If you received this, SMTP is working from the deployment environment.</p>
    <p>Sent at: ${new Date().toISOString()}</p>
  `;
  const result = await sendEmail(to, subject, html);
  res.status(result.success ? 200 : 502).json({
    status: getSmtpStatus(),
    result
  });
});

// ============ EMPLOYEE MANAGEMENT ============

// GET all employees - admin only
router.get('/employees', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    next(error);
  }
});

// POST create employee - admin only
router.post('/employees', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    const employee = new User({ email, password, name, role: 'employee', mustResetPassword: true });
    await employee.save();

    const { emailResult } = await createEmployeeOnboardingNotification({
      employee,
      tempPassword: password,
      createdBy: req.user.id
    });

    res.status(201).json({
      id: employee._id,
      email: employee.email,
      name: employee.name,
      role: employee.role,
      isActive: employee.isActive,
      emailSent: emailResult?.success === true,
      emailError: emailResult?.success ? null : (emailResult?.error || 'Email not sent')
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    next(error);
  }
});

router.post('/notifications/broadcast', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const result = await broadcastAdminUpdate({
      title: title.trim(),
      message: message.trim(),
      createdBy: req.user.id
    });

    res.status(201).json({ message: 'Notification sent', count: result.count });
  } catch (error) {
    next(error);
  }
});

// DELETE employee - admin only
router.delete('/employees/:id', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(`[DELETE /employees/${id}] requested by ${req.user.email}`);

    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    if (employee.role !== 'employee') {
      return res.status(400).json({ error: 'Only employee accounts can be deleted from here' });
    }
    if (employee._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Intentionally preserve EmployeeActivity records so historical work stays in reports.
    await Promise.all([
      User.findByIdAndDelete(id),
      Notification.deleteMany({ userId: id, userType: 'User' })
    ]);

    console.log(`[DELETE /employees/${id}] deleted ${employee.email}`);
    res.json({ message: 'Employee deleted successfully', id });
  } catch (error) {
    console.error(`[DELETE /employees/${req.params.id}] error:`, error);
    next(error);
  }
});

// PUT toggle employee active status - admin only
router.put('/employees/:id/toggle-active', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ error: 'Employee not found' });
    }
    employee.isActive = !employee.isActive;
    await employee.save();
    res.json({ id: employee._id, isActive: employee.isActive });
  } catch (error) {
    next(error);
  }
});

// GET employee performance - admin only (aggregation pipeline)
router.get('/employees/performance', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const matchStage = {};
    if (from || to) {
      matchStage.timestamp = {};
      if (from) matchStage.timestamp.$gte = new Date(from);
      if (to) matchStage.timestamp.$lte = new Date(to);
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$employeeId',
          totalActions: { $sum: 1 },
          containersAdded: {
            $sum: { $cond: [{ $eq: ['$actionType', 'ADD_CONTAINER'] }, 1, 0] }
          },
          containersSold: {
            $sum: { $cond: [{ $eq: ['$actionType', 'SELL_CONTAINER'] }, 1, 0] }
          },
          avgTimeSpent: { $avg: '$timeSpent' },
          totalTimeSpent: { $sum: '$timeSpent' },
          lastActivity: { $max: '$timestamp' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          employeeId: '$_id',
          employeeName: { $ifNull: ['$employee.name', 'Deleted employee'] },
          employeeEmail: { $ifNull: ['$employee.email', ''] },
          isActive: { $ifNull: ['$employee.isActive', false] },
          isDeleted: { $cond: [{ $not: ['$employee'] }, true, false] },
          totalActions: 1,
          containersAdded: 1,
          containersSold: 1,
          avgTimeSpent: { $round: ['$avgTimeSpent', 0] },
          totalTimeSpent: 1,
          lastActivity: 1
        }
      },
      { $sort: { totalActions: -1 } }
    ];

    const performance = await EmployeeActivity.aggregate(pipeline);

    // Get revenue/profit generated per employee via sales
    const dateFilter = {};
    if (from || to) {
      dateFilter.sellingDate = {};
      if (from) dateFilter.sellingDate.$gte = new Date(from);
      if (to) dateFilter.sellingDate.$lte = new Date(to);
    }

    const salesByEmployee = await Sale.aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $match: { soldBy: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$soldBy',
          totalRevenue: { $sum: '$sellingPrice' },
          totalProfit: { $sum: '$profit' },
          salesCount: { $sum: 1 }
        }
      }
    ]);

    const salesMap = {};
    salesByEmployee.forEach(s => {
      if (s._id) salesMap[s._id.toString()] = s;
    });

    const enriched = performance.map(p => ({
      ...p,
      totalRevenue: salesMap[p.employeeId.toString()]?.totalRevenue || 0,
      totalProfit: salesMap[p.employeeId.toString()]?.totalProfit || 0,
      salesCount: salesMap[p.employeeId.toString()]?.salesCount || 0
    }));

    // Include employees with no activity
    const allEmployees = await User.find({ role: 'employee' }).select('-password').lean();
    const activeEmployeeIds = new Set(enriched.map(p => p.employeeId.toString()));
    const inactiveEmployees = allEmployees
      .filter(e => !activeEmployeeIds.has(e._id.toString()))
      .map(e => ({
        employeeId: e._id,
        employeeName: e.name,
        employeeEmail: e.email,
        isActive: e.isActive,
        totalActions: 0,
        containersAdded: 0,
        containersSold: 0,
        avgTimeSpent: 0,
        totalTimeSpent: 0,
        lastActivity: null,
        totalRevenue: 0,
        totalProfit: 0,
        salesCount: 0
      }));

    res.json([...enriched, ...inactiveEmployees]);
  } catch (error) {
    next(error);
  }
});

// GET employee activity log - admin only
router.get('/employees/:id/activity', authMiddleware, requireRole('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const activities = await EmployeeActivity.find({ employeeId: req.params.id })
      .populate('containerId', 'containerNo size type')
      .populate('saleId', 'buyerName sellingPrice profit')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EmployeeActivity.countDocuments({ employeeId: req.params.id });

    res.json({
      activities,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
