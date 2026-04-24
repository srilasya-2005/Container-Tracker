const mongoose = require('mongoose');

const employeeActivitySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    enum: ['ADD_CONTAINER', 'SELL_CONTAINER'],
    required: true
  },
  containerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Container'
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

employeeActivitySchema.index({ employeeId: 1 });
employeeActivitySchema.index({ actionType: 1 });
employeeActivitySchema.index({ timestamp: -1 });

module.exports = mongoose.model('EmployeeActivity', employeeActivitySchema);
