const Listing = require('../models/listing');
const Business = require('../models/business');
const Category = require('../models/category');
const fs = require('fs');
const path = require('path');
const { indexListing, removeListingFromIndex } = require('../utils/searchIndexer');

// Get all listings for the SME
exports.getListings = async (req, res) => {
    try {
        const businesses = await Business.find({ owner: req.user._id });
        const businessIds = businesses.map(b => b._id);
        const listings = await Listing.find({ business: { $in: businessIds } }).populate('business');

        res.render('sme/listings/index', {
            title: 'My Listings - CBECS',
            listings,
            businesses, // Pass businesses for UI logic (checking business_type)
            user: req.user
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Unable to fetch listings');
        res.redirect('/sme/dashboard');
    }
};

// Render Add Listing Page
exports.getAddListingPage = async (req, res) => {
    try {
        const businesses = await Business.find({ owner: req.user._id });
        const categories = await Category.find(); // Fetch all categories

        if (businesses.length === 0) {
            req.flash('error', 'You must create a business first!');
            return res.redirect('/sme/create-business');
        }
        res.render('sme/listings/add', {
            title: 'Add New Listing',
            businesses,
            categories, // Pass to view
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/sme/listings');
    }
};

// Process Add Listing
exports.addListing = async (req, res) => {
    try {
        const { businessId, name, description, price, stock, duration, category } = req.body;
        
        // 1. Validation: Verify business belongs to user
        const business = await Business.findOne({ _id: businessId, owner: req.user._id }).populate('operators');
        if (!business) {
            req.flash('error', 'Invalid business selected or unauthorized');
            return res.redirect('/sme/listings/add');
        }

        // 2. Fetch Category to determine listing type
        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            req.flash('error', 'Invalid category selected');
            return res.redirect('/sme/listings/add');
        }

        // 3. Determine Listing Type from Category
        let listingType = 'product';
        if (categoryDoc.type === 'service') listingType = 'service';
        else if (categoryDoc.type === 'food') listingType = 'food'; // Treating food as product-like for now, or its own type
        
        // Map category type to simple types for comparison if needed, but 'type' field in Listing schema supports 'product', 'service', 'food'

        // 4. Enforce Business Type Constraints (Phase 6.1)
        const bizType = business.business_type; // 'retail', 'service', 'hybrid'

        // Constraint: Service businesses cannot list products (retail items)
        if (bizType === 'service' && listingType !== 'service') {
             req.flash('error', 'Service businesses cannot list products. Please contact support to change your business type.');
             return res.redirect('/sme/listings/add');
        }

        // Constraint: Retail businesses cannot list services
        if (bizType === 'retail' && listingType === 'service') {
             req.flash('error', 'Retail businesses cannot offer services. Please contact support to change your business type to Hybrid or Service.');
             return res.redirect('/sme/listings/add');
        }

        // CHECK: RETAIL OPERATOR RESTRICTION (Existing logic, still valid for Retail businesses that might somehow have operators, though we are restricting that too)
        if (business.category === 'retail' && business.operators && business.operators.length > 0) {
            req.flash('error', 'Access Denied: This retail business has an operator. Only the operator can add listings.');
            return res.redirect('/sme/listings');
        }

        const newListing = new Listing({
            business: business._id,
            name,
            description,
            price,
            category, // Save category ID
            type: listingType,
            stock: (listingType === 'product' || listingType === 'food') ? stock : 0,
            duration: listingType === 'service' ? duration : 0,
            image: req.file ? `/public/uploads/listings/${req.file.filename}` : undefined
        });

        await newListing.save();
        // Indexing
        await indexListing(newListing._id);

        req.flash('success', 'Listing added successfully');
        res.redirect('/sme/listings');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error adding listing');
        res.redirect('/sme/listings/add');
    }
};

// Render Edit Page
exports.getEditListingPage = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).populate({
            path: 'business',
            populate: { path: 'operators' }
        });
        
        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('/sme/listings');
        }

        // Verify Ownership
        if (listing.business.owner.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized');
            return res.redirect('/sme/listings');
        }

        // CHECK: RETAIL OPERATOR RESTRICTION
        if (listing.business.category === 'retail' && listing.business.operators && listing.business.operators.length > 0) {
            req.flash('error', 'Access Denied: This retail business has an operator. Only the operator can edit listings.');
            return res.redirect('/sme/listings');
        }

        res.render('sme/listings/edit', {
            title: 'Edit Listing',
            listing,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/sme/listings');
    }
};

// Process Edit Listing
exports.editListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).populate({
            path: 'business',
            populate: { path: 'operators' }
        });

        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('/sme/listings');
        }

        if (listing.business.owner.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized');
            return res.redirect('/sme/listings');
        }

        // CHECK: RETAIL OPERATOR RESTRICTION
        if (listing.business.category === 'retail' && listing.business.operators && listing.business.operators.length > 0) {
            req.flash('error', 'Access Denied: This retail business has an operator. Only the operator can edit listings.');
            return res.redirect('/sme/listings');
        }

        const { name, description, price, stock, duration } = req.body;

        listing.name = name;
        listing.description = description;
        listing.price = price;
        
        if (listing.type === 'product') listing.stock = stock;
        if (listing.type === 'service') listing.duration = duration;

        if (req.file) {
            // Optional: Delete old image if not default
            if (listing.image && !listing.image.includes('default')) {
                 // implementation of delete logic would go here
            }
            listing.image = `/public/uploads/listings/${req.file.filename}`;
        }

        await listing.save();
        
        // Update Index
        await indexListing(listing._id);

        req.flash('success', 'Listing updated successfully');
        res.redirect('/sme/listings');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating listing');
        res.redirect(`/sme/listings/${req.params.id}/edit`);
    }
};

// Process Delete Listing
exports.deleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).populate({
            path: 'business',
            populate: { path: 'operators' }
        });

        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('/sme/listings');
        }

        if (listing.business.owner.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized');
            return res.redirect('/sme/listings');
        }

        // CHECK: RETAIL OPERATOR RESTRICTION
        if (listing.business.category === 'retail' && listing.business.operators && listing.business.operators.length > 0) {
            req.flash('error', 'Access Denied: This retail business has an operator. Only the operator can delete listings.');
            return res.redirect('/sme/listings');
        }

        await Listing.deleteAndCleanup(listing._id);
        
        // Remove from index
        await removeListingFromIndex(listing._id);

        req.flash('success', 'Listing deleted');
        res.redirect('/sme/listings');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting listing');
        res.redirect('/sme/listings');
    }
};