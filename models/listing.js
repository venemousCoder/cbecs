const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ListingSchema = new Schema({
    business: {
        type: Schema.Types.ObjectId,
        ref: 'Business',
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

module.exports = mongoose.model('Listing', ListingSchema);
