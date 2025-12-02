const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', ensureAuthenticated, notificationController.getNotifications);
router.post('/mark-read/:id', ensureAuthenticated, notificationController.markAsRead);
router.post('/mark-all-read', ensureAuthenticated, notificationController.markAllAsRead);

module.exports = router;
