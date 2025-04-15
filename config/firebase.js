const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Path to the service account file
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

// Check if service account file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.warn('Firebase service account file not found. Push notifications will be disabled.');
  module.exports = {
    admin: null,
    sendNotification: async () => {
      console.warn('Push notifications are disabled because Firebase is not configured.');
      return null;
    }
  };
} else {
  // Initialize Firebase Admin with service account
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  // Notification service
  const sendNotification = async (token, title, body, data = {}) => {
    try {
      const message = {
        notification: {
          title,
          body
        },
        data,
        token
      };

      const response = await admin.messaging().send(message);
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  };

  module.exports = {
    admin,
    sendNotification
  };
} 