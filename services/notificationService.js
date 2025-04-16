const Notification = require('../models/Notification');
const { sendNotification } = require('../config/firebase');

/**
 * Send and save a notification
 * @param {Object} options
 * @param {string} options.userId - User ID to send notification to
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - Notification type (order, promotion, system, other)
 * @param {Object} options.data - Additional data for the notification
 * @param {string} options.fcmToken - User's FCM token for push notification
 * @returns {Promise<Object>} Created notification
 */
const sendAndSaveNotification = async ({ userId, title, message, type = 'other', data = {}, fcmToken }) => {
  try {
    // Create notification in database
    const notification = new Notification({
      user: userId,
      title,
      message,
      type,
      data
    });

    // Save notification
    await notification.save();

    // Send push notification if FCM token exists
    if (fcmToken) {
      try {
        await sendNotification(
          fcmToken,
          title,
          message,
          {
            ...data,
            notificationId: notification._id.toString(),
            type
          }
        );
      } catch (error) {
        console.error('Error sending push notification:', error);
        // Continue even if push notification fails
      }
    }

    return notification;
  } catch (error) {
    console.error('Error in sendAndSaveNotification:', error);
    throw error;
  }
};

module.exports = {
  sendAndSaveNotification
}; 