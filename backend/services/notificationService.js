const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmployeeOnboardingEmail, sendAdminUpdateEmail } = require('./emailService');

const createEmployeeOnboardingNotification = async ({ employee, tempPassword, createdBy }) => {
  const notification = await Notification.create({
    userId: employee._id,
    userType: 'User',
    type: 'employee_onboarded',
    title: 'Welcome to Container Trade Tracker',
    message: 'Your account is ready. Please sign in and change your password.',
    metadata: {
      createdBy,
      email: employee.email
    }
  });

  let emailResult;
  try {
    emailResult = await sendEmployeeOnboardingEmail(
      employee.email,
      employee.name,
      tempPassword
    );
  } catch (err) {
    console.error('Employee onboarding email threw:', err);
    emailResult = { success: false, error: err.message };
  }

  if (emailResult.success) {
    notification.emailSent = true;
    notification.emailSentAt = new Date();
    await notification.save();
  } else {
    console.error(`Onboarding email NOT sent to ${employee.email}: ${emailResult.error}`);
  }

  return { notification, emailResult };
};

const broadcastAdminUpdate = async ({ title, message, createdBy }) => {
  const employees = await User.find({ role: 'employee', isActive: true }).select('email name');

  const notifications = await Promise.all(
    employees.map(async (employee) => {
      const notification = await Notification.create({
        userId: employee._id,
        userType: 'User',
        type: 'admin_update',
        title,
        message,
        metadata: {
          createdBy
        }
      });

      const emailResult = await sendAdminUpdateEmail(
        employee.email,
        employee.name,
        title,
        message
      );

      if (emailResult.success) {
        notification.emailSent = true;
        notification.emailSentAt = new Date();
        await notification.save();
      }

      return notification;
    })
  );

  return { count: notifications.length };
};

module.exports = {
  createEmployeeOnboardingNotification,
  broadcastAdminUpdate
};
