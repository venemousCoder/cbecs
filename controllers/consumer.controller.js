const Listing = require('../models/listing');
const Business = require('../models/business');

// Get all categories (Static for now, as they are structural)
exports.getAllCategories = (req, res) => {
    const categories = [
        { id: 'retail', name: 'Retail Products', icon: 'fa-shopping-bag', desc: 'Electronics, Fashion, Home Goods' },
        { id: 'service', name: 'Professional Services', icon: 'fa-tools', desc: 'Repairs, Beauty, Cleaning' },
        { id: 'food', name: 'Food & Drink', icon: 'fa-utensils', desc: 'Restaurants, Cafés, Home Cooks' }
    ];
    res.render('categories/index', {
        title: 'Browse Categories',
        categories,
        user: req.user
    });
};

// Get listings by category
exports.getCategoryListings = async (req, res) => {
    const categoryId = req.params.id;
    let dbType;

    // Map URL category to DB type/business category
    if (categoryId === 'retail') dbType = 'product';
    else if (categoryId === 'service') dbType = 'service';
    else if (categoryId === 'food') dbType = 'food';
    else {
        // Handle unknown category or subcategories if implemented later
        dbType = categoryId; 
    }

    try {
        // Find listings where the TYPE matches
        // Note: Retail businesses sell 'product' type listings
        const query = dbType === 'product' ? { type: { $in: ['product', 'retail'] } } : { type: dbType };
        
        const listings = await Listing.find(query).populate('business');

        res.render('categories/show', {
            title: `${categoryId.charAt(0).toUpperCase() + categoryId.slice(1)} Listings`,
            categoryName: categoryId,
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
    if (!query) return res.redirect('/');

    try {
        // Regex search for name or description (case insensitive)
        const regex = new RegExp(query, 'i');
        
        const listings = await Listing.find({
            $or: [
                { name: regex },
                { description: regex }
            ]
        }).populate('business');

        res.render('search', {
            title: `Search Results for "${query}"`,
            query,
            listings,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};
