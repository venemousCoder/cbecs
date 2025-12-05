const User = require('../models/user');
const Business = require('../models/business');
const Listing = require('../models/listing');
const Category = require('../models/category');

// Admin Dashboard
exports.getDashboard = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const businessCount = await Business.countDocuments();
        const listingCount = await Listing.countDocuments();
        const categoryCount = await Category.countDocuments();

        // Recent 5 businesses
        const recentBusinesses = await Business.find().sort({ createdAt: -1 }).limit(5).populate('owner', 'name email');

        res.render('admin/dashboard', {
            title: 'Admin Dashboard - CBECS',
            user: req.user,
            stats: {
                users: userCount,
                businesses: businessCount,
                listings: listingCount,
                categories: categoryCount
            },
            recentBusinesses
        });
    } catch (err) {
        console.error(err);
        res.render('admin/dashboard', { title: 'Admin Dashboard', user: req.user, stats: {}, recentBusinesses: [] });
    }
};

// --- Manage SMEs ---
exports.getSMEs = async (req, res) => {
    try {
        const businesses = await Business.find().populate('owner');
        res.render('admin/smes/index', {
            title: 'Manage SMEs',
            businesses,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
};

exports.updateSMEStatus = async (req, res) => {
    try {
        const { businessId, status } = req.body;
        await Business.findByIdAndUpdate(businessId, { status });
        req.flash('success', `Business status updated to ${status}`);
        res.redirect('/admin/smes');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating status');
        res.redirect('/admin/smes');
    }
};

// Get Type Change Requests
exports.getTypeChangeRequests = async (req, res) => {
    try {
        const requests = await Business.find({ 'changeRequest.status': 'pending' }).populate('owner', 'name email');
        res.render('admin/smes/requests', {
            title: 'Business Type Change Requests',
            requests,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
};

// Handle Type Change Request
exports.handleTypeChangeRequest = async (req, res) => {
    try {
        const { businessId, action, adminResponse } = req.body;
        const business = await Business.findById(businessId);

        if (!business || !business.changeRequest || business.changeRequest.status !== 'pending') {
            req.flash('error', 'Invalid request');
            return res.redirect('/admin/smes/requests');
        }

        if (action === 'approve') {
            // Update Business Type
            business.business_type = business.changeRequest.requestedType;
            business.changeRequest.status = 'approved';
            
            // Logic to align 'category' if needed (optional, but cleaner)
            // If changing to 'retail', category should probably reflect that if it was 'service'
            // But 'category' field is often used for broad categorization. 
            // If 'hybrid', category might stay as primary. 
            // Let's leave 'category' alone as per instruction focus is on business_type.
        } else {
            business.changeRequest.status = 'rejected';
        }

        business.changeRequest.adminResponse = adminResponse;
        business.changeRequest.respondedAt = Date.now();

        await business.save();

        // Re-index business if type changed (affects search filters)
        // const { indexServiceBusiness } = require('../utils/searchIndexer');
        // await indexServiceBusiness(business._id); 
        // (Assuming indexer handles type updates correctly or we just leave it for next update)

        req.flash('success', `Request ${action}d successfully`);
        res.redirect('/admin/smes/requests');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error processing request');
        res.redirect('/admin/smes/requests');
    }
};

// --- Manage Listings ---
exports.getListings = async (req, res) => {
    try {
        const listings = await Listing.find().populate('business');
        res.render('admin/listings/index', {
            title: 'Manage Listings',
            listings,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
};

exports.deleteListing = async (req, res) => {
    try {
        await Listing.deleteAndCleanup(req.params.id);
        req.flash('success', 'Listing deleted by admin');
        res.redirect('/admin/listings');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting listing');
        res.redirect('/admin/listings');
    }
};

// --- Manage Users ---
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.render('admin/users/index', {
            title: 'Manage Users',
            users,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
};

// --- Manage Categories ---
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('admin/categories/index', {
            title: 'Manage Categories',
            categories,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, type, icon, description } = req.body;
        const slug = name.toLowerCase().replace(/ /g, '-');
        
        const newCategory = new Category({ name, type, slug, icon, description });
        await newCategory.save();
        
        req.flash('success', 'Category added');
        res.redirect('/admin/categories');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error adding category');
        res.redirect('/admin/categories');
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        req.flash('success', 'Category deleted');
        res.redirect('/admin/categories');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting category');
        res.redirect('/admin/categories');
    }
};
