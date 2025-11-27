const Listing = require('../models/listing');
const Business = require('../models/business');
const fs = require('fs');
const path = require('path');

// Get all listings for the SME
exports.getListings = async (req, res) => {
    try {
        const businesses = await Business.find({ owner: req.user._id });
        const businessIds = businesses.map(b => b._id);
        const listings = await Listing.find({ business: { $in: businessIds } }).populate('business');

        res.render('sme/listings/index', {
            title: 'My Listings - CBECS',
            listings,
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
        if (businesses.length === 0) {
            req.flash('error', 'You must create a business first!');
            return res.redirect('/sme/create-business');
        }
        res.render('sme/listings/add', {
            title: 'Add New Listing',
            businesses,
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
        const { businessId, name, description, price, stock, duration } = req.body;
        
        // Validation: Verify business belongs to user
        const business = await Business.findOne({ _id: businessId, owner: req.user._id });
        if (!business) {
            req.flash('error', 'Invalid business selected or unauthorized');
            return res.redirect('/sme/listings/add');
        }

        // Auto-assign type based on business category
        let type = 'product';
        if (business.category === 'service') type = 'service';
        else if (business.category === 'food') type = 'food';

        const newListing = new Listing({
            business: business._id,
            name,
            description,
            price,
            type,
            stock: (type === 'product' || type === 'retail') ? stock : 0,
            duration: type === 'service' ? duration : 0,
            image: req.file ? `/public/uploads/listings/${req.file.filename}` : undefined
        });

        await newListing.save();
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
        const listing = await Listing.findById(req.params.id).populate('business');
        
        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('/sme/listings');
        }

        // Verify Ownership
        if (listing.business.owner.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized');
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
        const listing = await Listing.findById(req.params.id).populate('business');

        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('/sme/listings');
        }

        if (listing.business.owner.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized');
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
        const listing = await Listing.findById(req.params.id).populate('business');

        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('/sme/listings');
        }

        if (listing.business.owner.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized');
            return res.redirect('/sme/listings');
        }

        await Listing.deleteOne({ _id: listing._id });
        req.flash('success', 'Listing deleted');
        res.redirect('/sme/listings');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting listing');
        res.redirect('/sme/listings');
    }
};
