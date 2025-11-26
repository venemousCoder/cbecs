const router = require('express').Router();
const homeController = require('../controllers/home.controller');

// Home route
router.get('/', homeController.getHomePage);

module.exports = router;