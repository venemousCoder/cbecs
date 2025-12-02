const Listing = require('../models/listing');
const Business = require('../models/business');
const Category = require('../models/category');

// Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('categories/index', {
            title: 'Browse Categories',
            categories,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};

// Get listings by category
exports.getCategoryListings = async (req, res) => {
    const slug = req.params.id;

    try {
        const category = await Category.findOne({ slug: slug });
        
        if (!category) {
            req.flash('error', 'Category not found');
            return res.redirect('/categories');
        }
        
        const listings = await Listing.find({ category: category._id }).populate('business');

        res.render('categories/show', {
            title: `${category.name} Listings`,
            categoryName: category.name,
            listings,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/categories');
    }
};

// Get single listing details
exports.getListingDetails = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).populate('business');
        
        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('/');
        }

        // Fetch related listings (simple recommendation: same type)
        const relatedListings = await Listing.find({ 
            type: listing.type, 
            _id: { $ne: listing._id } 
        }).limit(4);

        res.render('listings/show', {
            title: listing.name,
            listing,
            relatedListings,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};

// Search Listings
exports.searchListings = async (req, res) => {
    const query = req.query.q;
    if (!query && !req.query.type && !req.query.category && !req.query.minPrice && !req.query.maxPrice) return res.redirect('/');

    try {
        const categories = await Category.find();
        let dbQuery = {};

        // Text search if query exists
        if (query) {
            const regex = new RegExp(query, 'i');
            dbQuery.$or = [
                { name: regex },
                { description: regex }
            ];
        }

        // Price Filter
        if (req.query.minPrice || req.query.maxPrice) {
            dbQuery.price = {};
            if (req.query.minPrice) dbQuery.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) dbQuery.price.$lte = Number(req.query.maxPrice);
        }

        // Type Filter
        if (req.query.type && req.query.type !== '') {
            dbQuery.type = req.query.type;
        }

        // Category Filter
        if (req.query.category && req.query.category !== '') {
            dbQuery.category = req.query.category;
        }
        
        const listings = await Listing.find(dbQuery).populate('business');

        res.render('search', {
            title: query ? `Search Results for "${query}"` : 'Search Results',
            query: query || '',
            listings,
            categories,
            filters: req.query,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};

// Get Shop Details
exports.getShopDetails = async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);
        
        if (!business) {
            req.flash('error', 'Shop not found');
            return res.redirect('/');
        }
        
        const listings = await Listing.find({ business: business._id });

        res.render('shop/show', {
            title: business.name,
            business,
            listings,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};
