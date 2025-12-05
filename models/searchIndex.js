const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SearchIndexSchema = new Schema({
    type: {
        type: String,
        enum: ['product', 'service_business'],
        required: true
    },
    referenceId: {
        type: Schema.Types.ObjectId,
        required: true,
        // Dynamic ref based on type? Or just store ID.
        // We can't use 'ref' easily for polymorphic relationships in Mongoose standard populates,
        // but we can store it.
    },
    title: { // Product Name or Business Name
        type: String,
        required: true,
        text: true // Text index
    },
    description: {
        type: String,
        text: true
    },
    category: {
        type: String
    },
    tags: [{
        type: String,
        text: true
    }],
    price: {
        type: Number // Product only
    },
    // Service Business Fields
    services_offered: [{
        type: String,
        text: true
    }],
    operator_count: {
        type: Number
    },
    avg_wait_time: {
        type: String
    },
    business_type: {
        type: String,
        enum: ['retail', 'service', 'hybrid']
    },
    business_id: { // For products to link back to business
        type: Schema.Types.ObjectId,
        ref: 'Business'
    },
    business_name: {
        type: String
    },
    image: {
        type: String
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound text index for search
SearchIndexSchema.index({ 
    title: 'text', 
    description: 'text', 
    tags: 'text', 
    services_offered: 'text' 
}, {
    weights: {
        title: 10,
        tags: 5,
        services_offered: 5,
        description: 1
    }
});

module.exports = mongoose.model('SearchIndex', SearchIndexSchema);
