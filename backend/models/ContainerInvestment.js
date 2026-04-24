const mongoose = require('mongoose');

const containerInvestmentSchema = new mongoose.Schema({
  containerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Container',
    required: [true, 'Container ID is required']
  },
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investor',
    required: [true, 'Investor ID is required']
  },
  investmentAmount: {
    type: Number,
    required: [true, 'Investment amount is required'],
    min: [0, 'Investment amount must be positive']
  },
  profitSharePercent: {
    type: Number,
    required: [true, 'Profit share percentage is required'],
    min: [0, 'Profit share must be between 0 and 100'],
    max: [100, 'Profit share must be between 0 and 100']
  },
  investmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

containerInvestmentSchema.index({ containerId: 1 });
containerInvestmentSchema.index({ investorId: 1 });

module.exports = mongoose.model('ContainerInvestment', containerInvestmentSchema);
