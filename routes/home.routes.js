const router = require('express').Router();
const homeController = require('../controllers/home.controller');

// Home route
router.get('/', homeController.getHomePage);

// Auth routes
router.get('/login', homeController.getLoginPage);
router.get('/signup', homeController.getSignupPage);
router.get('/business/register', homeController.getBusinessSignupPage);

module.exports = router;