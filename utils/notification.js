const Notification = require('../models/notification');

/**
 * Create a new notification
 * @param {string} recipientId - User ID of the recipient
 * @param {string} type - Type of notification ('order_update', 'service_update', 'general')
 * @param {string} message - The notification text
 * @param {string} relatedId - (Optional) ID of the related order/entity
 */
exports.createNotification = async (recipientId, type, message, relatedId = null) => {
    try {
        const notification = new Notification({
            recipient: recipientId,
            type,
            message,
            relatedId
        });
        await notification.save();
        return notification;
    } catch (err) {
        console.error('Notification Creation Error:', err);
        return null;
    }
};
