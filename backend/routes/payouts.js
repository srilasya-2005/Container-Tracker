const express = require('express');
const Payout = require('../models/Payout');
const Investor = require('../models/Investor');
const ContainerInvestment = require('../models/ContainerInvestment');
const Notification = require('../models/Notification');
const { authMiddleware, requireRole, investorAuth } = require('../middleware/auth');
const { sendInvestmentReturnEmail } = require('../services/emailService');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { investorId, status, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (investorId) query.investorId = investorId;
    if (status) query.status = status;

    if (req.user.role === 'ops') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payouts, total] = await Promise.all([
      Payout.find(query)
        .populate('investorId', 'name email')
        .populate('containerId', 'containerNo size type')
        .populate('saleId', 'buyerName sellingPrice sellingDate')
        .populate('investmentId', 'investmentAmount profitSharePercent')
        .sort({ dueDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Payout.countDocuments(query)
    ]);

    res.json({
      payouts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

router.get('/investor/my-payouts', investorAuth, async (req, res) => {
  try {
    const payouts = await Payout.find({ investorId: req.investor.id })
      .populate('containerId', 'containerNo size type')
      .populate('saleId', 'buyerName sellingPrice sellingDate')
      .populate('investmentId', 'investmentAmount profitSharePercent')
      .sort({ dueDate: -1 })
      .lean();

    res.json({ payouts });
  } catch (error) {
    console.error('Get investor payouts error:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

router.post('/', authMiddleware, requireRole('admin', 'finance'), async (req, res) => {
  try {
    const payout = new Payout(req.body);
    await payout.save();

    const populatedPayout = await Payout.findById(payout._id)
      .populate('investorId containerId saleId investmentId');

    res.status(201).json(populatedPayout);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Create payout error:', error);
    res.status(500).json({ error: 'Failed to create payout' });
  }
});

router.put('/:id/mark-paid', authMiddleware, requireRole('admin', 'finance'), async (req, res) => {
  try {
    const { paymentMethod, notes } = req.body;
    
    const payout = await Payout.findById(req.params.id)
      .populate('investorId containerId investmentId');
    
    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    if (payout.status === 'Paid') {
      return res.status(400).json({ error: 'Payout already marked as paid' });
    }

    payout.status = 'Paid';
    payout.paidDate = new Date();
    if (paymentMethod) payout.paymentMethod = paymentMethod;
    if (notes) payout.notes = notes;
    await payout.save();

    const investor = await Investor.findById(payout.investorId);
    if (investor) {
      investor.totalReturns = (investor.totalReturns || 0) + payout.amount;
      await investor.save();
    }

    const investment = await ContainerInvestment.findById(payout.investmentId);
    if (investment && investment.status === 'Active') {
      investment.status = 'Completed';
      await investment.save();
    }

    await Notification.create({
      userId: payout.investorId._id,
      userType: 'Investor',
      type: 'investment_return',
      title: `Investment Return Paid - ${payout.containerId.containerNo}`,
      message: `Your payout of $${payout.amount.toLocaleString()} has been processed`,
      metadata: {
        payoutId: payout._id,
        containerId: payout.containerId._id,
        amount: payout.amount
      }
    });

    if (investment && payout.investorId) {
      const profit = payout.amount - investment.investmentAmount;
      await sendInvestmentReturnEmail(
        payout.investorId.email,
        payout.investorId.name,
        payout.containerId.containerNo,
        investment.investmentAmount,
        payout.amount,
        profit
      );
    }

    res.json(payout);
  } catch (error) {
    console.error('Mark payout paid error:', error);
    res.status(500).json({ error: 'Failed to mark payout as paid' });
  }
});

router.put('/:id', authMiddleware, requireRole('admin', 'finance'), async (req, res) => {
  try {
    const payout = await Payout.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('investorId containerId saleId investmentId');
    
    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }
    
    res.json(payout);
  } catch (error) {
    console.error('Update payout error:', error);
    res.status(500).json({ error: 'Failed to update payout' });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    if (payout.status === 'Paid') {
      return res.status(400).json({ error: 'Cannot delete paid payout' });
    }

    await payout.deleteOne();
    res.json({ message: 'Payout deleted successfully' });
  } catch (error) {
    console.error('Delete payout error:', error);
    res.status(500).json({ error: 'Failed to delete payout' });
  }
});

module.exports = router;
