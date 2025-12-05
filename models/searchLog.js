const mongoose = require('mongoose');

const SearchLogSchema = new mongoose.Schema({
    query: { type: String, required: true },
    filters: {
        type: { type: String }, // 'product', 'service', 'all'
        sort: { type: String }
    },
    resultCount: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SearchLog', SearchLogSchema);
