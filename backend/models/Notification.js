const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required']
  },
  userType: {
    type: String,
    enum: ['User', 'Investor'],
    required: true
  },
  type: {
    type: String,
    enum: [
      'payment_reminder',
      'payout_reminder',
      'payment_overdue',
      'payout_overdue',
      'sale_completed',
      'investment_return',
      'employee_onboarded',
      'admin_update'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, userType: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ 'metadata.saleId': 1, type: 1, createdAt: -1 });
notificationSchema.index({ 'metadata.payoutId': 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
