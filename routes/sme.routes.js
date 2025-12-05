const express = require('express');
const router = express.Router();
const smeController = require('../controllers/sme.controller');
const listingController = require('../controllers/listing.controller');
const operatorController = require('../controllers/operator.controller');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// --- Multer Config for LOGOS ---
const logoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/logos/');
    },
    filename: function (req, file, cb) {
        cb(null, 'logo-' + Date.now() + path.extname(file.originalname));
    }
});

const logoUpload = multer({ 
    storage: logoStorage,
    limits: { fileSize: 2000000 }, 
    fileFilter: function (req, file, cb) { checkFileType(file, cb); }
});

// --- Multer Config for LISTINGS ---
const listingStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/listings/');
    },
    filename: function (req, file, cb) {
        cb(null, 'listing-' + Date.now() + path.extname(file.originalname));
    }
});

const listingUpload = multer({ 
    storage: listingStorage,
    limits: { fileSize: 5000000 }, // 5MB for products
    fileFilter: function (req, file, cb) { checkFileType(file, cb); }
});

// Shared File Type Checker
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// Protect all routes
router.use(ensureAuthenticated);
router.use(ensureRole('sme_owner'));

// --- SME Dashboard & Business Routes ---
router.get('/dashboard', smeController.getDashboard);
router.get('/create-business', smeController.getCreateBusinessPage);
router.post('/create-business', logoUpload.single('logo'), smeController.createBusiness);
router.get('/business/:id/manage', smeController.getManageBusinessPage);
router.post('/business/:id/update', logoUpload.single('logo'), smeController.updateBusiness);
router.post('/business/:id/delete', smeController.deleteBusiness);
router.post('/business/:id/request-type-change', smeController.requestTypeChange);

// --- Order Routes ---
router.get('/orders', smeController.getSmeOrders);
router.post('/orders/update-status', smeController.updateOrderItemStatus);

// --- Operator Routes ---
router.get('/business/:id/operators/add', operatorController.getAddOperatorPage);
router.post('/business/:id/operators/add', operatorController.createOperator);
router.get('/business/:id/operators', operatorController.getOperatorsList);
router.post('/business/:id/operators/remove', operatorController.removeOperator);

// --- Service Script Routes ---
router.get('/business/:id/script', smeController.getScriptBuilder);
router.post('/business/:id/script', smeController.saveScript);

// --- Listing Routes ---
router.get('/listings', listingController.getListings);
router.get('/listings/add', listingController.getAddListingPage);
router.post('/listings/add', listingUpload.single('image'), listingController.addListing);
router.get('/listings/:id/edit', listingController.getEditListingPage);
router.post('/listings/:id/edit', listingUpload.single('image'), listingController.editListing); // Using POST for update to keep it simple with HTML forms
router.post('/listings/:id/delete', listingController.deleteListing);

module.exports = router;