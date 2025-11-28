const Order = require('../models/order');

exports.getConsumerOrders = async (req, res) => {
    try {
        // Find orders for the current logged-in user, sorted by newest first
        const orders = await Order.find({ user: req.user._id })
            .populate('items.listing')
            .populate('items.business')
            .sort({ createdAt: -1 });

        res.render('orders/index', {
            title: 'My Orders',
            orders,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};
