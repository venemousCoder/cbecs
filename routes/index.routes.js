const router = require('express').Router();
const homeRouter = require('./home.routes');
const smeRouter = require('./sme.routes');

router.use('/', homeRouter);
router.use('/sme', smeRouter);

module.exports = router;