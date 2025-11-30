const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/:businessId', ensureAuthenticated, serviceController.getChatPage);
router.post('/start', ensureAuthenticated, serviceController.startServiceSession);
router.post('/submit', ensureAuthenticated, serviceController.submitStep);

module.exports = router;
