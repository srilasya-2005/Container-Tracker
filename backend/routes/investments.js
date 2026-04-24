const express = require('express');
const ContainerInvestment = require('../models/ContainerInvestment');
const Container = require('../models/Container');
const Investor = require('../models/Investor');
const { authMiddleware, requireRole, investorAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { containerId, investorId, status, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (containerId) query.containerId = containerId;
    if (investorId) query.investorId = investorId;
    if (status) query.status = status;

    if (req.user.role === 'ops') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [investments, total] = await Promise.all([
      ContainerInvestment.find(query)
        .populate('containerId', 'containerNo size type status purchasePrice')
        .populate('investorId', 'name email status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ContainerInvestment.countDocuments(query)
    ]);

    res.json({
      investments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

router.get('/investor/my-investments', investorAuth, async (req, res) => {
  try {
    const investments = await ContainerInvestment.find({ investorId: req.investor.id })
      .populate('containerId', 'containerNo size type status purchasePrice purchaseDate')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ investments });
  } catch (error) {
    console.error('Get investor investments error:', error);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

router.post('/', authMiddleware, requireRole('admin', 'finance'), async (req, res) => {
  try {
    const { containerId, investorId, investmentAmount, profitSharePercent } = req.body;

    const container = await Container.findById(containerId);
    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }

    const investor = await Investor.findById(investorId);
    if (!investor) {
      return res.status(404).json({ error: 'Investor not found' });
    }

    const investment = new ContainerInvestment(req.body);
    await investment.save();

    investor.totalInvested = (investor.totalInvested || 0) + investmentAmount;
    await investor.save();

    const populatedInvestment = await ContainerInvestment.findById(investment._id)
      .populate('containerId investorId', '-password');

    res.status(201).json(populatedInvestment);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Create investment error:', error);
    res.status(500).json({ error: 'Failed to create investment' });
  }
});

router.put('/:id', authMiddleware, requireRole('admin', 'finance'), async (req, res) => {
  try {
    const investment = await ContainerInvestment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('containerId investorId', '-password');
    
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    
    res.json(investment);
  } catch (error) {
    console.error('Update investment error:', error);
    res.status(500).json({ error: 'Failed to update investment' });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const investment = await ContainerInvestment.findById(req.params.id);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    if (investment.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot delete completed investment' });
    }

    await investment.deleteOne();
    
    const investor = await Investor.findById(investment.investorId);
    if (investor) {
      investor.totalInvested = Math.max(0, (investor.totalInvested || 0) - investment.investmentAmount);
      await investor.save();
    }
    
    res.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    console.error('Delete investment error:', error);
    res.status(500).json({ error: 'Failed to delete investment' });
  }
});

module.exports = router;
