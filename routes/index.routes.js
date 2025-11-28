const router = require('express').Router();
const homeRouter = require('./home.routes');
const smeRouter = require('./sme.routes');
const cartRouter = require('./cart.routes');

router.use('/', homeRouter);
router.use('/', cartRouter); // Mount at root so /cart works
router.use('/sme', smeRouter);

module.exports = router;