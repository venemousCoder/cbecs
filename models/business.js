const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BusinessSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    business_type: {
        type: String,
        enum: ['retail', 'service', 'hybrid'],
        required: true
    },
    category: {
        type: String,
        enum: ['retail', 'service', 'food'],
        required: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    logo: {
        type: String, // Path to the uploaded file
        default: '/public/assets/default-business.png'
    },
    operators: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended'],
        default: 'active'
    },
    changeRequest: {
        requestedType: {
            type: String,
            enum: ['retail', 'service', 'hybrid']
        },
        reason: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        requestedAt: {
            type: Date,
            default: Date.now
        },
        adminResponse: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Business', BusinessSchema);
