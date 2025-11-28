const router = require('express').Router();
const homeController = require('../controllers/home.controller');
const authController = require('../controllers/auth.controller');
const consumerController = require('../controllers/consumer.controller');
const { ensureAuthenticated, forwardAuthenticated } = require('../middleware/auth');

// Home route
router.get('/', homeController.getHomePage);

// Consumer / Public Routes
router.get('/categories', consumerController.getAllCategories);
router.get('/categories/:id', consumerController.getCategoryListings);
router.get('/listing/:id', consumerController.getListingDetails);
router.get('/search', consumerController.searchListings);

// Auth routes - Pages
router.get('/login', forwardAuthenticated, homeController.getLoginPage);
router.get('/signup', forwardAuthenticated, homeController.getSignupPage);
router.get('/business/register', forwardAuthenticated, homeController.getBusinessSignupPage);

// Auth routes - Actions
router.post('/login', authController.loginUser);
router.post('/signup', authController.registerUser);
router.post('/business/register', authController.registerUser); // Reuses register logic, handles role internally
router.get('/logout', authController.logoutUser);

module.exports = router;