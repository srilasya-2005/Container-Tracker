const mongoose = require('mongoose');

const containerItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity must be non-negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['Kg', 'Ton', 'Ltr', 'Pcs', 'Box', 'Unit', 'Bags'],
    default: 'Unit'
  },
  unitPrice: {
    type: Number,
    default: 0,
    min: [0, 'Unit price must be non-negative']
  }
}, { _id: true });

const containerSchema = new mongoose.Schema({
  containerNo: {
    type: String,
    required: [true, 'Container number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  size: {
    type: String,
    enum: ['20FT', '40FT'],
    required: [true, 'Container size is required']
  },
  type: {
    type: String,
    enum: ['Dry', 'Reefer'],
    required: [true, 'Container type is required']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price must be positive']
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  location: {
    type: String,
    trim: true
  },
  purchasedFrom: {
    type: String,
    trim: true
  },
  items: {
    type: [containerItemSchema],
    default: []
  },
  paymentStatus: {
    type: String,
    enum: ['Full', 'Partial', 'Pending'],
    default: 'Pending'
  },
  status: {
    type: String,
    enum: ['Available', 'Reserved', 'Sold'],
    default: 'Available'
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  optimisticConcurrency: true
});


containerSchema.index({ status: 1, createdAt: -1 });
containerSchema.index({ createdBy: 1 });
containerSchema.index({ size: 1, type: 1 });
containerSchema.index({ purchaseDate: -1 });

module.exports = mongoose.model('Container', containerSchema);
