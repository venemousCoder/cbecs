const router = require('express').Router();
const homeRouter = require('./home.routes');

router.use('/', homeRouter);

module.exports = router;