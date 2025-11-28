const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/cart', cartController.getCart);
router.post('/cart/add', cartController.addToCart);
router.post('/cart/remove/:id', cartController.removeFromCart);

// Checkout requires authentication
router.post('/checkout', ensureAuthenticated, cartController.postCheckout);

module.exports = router;
