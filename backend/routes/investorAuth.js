const express = require('express');
const jwt = require('jsonwebtoken');
const Investor = require('../models/Investor');
const { investorAuth } = require('../middleware/auth');
const router = express.Router();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const investor = await Investor.findOne({ email });
    if (!investor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (investor.status !== 'Active') {
      return res.status(403).json({ error: 'Account is inactive. Please contact administrator.' });
    }

    const isMatch = await investor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: investor._id, email: investor.email, role: investor.role, name: investor.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      investor: {
        id: investor._id,
        name: investor.name,
        email: investor.email,
        role: investor.role
      }
    });
  } catch (error) {
    console.error('Investor login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.get('/me', investorAuth, async (req, res) => {
  try {
    const investor = await Investor.findById(req.investor.id).select('-password');
    if (!investor) {
      return res.status(404).json({ error: 'Investor not found' });
    }
    res.json(investor);
  } catch (error) {
    console.error('Get investor profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
