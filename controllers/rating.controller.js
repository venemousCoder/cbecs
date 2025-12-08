const Order = require('../models/order');
const User = require('../models/user');

// Rate an Order
exports.rateOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { rating, review } = req.body;

        // Validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
        }

        const order = await Order.findOne({ _id: orderId, user: req.user._id });
        if (!order) {
            return res.status(404).json({ error: 'Order not found or not authorized.' });
        }

        if (order.status !== 'completed') {
            return res.status(400).json({ error: 'You can only rate completed orders.' });
        }

        if (order.rating) {
            return res.status(400).json({ error: 'You have already rated this order.' });
        }

        // Save Rating
        order.rating = parseInt(rating);
        order.review = review;
        await order.save();

        // Update Operator's Average Rating (if service request)
        if (order.type === 'service_request' && order.serviceDetails && order.serviceDetails.operator) {
            const operatorId = order.serviceDetails.operator;
            const operator = await User.findById(operatorId);

            if (operator) {
                // Fetch all rated orders for this operator to recalculate
                // Alternatively, we could do incremental update: 
                // newAvg = ((oldAvg * count) + newRating) / (count + 1)
                
                const currentAvg = operator.averageRating || 5;
                const currentCount = operator.reviewCount || 0;

                const newCount = currentCount + 1;
                const newAvg = ((currentAvg * currentCount) + order.rating) / newCount;

                operator.averageRating = newAvg;
                operator.reviewCount = newCount;
                await operator.save();
            }
        }
        
        // Return Success
        // If request expects JSON (AJAX)
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ success: true, message: 'Rating submitted successfully.' });
        }
        
        // Else redirect back
        res.redirect('/orders'); // Or back to order details

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};
