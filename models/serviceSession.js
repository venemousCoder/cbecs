const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceSessionSchema = new Schema({
    business: {
        type: Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    consumer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    operator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    script: {
        type: Schema.Types.ObjectId,
        ref: 'ServiceScript',
        required: true
    },
    scriptVersion: {
        type: Number,
        required: true
    },
    currentStep: {
        type: String,
        required: true
    },
    responses: [{
        stepId: String,
        question: String,
        answer: Schema.Types.Mixed
    }],
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'abandoned'],
        default: 'in_progress'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ServiceSession', ServiceSessionSchema);
