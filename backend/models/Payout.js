const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investor',
    required: [true, 'Investor ID is required']
  },
  containerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Container',
    required: [true, 'Container ID is required']
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  investmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContainerInvestment',
    required: [true, 'Investment ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payout amount is required'],
    min: [0, 'Payout amount must be positive']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  paidDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

payoutSchema.index({ investorId: 1, status: 1 });
payoutSchema.index({ status: 1, dueDate: 1 });
payoutSchema.index({ containerId: 1 });
payoutSchema.index({ investmentId: 1 });

module.exports = mongoose.model('Payout', payoutSchema);
