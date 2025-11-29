const router = require('express').Router();
const homeRouter = require('./home.routes');
const smeRouter = require('./sme.routes');
const cartRouter = require('./cart.routes');
const operatorRouter = require('./operator.routes');
const adminRouter = require('./admin.routes');
const orderController = require('../controllers/order.controller');
const { ensureAuthenticated } = require('../middleware/auth');

router.use('/', homeRouter);
router.use('/', cartRouter);
router.get('/orders', ensureAuthenticated, orderController.getConsumerOrders);
router.get('/bookings', ensureAuthenticated, orderController.getConsumerOrders); // Alias for bookings

router.use('/sme', smeRouter);
router.use('/operator', operatorRouter);
router.use('/admin', adminRouter);

module.exports = router;