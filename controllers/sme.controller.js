const Business = require('../models/business');

// Render the Create Business Page
exports.getCreateBusinessPage = (req, res) => {
    res.render('sme/create-business', {
        title: 'Create Business Profile - CBECS',
        user: req.user
    });
};

// Handle Business Creation
exports.createBusiness = async (req, res) => {
    const { name, category, address, description } = req.body;
    let errors = [];

    if (!name || !category || !address) {
        errors.push({ msg: 'Please fill in all required fields' });
    }

    if (errors.length > 0) {
        return res.render('sme/create-business', {
            errors,
            name,
            category,
            address,
            description
        });
    }

    try {
        // Check if user already has a business (Optional constraint, enforcing 1 for now for simplicity as per some interpretations, or allowing multiple. 
        // Robot.md says "SME owner can operate multiple businesses". So we won't restrict.)
        
        const newBusiness = new Business({
            owner: req.user._id,
            name,
            category,
            address,
            description,
            logo: req.file ? `/public/uploads/logos/${req.file.filename}` : undefined
        });

        await newBusiness.save();
        req.flash('success', 'Business profile created successfully!');
        res.redirect('/sme/dashboard');

    } catch (err) {
        console.error(err);
        errors.push({ msg: 'Server error creating business' });
        res.render('sme/create-business', {
            errors,
            name,
            category,
            address,
            description
        });
    }
};

// Dashboard (Placeholder moved here)
exports.getDashboard = async (req, res) => {
    try {
        const businesses = await Business.find({ owner: req.user._id });
        res.render('sme/dashboard', {
            title: 'SME Dashboard - CBECS',
            user: req.user,
            businesses
        });
    } catch (err) {
        console.error(err);
        res.render('sme/dashboard', {
            title: 'SME Dashboard - CBECS',
            user: req.user,
            businesses: []
        });
    }
};
