const express = require('express');
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Container = require('../models/Container');
const EmployeeActivity = require('../models/EmployeeActivity');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { sendPaymentReminderEmail, sendSalePaymentOverdueEmail } = require('../services/emailService');
const router = express.Router();

const sanitizeSaleForRole = (sale, role) => {
  if (role === 'admin' || !sale) return sale;
  const data = sale.toObject ? sale.toObject() : { ...sale };
  delete data.profit;
  return data;
};

router.use(authMiddleware);

// GET all sales - admin, finance, ops only
router.get('/', requireRole('admin', 'finance', 'ops'), async (req, res, next) => {
  try {
    const { search, paymentStatus, from, to, page = 1, limit = 50 } = req.query;

    const query = {};

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      query.buyerName = { $regex: search, $options: 'i' };
    }

    if (from || to) {
      query.sellingDate = {};
      if (from) query.sellingDate.$gte = new Date(from);
      if (to) query.sellingDate.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .populate('containerId', 'containerNo size type purchaseDate')
        .sort({ sellingDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Sale.countDocuments(query)
    ]);

    const sanitized = sales.map(sale => sanitizeSaleForRole(sale, req.user.role));

    res.json({
      sales: sanitized,
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

// GET single sale
router.get('/:id', async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('containerId');
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sanitizeSaleForRole(sale, req.user.role));
  } catch (error) {
    next(error);
  }
});

// POST create sale - all authenticated users, with MongoDB transaction
router.post('/', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { containerId, buyerName, buyerPhone, buyerEmail, paymentMode, referenceId, dueDate, sellingPrice, sellingDate, paymentStatus, amountReceived, remarks, quantity, unit, items, timeSpent } = req.body;

    const container = await Container.findById(containerId).session(session);
    if (!container) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Container not found' });
    }

    // If items are provided, validate and deduct quantities from container
    if (items && items.length > 0) {
      for (const saleItem of items) {
        const containerItem = container.items.id(saleItem.itemId);
        if (!containerItem) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ error: `Item "${saleItem.name}" not found in container` });
        }
        if (saleItem.quantity > containerItem.quantity) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            error: `Cannot sell ${saleItem.quantity} ${containerItem.unit} of "${containerItem.name}". Only ${containerItem.quantity} ${containerItem.unit} available.`
          });
        }
      }

      // Deduct quantities
      for (const saleItem of items) {
        const containerItem = container.items.id(saleItem.itemId);
        containerItem.quantity -= saleItem.quantity;
      }

      // Check if all items in the container are now at 0 quantity
      const allEmpty = container.items.every(item => item.quantity <= 0);
      if (allEmpty) {
        container.status = 'Sold';
      }

      await container.save({ session });
    } else {
      // Legacy: mark whole container as sold if no items specified
      if (container.status === 'Sold') {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({ error: 'Container already sold' });
      }
      container.status = 'Sold';
      await container.save({ session });
    }

    // Calculate cost basis and profit from per-item selling prices
    let costBasis = 0;
    let totalSellingPrice = sellingPrice;
    if (items && items.length > 0) {
      costBasis = 0;
      totalSellingPrice = 0;
      for (const saleItem of items) {
        const containerItem = container.items.id(saleItem.itemId);
        if (containerItem && containerItem.unitPrice) {
          saleItem.unitPrice = containerItem.unitPrice;
          costBasis += containerItem.unitPrice * saleItem.quantity;
        }
        totalSellingPrice += (saleItem.sellingPrice || 0);
      }
    } else {
      // Legacy: full container sale uses purchase price as cost
      costBasis = container.purchasePrice;
    }

    const profit = totalSellingPrice - costBasis;

    // Auto-derive payment status from amountReceived vs totalSellingPrice
    const received = amountReceived || 0;
    let derivedPaymentStatus = paymentStatus || 'Pending';
    if (totalSellingPrice > 0 && received >= totalSellingPrice) {
      derivedPaymentStatus = 'Full';
    } else if (received > 0) {
      derivedPaymentStatus = 'Partial';
    } else {
      derivedPaymentStatus = 'Pending';
    }

    const sale = new Sale({
      containerId,
      buyerName,
      buyerPhone,
      buyerEmail,
      paymentMode: paymentMode ? String(paymentMode).trim() : undefined,
      referenceId: referenceId ? String(referenceId).trim() : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      quantity: quantity || 1,
      unit: unit || 'Unit',
      items: items || [],
      sellingPrice: totalSellingPrice,
      sellingDate,
      paymentStatus: derivedPaymentStatus,
      amountReceived: received,
      profit,
      remarks,
      soldBy: req.user.id
    });

    await sale.save({ session });

    // Log employee activity
    await EmployeeActivity.create([{
      employeeId: req.user.id,
      actionType: 'SELL_CONTAINER',
      containerId: container._id,
      saleId: sale._id,
      timeSpent: timeSpent || 0
    }], { session });

    await session.commitTransaction();
    session.endSession();

    const populatedSale = await Sale.findById(sale._id).populate('containerId');

    // Immediate reminder or overdue email on sale creation
    if (populatedSale?.buyerEmail && populatedSale.paymentStatus !== 'Full') {
      const amountDue = (populatedSale.sellingPrice || 0) - (populatedSale.amountReceived || 0);
      if (amountDue > 0 && populatedSale.containerId) {
        const now = new Date();
        const isOverdue = populatedSale.dueDate && new Date(populatedSale.dueDate) <= now;
        console.log(`[Sale ${populatedSale._id}] Sending initial ${isOverdue ? 'overdue notice' : 'payment reminder'} to ${populatedSale.buyerEmail} for AED ${amountDue}`);
        try {
          const emailResult = isOverdue
            ? await sendSalePaymentOverdueEmail(
                populatedSale.buyerEmail,
                populatedSale.buyerName,
                populatedSale.containerId.containerNo,
                amountDue,
                populatedSale.dueDate,
                populatedSale.referenceId,
                populatedSale.paymentMode
              )
            : await sendPaymentReminderEmail(
                populatedSale.buyerEmail,
                populatedSale.buyerName,
                populatedSale.containerId.containerNo,
                amountDue,
                populatedSale.dueDate || populatedSale.sellingDate
              );
          if (emailResult.success) {
            const update = isOverdue ? { lastOverdueNotifiedAt: now } : { lastPaymentReminderAt: now };
            await Sale.findByIdAndUpdate(populatedSale._id, update);
            console.log(`[Sale ${populatedSale._id}] Initial email sent successfully`);
          } else {
            console.warn(`[Sale ${populatedSale._id}] Initial email failed: ${emailResult.error}`);
          }
        } catch (err) {
          console.error(`[Sale ${populatedSale._id}] Initial email threw:`, err);
        }
      } else {
        console.log(`[Sale ${populatedSale._id}] Skipping email (amountDue=${amountDue}, container=${!!populatedSale.containerId})`);
      }
    } else if (populatedSale) {
      console.log(`[Sale ${populatedSale._id}] Skipping email (buyerEmail=${populatedSale.buyerEmail || 'none'}, paymentStatus=${populatedSale.paymentStatus})`);
    }

    res.status(201).json(sanitizeSaleForRole(populatedSale, req.user.role));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error.name === 'VersionError') {
      return res.status(409).json({
        error: 'This container was modified by someone else. Please refresh and try again.'
      });
    }
    next(error);
  }
});

// PUT update sale - admin, finance, ops only
router.put('/:id', requireRole('admin', 'finance', 'ops'), async (req, res, next) => {
  try {
    const { paymentStatus, amountReceived, remarks, buyerEmail, paymentMode, referenceId, dueDate } = req.body;

    // Fetch the existing sale to get sellingPrice for auto-derivation
    const existingSale = await Sale.findById(req.params.id);
    if (!existingSale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const updates = {};
    if (remarks !== undefined) updates.remarks = remarks;
    if (buyerEmail !== undefined) updates.buyerEmail = buyerEmail;
    if (paymentMode !== undefined) updates.paymentMode = paymentMode ? String(paymentMode).trim() : null;
    if (referenceId !== undefined) updates.referenceId = referenceId ? String(referenceId).trim() : null;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

    // Auto-derive payment status from amountReceived vs sellingPrice
    const received = amountReceived !== undefined ? amountReceived : existingSale.amountReceived;
    if (received !== undefined) updates.amountReceived = received;

    const price = existingSale.sellingPrice;
    if (received >= price) {
      updates.paymentStatus = 'Full';
    } else if (received > 0) {
      updates.paymentStatus = 'Partial';
    } else {
      updates.paymentStatus = 'Pending';
    }

    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('containerId');

    res.json(sanitizeSaleForRole(sale, req.user.role));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
