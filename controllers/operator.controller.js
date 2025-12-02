const Listing = require('../models/listing');
const Business = require('../models/business');
const Order = require('../models/order');
const User = require('../models/user');
const Category = require('../models/category');
const { createNotification } = require('../utils/notification');

// ... [Previous functions: getAddOperatorPage, createOperator, getOperatorDashboard, operatorUpdateStatus, getOperatorsList, removeOperator] ...

// RENDER Add Operator Page
exports.getAddOperatorPage = async (req, res) => {
    try {
        const business = await Business.findOne({ _id: req.params.id, owner: req.user._id });
        if (!business) {
            req.flash('error', 'Business not found');
            return res.redirect('/sme/dashboard');
        }
        res.render('sme/operators/add', {
            title: `Add Operator - ${business.name}`,
            business,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/sme/dashboard');
    }
};

// Create Operator
exports.createOperator = async (req, res) => {
    try {
        const businessId = req.params.id;
        const { name, email, phone, password } = req.body;
        
        const business = await Business.findOne({ _id: businessId, owner: req.user._id }).populate('operators');
        if (!business) {
            req.flash('error', 'Business not found');
            return res.redirect('/sme/dashboard');
        }

        if (business.category === 'retail' && business.operators.length >= 1) {
            req.flash('error', 'Retail businesses can only have 1 operator.');
            return res.redirect(`/sme/business/${businessId}/manage`);
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'User with this email already exists.');
            return res.redirect(`/sme/business/${businessId}/operators/add`);
        }

        const newOperator = new User({
            name,
            email,
            phone,
            password, 
            role: 'operator',
            operatorOf: business._id
        });

        await newOperator.save();

        business.operators.push(newOperator._id);
        await business.save();

        req.flash('success', 'Operator created successfully');
        res.redirect(`/sme/business/${businessId}/manage`);

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error creating operator');
        res.redirect(`/sme/business/${req.params.id}/operators/add`);
    }
};

// Operator Dashboard
exports.getOperatorDashboard = async (req, res) => {
    try {
        const business = await Business.findById(req.user.operatorOf);
        if (!business) {
            req.flash('error', 'Business not found or you are not assigned properly.');
            return res.redirect('/login');
        }

        const orders = await Order.find({ 'items.business': business._id })
            .populate('user', 'name phone')
            .populate('items.listing')
            .sort({ createdAt: -1 });
        
        // Fetch listings for this operator's business to display in dashboard
        const listings = await Listing.find({ business: business._id });

        // Fetch Service Requests (Orders of type 'service_request') assigned to THIS operator
        const serviceRequests = await Order.find({
            type: 'service_request',
            'serviceDetails.operator': req.user._id
        })
        .populate('user', 'name phone email')
        .sort({ createdAt: -1 });

        // Calculate Queue Length (Pending + In Progress)
        const queueLength = serviceRequests.filter(
            req => ['pending', 'confirmed', 'in_progress'].includes(req.status)
        ).length;

        // Update user's queue length in DB to ensure sync
        if (req.user.queueLength !== queueLength) {
            req.user.queueLength = queueLength;
            await req.user.save();
        }

        res.render('operator/dashboard', {
            title: `Operator Dashboard - ${business.name}`,
            user: req.user,
            business,
            orders,
            listings,
            serviceRequests,
            queueLength
        });

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/login');
    }
};

// Operator Update Status
exports.operatorUpdateStatus = async (req, res) => {
    try {
        const { orderId, itemId, status } = req.body;
        const order = await Order.findById(orderId);
        const item = order.items.id(itemId);

        if (item.business.toString() !== req.user.operatorOf.toString()) {
             req.flash('error', 'Unauthorized action.');
             return res.redirect('/operator/dashboard');
        }

        item.status = status;
        await order.save();

        req.flash('success', 'Status updated');
        res.redirect('/operator/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating status');
        res.redirect('/operator/dashboard');
    }
};

// Operator Update Service Request Status
exports.operatorUpdateServiceStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const order = await Order.findById(orderId).populate('serviceDetails.business');

        if (!order) {
             req.flash('error', 'Service request not found.');
             return res.redirect('/operator/dashboard');
        }

        // Check if assigned to this operator
        if (order.serviceDetails.operator.toString() !== req.user._id.toString()) {
             req.flash('error', 'Unauthorized action.');
             return res.redirect('/operator/dashboard');
        }

        const oldStatus = order.status;
        order.status = status;
        await order.save();

        // Manage Queue Length
        // If moving FROM active state TO terminal state, decrement queue
        const activeStates = ['pending', 'confirmed', 'in_progress'];
        const terminalStates = ['completed', 'cancelled', 'ready'];

        if (activeStates.includes(oldStatus) && terminalStates.includes(status)) {
            req.user.queueLength = Math.max(0, (req.user.queueLength || 0) - 1);
            await req.user.save();
        }
        // If moving FROM terminal TO active (re-opening), increment queue
        else if (terminalStates.includes(oldStatus) && activeStates.includes(status)) {
            req.user.queueLength = (req.user.queueLength || 0) + 1;
            await req.user.save();
        }

        // Send Notification
        const businessName = order.serviceDetails.business ? order.serviceDetails.business.name : 'Service Provider';
        const message = `Your service request with ${businessName} is now ${status.replace('_', ' ').toUpperCase()}.`;
        await createNotification(order.user, 'service_update', message, order._id);

        req.flash('success', 'Service status updated');
        res.redirect('/operator/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating service status');
        res.redirect('/operator/dashboard');
    }
};

// SME Owner View Operators List
exports.getOperatorsList = async (req, res) => {
    try {
        const business = await Business.findOne({ _id: req.params.id, owner: req.user._id }).populate('operators');
        if (!business) {
            req.flash('error', 'Business not found');
            return res.redirect('/sme/dashboard');
        }

        // Add metrics if service business
        let operatorsWithMetrics = [];
        
        if (business.category === 'service') {
             // We need to manually attach metrics because .populate() just gives the User document
             for (const op of business.operators) {
                 const completedTasks = await ServiceTask.countDocuments({ 
                     assignedOperator: op._id, 
                     status: 'Completed' 
                 });
                 const pendingTasks = await ServiceTask.countDocuments({ 
                     assignedOperator: op._id, 
                     status: { $in: ['Pending', 'In Progress'] } 
                 });

                 operatorsWithMetrics.push({
                     ...op.toObject(),
                     metrics: { completedTasks, pendingTasks }
                 });
             }
        } else {
            operatorsWithMetrics = business.operators;
        }

        res.render('sme/operators/index', {
            title: `Operators - ${business.name}`,
            business,
            operators: operatorsWithMetrics,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/sme/dashboard');
    }
};

// SME Owner Remove Operator
exports.removeOperator = async (req, res) => {
    try {
        const { operatorId } = req.body;
        const businessId = req.params.id;
        const business = await Business.findOne({ _id: businessId, owner: req.user._id });
        
        business.operators = business.operators.filter(op => op.toString() !== operatorId);
        await business.save();
        await User.findByIdAndDelete(operatorId);

        req.flash('success', 'Operator removed successfully');
        res.redirect(`/sme/business/${businessId}/operators`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error removing operator');
        res.redirect(`/sme/business/${req.params.id}/operators`);
    }
};

// --- Operator Listing CRUD ---

exports.getOperatorAddListingPage = async (req, res) => {
    try {
        const business = await Business.findById(req.user.operatorOf);
        const categories = await Category.find();
        
        if (!business) {
             req.flash('error', 'Business not found.');
             return res.redirect('/operator/dashboard');
        }
        res.render('operator/listings/add', {
            title: 'Add Listing',
            business,
            categories,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/operator/dashboard');
    }
};

exports.operatorAddListing = async (req, res) => {
    try {
        const { name, description, price, stock, duration, category } = req.body;
        const business = await Business.findById(req.user.operatorOf);

        let type = 'product';
        if (business.category === 'service') type = 'service';
        else if (business.category === 'food') type = 'food';

        const newListing = new Listing({
            business: business._id,
            name,
            description,
            price,
            category,
            type,
            stock: (type === 'product' || type === 'retail') ? stock : 0,
            duration: type === 'service' ? duration : 0,
            image: req.file ? `/public/uploads/listings/${req.file.filename}` : undefined
        });

        await newListing.save();
        req.flash('success', 'Listing added successfully');
        res.redirect('/operator/dashboard');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error adding listing');
        res.redirect('/operator/listings/add');
    }
};

exports.getOperatorEditListingPage = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('/operator/dashboard');
        }

        // Ensure listing belongs to operator's business
        if (listing.business.toString() !== req.user.operatorOf.toString()) {
            req.flash('error', 'Unauthorized');
            return res.redirect('/operator/dashboard');
        }

        res.render('operator/listings/edit', {
            title: 'Edit Listing',
            listing,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/operator/dashboard');
    }
};

exports.operatorEditListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('/operator/dashboard');
        }

        if (listing.business.toString() !== req.user.operatorOf.toString()) {
            req.flash('error', 'Unauthorized');
            return res.redirect('/operator/dashboard');
        }

        const { name, description, price, stock, duration } = req.body;

        listing.name = name;
        listing.description = description;
        listing.price = price;
        
        if (listing.type === 'product') listing.stock = stock;
        if (listing.type === 'service') listing.duration = duration;

        if (req.file) {
            listing.image = `/public/uploads/listings/${req.file.filename}`;
        }

        await listing.save();
        req.flash('success', 'Listing updated successfully');
        res.redirect('/operator/dashboard');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating listing');
        res.redirect(`/operator/listings/${req.params.id}/edit`);
    }
};

exports.operatorDeleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('/operator/dashboard');
        }

        if (listing.business.toString() !== req.user.operatorOf.toString()) {
            req.flash('error', 'Unauthorized');
            return res.redirect('/operator/dashboard');
        }

        await Listing.deleteAndCleanup(listing._id);
        req.flash('success', 'Listing deleted');
        res.redirect('/operator/dashboard');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting listing');
        res.redirect('/operator/dashboard');
    }
};
