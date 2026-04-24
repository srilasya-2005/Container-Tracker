const express = require('express');
const Container = require('../models/Container');
const Sale = require('../models/Sale');
const EmployeeActivity = require('../models/EmployeeActivity');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET all containers - all authenticated users
router.get('/', async (req, res, next) => {
  try {
    const { search, status, size, type, location, page = 1, limit = 50 } = req.query;

    const query = {};

    if (search) {
      query.containerNo = { $regex: search, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    if (size) {
      query.size = size;
    }
    if (type) {
      query.type = type;
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [containers, total] = await Promise.all([
      Container.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Container.countDocuments(query)
    ]);

    res.json({
      containers,
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

// GET single container - all authenticated users
router.get('/:id', async (req, res, next) => {
  try {
    const container = await Container.findById(req.params.id);
    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }
    res.json(container);
  } catch (error) {
    next(error);
  }
});

// POST create container - all authenticated users
router.post('/', async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user.id };
    // Auto-calculate purchasePrice from items
    if (data.items && data.items.length > 0) {
      data.purchasePrice = data.items.reduce((sum, item) => {
        return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0));
      }, 0);
    }
    const container = new Container(data);
    await container.save();

    // Log employee activity
    await EmployeeActivity.create({
      employeeId: req.user.id,
      actionType: 'ADD_CONTAINER',
      containerId: container._id,
      timeSpent: req.body.timeSpent || 0
    });

    res.status(201).json(container);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Container number already exists' });
    }
    next(error);
  }
});

// PUT update container - admin, finance, ops only (employees cannot edit)
router.put('/:id', requireRole('admin', 'finance', 'ops'), async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.containerNo;
    // Auto-calculate purchasePrice from items
    if (updates.items && updates.items.length > 0) {
      updates.purchasePrice = updates.items.reduce((sum, item) => {
        return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0));
      }, 0);
    }

    const container = await Container.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }

    res.json(container);
  } catch (error) {
    if (error.name === 'VersionError') {
      return res.status(409).json({
        error: 'This container was modified by someone else. Please refresh and try again.'
      });
    }
    next(error);
  }
});

// DELETE container - admin only
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const sale = await Sale.findOne({ containerId: req.params.id });
    if (sale) {
      return res.status(400).json({ error: 'Cannot delete sold container' });
    }

    const container = await Container.findByIdAndDelete(req.params.id);
    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }

    res.json({ message: 'Container deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
