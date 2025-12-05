const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');

// Protect all admin routes
router.use(ensureAuthenticated);
router.use(ensureRole('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Manage SMEs
router.get('/smes', adminController.getSMEs);
router.post('/smes/update-status', adminController.updateSMEStatus);
router.get('/smes/requests', adminController.getTypeChangeRequests);
router.post('/smes/requests/handle', adminController.handleTypeChangeRequest);

// Manage Listings
router.get('/listings', adminController.getListings);
router.post('/listings/:id/delete', adminController.deleteListing);

// Manage Users
router.get('/users', adminController.getUsers);

// Manage Categories
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.post('/categories/:id/delete', adminController.deleteCategory);

module.exports = router;
