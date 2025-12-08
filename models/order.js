const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['product_order', 'service_request'],
        required: true
    },
    // For Product Orders
    items: [{
        listing: {
            type: Schema.Types.ObjectId,
            ref: 'Listing'
        },
        business: {
            type: Schema.Types.ObjectId,
            ref: 'Business'
        },
        quantity: {
            type: Number,
            min: 1
        },
        price: {
            type: Number
        },
        name: String,
        image: String,
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'],
            default: 'pending'
        }
    }],
    // For Service Requests
    serviceDetails: {
        listing: {
            type: Schema.Types.ObjectId,
            ref: 'Listing'
        },
        business: {
            type: Schema.Types.ObjectId,
            ref: 'Business'
        },
        operator: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        scriptAnswers: [{
            question: String,
            answer: Schema.Types.Mixed
        }],
        queuePosition: {
            type: Number,
            default: 0
        },
        estimatedWaitTime: {
            type: Number, // in minutes
            default: 0
        }
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'],
        default: 'pending'
    },
    // Feedback System
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', OrderSchema);