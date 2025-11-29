const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operator.controller');
const { ensureAuthenticated, ensureRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

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

// Operator Dashboard
router.get('/dashboard', ensureAuthenticated, ensureRole('operator'), operatorController.getOperatorDashboard);
router.post('/orders/update-status', ensureAuthenticated, ensureRole('operator'), operatorController.operatorUpdateStatus);

// Operator Listing Routes
router.get('/listings/add', ensureAuthenticated, ensureRole('operator'), operatorController.getOperatorAddListingPage);
router.post('/listings/add', ensureAuthenticated, ensureRole('operator'), listingUpload.single('image'), operatorController.operatorAddListing);
router.get('/listings/:id/edit', ensureAuthenticated, ensureRole('operator'), operatorController.getOperatorEditListingPage);
router.post('/listings/:id/edit', ensureAuthenticated, ensureRole('operator'), listingUpload.single('image'), operatorController.operatorEditListing);
router.post('/listings/:id/delete', ensureAuthenticated, ensureRole('operator'), operatorController.operatorDeleteListing);

module.exports = router;
