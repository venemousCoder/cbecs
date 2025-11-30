const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceScriptSchema = new Schema({
    business: {
        type: Schema.Types.ObjectId,
        ref: 'Business',
        required: true,
        unique: true // One script per business
    },
    steps: [{
        stepId: { type: String, required: true }, // e.g., "step_1"
        type: { 
            type: String, 
            enum: ['multiple_choice', 'number', 'text', 'file', 'yes_no'],
            required: true 
        },
        question: { type: String, required: true },
        options: [{
            label: { type: String, required: true },
            nextStepId: { type: String, default: null }
        }], // For multiple_choice
        required: { type: Boolean, default: true },
        nextStepId: { type: String, default: null }, // Default next step for non-branching types
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    version: {
        type: Number,
        default: 1
    }
});

module.exports = mongoose.model('ServiceScript', ServiceScriptSchema);
