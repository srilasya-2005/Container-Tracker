const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');


dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(compression());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Publicly serve brand assets (used by email templates for the logo)
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  maxAge: '7d',
  immutable: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800');
  }
}));

const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api', apiLimiter);
const uri =
  process.env.MONGO_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI;

if (!uri) {
  console.error("Mongo URL missing. Add MONGO_URL (or MONGO_URI) to backend/.env");
  process.exit(1);
}

mongoose.set('strictQuery', true);
mongoose.set('autoIndex', process.env.NODE_ENV !== 'production');

mongoose
  .connect(uri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const authRoutes = require('./routes/auth');
const investorAuthRoutes = require('./routes/investorAuth');
const containerRoutes = require('./routes/containers');
const salesRoutes = require('./routes/sales');
const reportRoutes = require('./routes/reports');
const investorRoutes = require('./routes/investors');
const investmentRoutes = require('./routes/investments');
const payoutRoutes = require('./routes/payouts');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const { initializeCronJobs } = require('./services/cronService');

app.use('/api/auth', authRoutes);
app.use('/api/investor-auth', investorAuthRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

initializeCronJobs();

app.get('/api', (req, res) => {
  res.json({ message: 'Container Trade Tracker API' });
});

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Prevent crashes from unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
