const express = require('express');
const Investor = require('../models/Investor');
const ContainerInvestment = require('../models/ContainerInvestment');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);
router.use(requireRole('admin', 'finance'));

router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const investors = await Investor.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Investor.countDocuments(query);

    res.json({
      investors,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get investors error:', error);
    res.status(500).json({ error: 'Failed to fetch investors' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const investor = await Investor.findById(req.params.id).select('-password');
    if (!investor) {
      return res.status(404).json({ error: 'Investor not found' });
    }

    const investments = await ContainerInvestment.find({ investorId: investor._id })
      .populate('containerId');

    res.json({ investor, investments });
  } catch (error) {
    console.error('Get investor error:', error);
    res.status(500).json({ error: 'Failed to fetch investor' });
  }
});

router.post('/', async (req, res) => {
  try {
    const investor = new Investor(req.body);
    await investor.save();
    
    const investorData = investor.toObject();
    delete investorData.password;
    
    res.status(201).json(investorData);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Create investor error:', error);
    res.status(500).json({ error: 'Failed to create investor' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    
    const investor = await Investor.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!investor) {
      return res.status(404).json({ error: 'Investor not found' });
    }
    
    res.json(investor);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Update investor error:', error);
    res.status(500).json({ error: 'Failed to update investor' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const investments = await ContainerInvestment.countDocuments({ investorId: req.params.id, status: 'Active' });
    if (investments > 0) {
      return res.status(400).json({ error: 'Cannot delete investor with active investments' });
    }
    
    const investor = await Investor.findByIdAndDelete(req.params.id);
    if (!investor) {
      return res.status(404).json({ error: 'Investor not found' });
    }
    
    res.json({ message: 'Investor deleted successfully' });
  } catch (error) {
    console.error('Delete investor error:', error);
    res.status(500).json({ error: 'Failed to delete investor' });
  }
});

module.exports = router;
