const Business = require('../models/business');
const Order = require('../models/order');
const ServiceScript = require('../models/serviceScript');
const { createNotification } = require('../utils/notification');

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

// Dashboard
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
        
        await Business.deleteOne({ _id: business._id });
        
        req.flash('success', 'Business deleted successfully');
        res.redirect('/sme/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error deleting business');
        res.redirect('/sme/dashboard');
    }
};

// --- SME Order Management ---

// Get SME Orders
exports.getSmeOrders = async (req, res) => {
    try {
        // 1. Find all businesses owned by the user
        const businesses = await Business.find({ owner: req.user._id });
        const businessIds = businesses.map(b => b._id);

        // 2. Find orders that contain items from these businesses
        // We filter the 'items' array in the query to only return orders that HAVE such items
        const orders = await Order.find({
            'items.business': { $in: businessIds }
        })
        .populate('user', 'name email phone') // Get customer details
        .populate('items.listing')
        .sort({ createdAt: -1 });

        // 3. Prepare a friendly structure for the view
        // Since an order might have items from other businesses, we should visually separate/filter them in the view or here.
        // For simplicity, we'll pass the list of owned businessIds to the view so the view can selectively render the items.

        res.render('sme/orders/index', {
            title: 'Incoming Orders',
            orders,
            businessIds: businessIds.map(id => id.toString()),
            user: req.user
        });

    } catch (err) {
        console.error(err);
        req.flash('error', 'Unable to fetch orders');
        res.redirect('/sme/dashboard');
    }
};

// Update Order Item Status
exports.updateOrderItemStatus = async (req, res) => {
    try {
        const { orderId, itemId, status } = req.body;

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/sme/orders');
        }

        // Find the specific item
        const item = order.items.id(itemId);
        if (!item) {
            req.flash('error', 'Item not found in order');
            return res.redirect('/sme/orders');
        }

        // Verify ownership: The item's business must belong to the current user
        const business = await Business.findOne({ _id: item.business, owner: req.user._id });
        if (!business) {
            req.flash('error', 'Unauthorized access to this order item');
            return res.redirect('/sme/orders');
        }

        // Update status
        item.status = status;
        await order.save();

        // Notify Customer
        const message = `Your order for ${item.name} is now ${status.toUpperCase()}.`;
        await createNotification(order.user, 'order_update', message, order._id);

        req.flash('success', 'Order status updated');
        res.redirect('/sme/orders');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating status');
        res.redirect('/sme/orders');
    }
};

// --- Service Script Management ---

exports.getScriptBuilder = async (req, res) => {
    try {
        const business = await Business.findOne({ _id: req.params.id, owner: req.user._id });
        if (!business) {
            req.flash('error', 'Business not found');
            return res.redirect('/sme/dashboard');
        }

        let script = await ServiceScript.findOne({ business: business._id });
        
        // If no script exists, pass a default structure
        if (!script) {
            script = { steps: [] };
        }

        res.render('sme/script/builder', {
            title: `Service Flow - ${business.name}`,
            business,
            script,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/sme/dashboard');
    }
};

exports.saveScript = async (req, res) => {
    try {
        const business = await Business.findOne({ _id: req.params.id, owner: req.user._id });
        if (!business) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { steps, visualLayout } = req.body; 

        let script = await ServiceScript.findOne({ business: business._id });
        
        if (script) {
            script.steps = steps;
            if (visualLayout) script.visualLayout = visualLayout;
            script.updatedAt = Date.now();
            script.version = (script.version || 1) + 1;
        } else {
            script = new ServiceScript({
                business: business._id,
                steps,
                visualLayout,
                version: 1
            });
        }

        await script.save();
        res.json({ success: true, message: 'Script saved successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};