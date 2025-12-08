const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { ensureAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'public/uploads/service_files';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'service-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/shop/:businessId', ensureAuthenticated, serviceController.getShopLandingPage);
router.get('/book/:businessId', ensureAuthenticated, serviceController.getChatPage);
router.post('/start', ensureAuthenticated, serviceController.startServiceSession);
router.post('/submit', ensureAuthenticated, serviceController.submitStep);
router.post('/upload', ensureAuthenticated, upload.single('file'), serviceController.uploadFile);

module.exports = router;
