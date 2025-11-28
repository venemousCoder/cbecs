const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operator.controller');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');

// Operator Dashboard
router.get('/dashboard', ensureAuthenticated, ensureRole('operator'), operatorController.getOperatorDashboard);
router.post('/orders/update-status', ensureAuthenticated, ensureRole('operator'), operatorController.operatorUpdateStatus);

module.exports = router;
