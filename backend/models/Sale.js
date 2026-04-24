const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity must be positive']
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  unitPrice: {
    type: Number,
    default: 0,
    min: [0, 'Unit price must be non-negative']
  },
  sellingPrice: {
    type: Number,
    default: 0,
    min: [0, 'Selling price must be non-negative']
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  containerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Container',
    required: [true, 'Container ID is required']
  },
  buyerName: {
    type: String,
    required: [true, 'Buyer name is required'],
    trim: true
  },
  buyerPhone: {
    type: String,
    trim: true
  },
  buyerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  paymentMode: {
    type: String,
    trim: true
  },
  referenceId: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date
  },
  lastPaymentReminderAt: {
    type: Date
  },
  lastOverdueNotifiedAt: {
    type: Date
  },
  // Legacy fields kept for backward compatibility
  quantity: {
    type: Number,
    default: 1,
    min: [0, 'Quantity must be positive']
  },
  unit: {
    type: String,
    default: 'Unit',
    trim: true
  },
  // New: items sold in this sale
  items: {
    type: [saleItemSchema],
    default: []
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price must be positive']
  },
  sellingDate: {
    type: Date,
    required: [true, 'Selling date is required']
  },
  paymentStatus: {
    type: String,
    enum: ['Full', 'Partial', 'Pending'],
    default: 'Pending'
  },
  amountReceived: {
    type: Number,
    default: 0,
    min: [0, 'Amount received must be non-negative']
  },
  profit: {
    type: Number,
    required: true
  },
  remarks: {
    type: String,
    trim: true
  },
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

saleSchema.index({ containerId: 1 });
saleSchema.index({ buyerName: 1 });
saleSchema.index({ sellingDate: -1 });
saleSchema.index({ paymentStatus: 1, sellingDate: -1 });
saleSchema.index({ soldBy: 1 });
saleSchema.index({ buyerEmail: 1, paymentStatus: 1 });
saleSchema.index({ lastPaymentReminderAt: 1 });
saleSchema.index({ dueDate: 1, paymentStatus: 1 });
saleSchema.index({ lastOverdueNotifiedAt: 1 });

module.exports = mongoose.model('Sale', saleSchema);
