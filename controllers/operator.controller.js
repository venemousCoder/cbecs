const Business = require('../models/business');
const User = require('../models/user');
const Order = require('../models/order');

// Render Add Operator Page
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

        // Retail Constraint: Only 1 operator allowed
        if (business.category === 'retail' && business.operators.length >= 1) {
            req.flash('error', 'Retail businesses can only have 1 operator.');
            return res.redirect(`/sme/business/${businessId}/manage`);
        }

        // Check if email exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'User with this email already exists.');
            return res.redirect(`/sme/business/${businessId}/operators/add`);
        }

        // Create Operator User
        const newOperator = new User({
            name,
            email,
            phone,
            password, // Hashed by pre-save hook
            role: 'operator',
            operatorOf: business._id
        });

        await newOperator.save();

        // Add to Business
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
        // 1. Get the business this operator belongs to
        const business = await Business.findById(req.user.operatorOf);
        
        if (!business) {
            req.flash('error', 'Business not found or you are not assigned properly.');
            return res.redirect('/login');
        }

        // 2. Get assigned tasks/orders
        // Logic: Operators see orders containing items from their business.
        // For now, showing ALL orders for that business.
        const orders = await Order.find({
            'items.business': business._id
        })
        .populate('user', 'name phone')
        .populate('items.listing')
        .sort({ createdAt: -1 });

        res.render('operator/dashboard', {
            title: `Operator Dashboard - ${business.name}`,
            user: req.user,
            business,
            orders
        });

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/login');
    }
};

// Operator Update Item Status
exports.operatorUpdateStatus = async (req, res) => {
    try {
        const { orderId, itemId, status } = req.body;

        // Security check: Ensure operator belongs to the business of the item
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

// SME Owner View Operators List
exports.getOperatorsList = async (req, res) => {
    try {
        const business = await Business.findOne({ _id: req.params.id, owner: req.user._id }).populate('operators');
        if (!business) {
            req.flash('error', 'Business not found');
            return res.redirect('/sme/dashboard');
        }

        res.render('sme/operators/index', {
            title: `Operators - ${business.name}`,
            business,
            operators: business.operators,
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
        
        // Remove from business array
        business.operators = business.operators.filter(op => op.toString() !== operatorId);
        await business.save();

        // Delete User (or set to consumer, but deletion is cleaner for this context)
        await User.findByIdAndDelete(operatorId);

        req.flash('success', 'Operator removed successfully');
        res.redirect(`/sme/business/${businessId}/operators`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error removing operator');
        res.redirect(`/sme/business/${req.params.id}/operators`);
    }
};