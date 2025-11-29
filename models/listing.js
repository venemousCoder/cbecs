const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ListingSchema = new Schema({
    business: {
        type: Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    type: {
        type: String,
        enum: ['product', 'service', 'food'],
        required: true
    },
    image: {
        type: String,
        default: '/public/assets/default-product.png'
    },
    stock: {
        type: Number,
        default: 0, // Only relevant for products
        min: 0
    },
    duration: {
        type: Number, // In minutes, only relevant for services
        default: 30
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Static method to delete listing and clean up orders
ListingSchema.statics.deleteAndCleanup = async function(listingId) {
    const Order = mongoose.model('Order');
    
    // 1. Delete the listing
    const result = await this.findByIdAndDelete(listingId);
    if (!result) return null; // Listing not found

    // 2. Find orders containing this listing
    const orders = await Order.find({ 'items.listing': listingId });

    // 3. Process each order
    for (const order of orders) {
        // Remove the specific item(s)
        order.items = order.items.filter(item => item.listing.toString() !== listingId.toString());

        // Recalculate total amount (simple sum of remaining items)
        // Note: This assumes price is stored on item. If not, it might be complex.
        // Looking at Order model, price IS stored on item.
        order.totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (order.items.length === 0) {
            // If no items left, delete the order
            await Order.deleteOne({ _id: order._id });
        } else {
            // Otherwise save the updated order
            await order.save();
        }
    }

    return result;
};

module.exports = mongoose.model('Listing', ListingSchema);
