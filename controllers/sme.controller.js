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

// Get Manage Business Page
exports.getManageBusinessPage = async (req, res) => {
    try {
        const business = await Business.findOne({ _id: req.params.id, owner: req.user._id });
        if (!business) {
            req.flash('error', 'Business not found or unauthorized');
            return res.redirect('/sme/dashboard');
        }
        res.render('sme/manage-business', {
            title: `Manage ${business.name}`,
            business,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/sme/dashboard');
    }
};

// Update Business
exports.updateBusiness = async (req, res) => {
    try {
        const { name, address, description } = req.body;
        const business = await Business.findOne({ _id: req.params.id, owner: req.user._id });
        
        if (!business) {
            req.flash('error', 'Business not found');
            return res.redirect('/sme/dashboard');
        }

        business.name = name;
        business.address = address;
        business.description = description;

        if (req.file) {
            business.logo = `/public/uploads/logos/${req.file.filename}`;
        }

        await business.save();
        req.flash('success', 'Business profile updated');
        res.redirect(`/sme/business/${business._id}/manage`);

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating business');
        res.redirect(`/sme/business/${req.params.id}/manage`);
    }
};

// Delete Business
exports.deleteBusiness = async (req, res) => {
    try {
        const business = await Business.findOne({ _id: req.params.id, owner: req.user._id });
        if (!business) {
            req.flash('error', 'Business not found');
            return res.redirect('/sme/dashboard');
        }
        
        // Note: Ideally we should also delete all associated listings and images here
        await Business.deleteOne({ _id: business._id });
        
        req.flash('success', 'Business deleted successfully');
        res.redirect('/sme/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting business');
        res.redirect('/sme/dashboard');
    }
};
