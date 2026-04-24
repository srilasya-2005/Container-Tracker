const cron = require('node-cron');
const Sale = require('../models/Sale');
const Payout = require('../models/Payout');
const Notification = require('../models/Notification');
const Investor = require('../models/Investor');
const { sendPaymentReminderEmail, sendSalePaymentOverdueEmail, sendPayoutReminderEmail, sendOverdueNotificationEmail } = require('./emailService');

const OVERDUE_THRESHOLD_DAYS = 7;
const REMINDER_MIN_INTERVAL_MS = 10 * 60 * 60 * 1000;
const OVERDUE_MIN_INTERVAL_MS = 20 * 60 * 60 * 1000;

const sendPendingPaymentReminders = async () => {
  console.log('Running twice-daily pending payment reminders...');

  try {
    const now = new Date();
    const reminderCutoff = new Date(now.getTime() - REMINDER_MIN_INTERVAL_MS);

    // Sales where either no dueDate is set, or dueDate is in the future
    const pendingSales = await Sale.find({
      paymentStatus: { $in: ['Pending', 'Partial'] },
      buyerEmail: { $exists: true, $ne: null, $ne: '' },
      $and: [
        {
          $or: [
            { dueDate: { $exists: false } },
            { dueDate: null },
            { dueDate: { $gt: now } }
          ]
        },
        {
          $or: [
            { lastPaymentReminderAt: { $exists: false } },
            { lastPaymentReminderAt: null },
            { lastPaymentReminderAt: { $lte: reminderCutoff } }
          ]
        }
      ]
    }).populate('containerId', 'containerNo size type');

    for (const sale of pendingSales) {
      const amountDue = sale.sellingPrice - (sale.amountReceived || 0);
      if (amountDue <= 0 || !sale.containerId) continue;

      const referenceDate = sale.dueDate || sale.sellingDate;
      const emailResult = await sendPaymentReminderEmail(
        sale.buyerEmail,
        sale.buyerName,
        sale.containerId.containerNo,
        amountDue,
        referenceDate
      );

      if (emailResult.success) {
        sale.lastPaymentReminderAt = now;
        await sale.save();
        console.log(`Payment reminder sent to ${sale.buyerEmail} for sale ${sale._id}`);
      } else {
        console.warn(`Payment reminder failed for sale ${sale._id}: ${emailResult.error}`);
      }
    }

    console.log(`Pending payment reminders processed: ${pendingSales.length}`);
  } catch (error) {
    console.error('Error sending pending payment reminders:', error);
  }
};

const sendSaleOverdueNotices = async () => {
  console.log('Running daily overdue payment notices...');

  try {
    const now = new Date();
    const overdueCutoff = new Date(now.getTime() - OVERDUE_MIN_INTERVAL_MS);

    const overdueSales = await Sale.find({
      paymentStatus: { $in: ['Pending', 'Partial'] },
      buyerEmail: { $exists: true, $ne: null, $ne: '' },
      dueDate: { $exists: true, $ne: null, $lte: now },
      $or: [
        { lastOverdueNotifiedAt: { $exists: false } },
        { lastOverdueNotifiedAt: null },
        { lastOverdueNotifiedAt: { $lte: overdueCutoff } }
      ]
    }).populate('containerId', 'containerNo size type');

    for (const sale of overdueSales) {
      const amountDue = sale.sellingPrice - (sale.amountReceived || 0);
      if (amountDue <= 0 || !sale.containerId) continue;

      const emailResult = await sendSalePaymentOverdueEmail(
        sale.buyerEmail,
        sale.buyerName,
        sale.containerId.containerNo,
        amountDue,
        sale.dueDate,
        sale.referenceId,
        sale.paymentMode
      );

      if (emailResult.success) {
        sale.lastOverdueNotifiedAt = now;
        await sale.save();
        console.log(`Overdue notice sent to ${sale.buyerEmail} for sale ${sale._id}`);
      } else {
        console.warn(`Overdue notice failed for sale ${sale._id}: ${emailResult.error}`);
      }
    }

    console.log(`Overdue notices processed: ${overdueSales.length}`);
  } catch (error) {
    console.error('Error sending overdue notices:', error);
  }
};

const checkOverduePayments = async () => {
  console.log('Running daily check for overdue payments...');
  
  try {
    const today = new Date();
    const overdueDate = new Date();
    overdueDate.setDate(today.getDate() - OVERDUE_THRESHOLD_DAYS);

    const overdueSales = await Sale.find({
      paymentStatus: { $in: ['Pending', 'Partial'] },
      sellingDate: { $lte: overdueDate }
    }).populate('containerId');

    for (const sale of overdueSales) {
      const amountDue = sale.sellingPrice - sale.amountReceived;
      
      if (amountDue > 0 && sale.containerId) {
        const existingNotification = await Notification.findOne({
          'metadata.saleId': sale._id,
          type: 'payment_overdue',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!existingNotification) {
          const notification = await Notification.create({
            userId: sale._id,
            userType: 'User',
            type: 'payment_overdue',
            title: `Overdue Payment - ${sale.containerId.containerNo}`,
            message: `Payment of AED ${amountDue.toLocaleString()} from ${sale.buyerName} is overdue by ${Math.floor((today - sale.sellingDate) / (1000 * 60 * 60 * 24))} days`,
            metadata: {
              saleId: sale._id,
              containerId: sale.containerId._id,
              buyerName: sale.buyerName,
              amountDue
            }
          });

          if (sale.buyerPhone) {
            await sendOverdueNotificationEmail(
              sale.buyerPhone,
              sale.buyerName,
              'payment',
              sale.containerId.containerNo,
              amountDue,
              sale.sellingDate
            );
            
            notification.emailSent = true;
            notification.emailSentAt = new Date();
            await notification.save();
          }

          console.log(`Overdue payment notification created for sale ${sale._id}`);
        }
      }
    }

    console.log(`Checked ${overdueSales.length} overdue payments`);
  } catch (error) {
    console.error('Error checking overdue payments:', error);
  }
};

const checkOverduePayouts = async () => {
  console.log('Running daily check for overdue payouts...');
  
  try {
    const today = new Date();
    const overdueDate = new Date();
    overdueDate.setDate(today.getDate() - OVERDUE_THRESHOLD_DAYS);

    const overduePayouts = await Payout.find({
      status: 'Pending',
      dueDate: { $lte: overdueDate }
    }).populate('investorId containerId');

    for (const payout of overduePayouts) {
      payout.status = 'Overdue';
      await payout.save();

      if (payout.investorId && payout.containerId) {
        const existingNotification = await Notification.findOne({
          'metadata.payoutId': payout._id,
          type: 'payout_overdue',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!existingNotification) {
          const notification = await Notification.create({
            userId: payout.investorId._id,
            userType: 'Investor',
            type: 'payout_overdue',
            title: `Overdue Payout - ${payout.containerId.containerNo}`,
            message: `Payout of AED ${payout.amount.toLocaleString()} is overdue by ${Math.floor((today - payout.dueDate) / (1000 * 60 * 60 * 24))} days`,
            metadata: {
              payoutId: payout._id,
              containerId: payout.containerId._id,
              amount: payout.amount
            }
          });

          await sendOverdueNotificationEmail(
            payout.investorId.email,
            payout.investorId.name,
            'payout',
            payout.containerId.containerNo,
            payout.amount,
            payout.dueDate
          );
          
          notification.emailSent = true;
          notification.emailSentAt = new Date();
          await notification.save();

          console.log(`Overdue payout notification created for payout ${payout._id}`);
        }
      }
    }

    console.log(`Checked ${overduePayouts.length} overdue payouts`);
  } catch (error) {
    console.error('Error checking overdue payouts:', error);
  }
};

const checkUpcomingPayouts = async () => {
  console.log('Running daily check for upcoming payouts...');
  
  try {
    const today = new Date();
    const upcomingDate = new Date();
    upcomingDate.setDate(today.getDate() + 7);

    const upcomingPayouts = await Payout.find({
      status: 'Pending',
      dueDate: { $gte: today, $lte: upcomingDate }
    }).populate('investorId containerId');

    for (const payout of upcomingPayouts) {
      if (payout.investorId && payout.containerId) {
        const existingNotification = await Notification.findOne({
          'metadata.payoutId': payout._id,
          type: 'payout_reminder',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!existingNotification) {
          const notification = await Notification.create({
            userId: payout.investorId._id,
            userType: 'Investor',
            type: 'payout_reminder',
            title: `Upcoming Payout - ${payout.containerId.containerNo}`,
            message: `Your payout of AED ${payout.amount.toLocaleString()} is scheduled for ${payout.dueDate.toLocaleDateString()}`,
            metadata: {
              payoutId: payout._id,
              containerId: payout.containerId._id,
              amount: payout.amount
            }
          });

          await sendPayoutReminderEmail(
            payout.investorId.email,
            payout.investorId.name,
            payout.containerId.containerNo,
            payout.amount,
            payout.dueDate
          );
          
          notification.emailSent = true;
          notification.emailSentAt = new Date();
          await notification.save();

          console.log(`Upcoming payout notification created for payout ${payout._id}`);
        }
      }
    }

    console.log(`Checked ${upcomingPayouts.length} upcoming payouts`);
  } catch (error) {
    console.error('Error checking upcoming payouts:', error);
  }
};

const initializeCronJobs = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Starting daily notification checks at 9:00 AM...');
    await checkOverduePayments();
    await checkOverduePayouts();
    await checkUpcomingPayouts();
    console.log('Daily notification checks completed.');
  });

  cron.schedule('0 9,17 * * *', async () => {
    console.log('Running twice-daily pending payment reminder job...');
    await sendPendingPaymentReminders();
    await sendSaleOverdueNotices();
  });

  console.log('Cron jobs initialized - Daily checks at 9:00 AM, payment reminders + overdue notices at 9:00 AM & 5:00 PM');
};

module.exports = {
  initializeCronJobs,
  checkOverduePayments,
  checkOverduePayouts,
  checkUpcomingPayouts,
  sendPendingPaymentReminders,
  sendSaleOverdueNotices
};
