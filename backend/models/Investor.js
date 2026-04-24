const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const investorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Investor name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['investor'],
    default: 'investor'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  notes: {
    type: String,
    trim: true
  },
  totalInvested: {
    type: Number,
    default: 0
  },
  totalReturns: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

investorSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

investorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Investor', investorSchema);
