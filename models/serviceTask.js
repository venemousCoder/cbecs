const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceTaskSchema = new Schema({
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
    session: {
        type: Schema.Types.ObjectId,
        ref: 'ServiceSession'
    },
    answers: [{
        question: String,
        answer: Schema.Types.Mixed
    }],
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    assignedOperator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ServiceTask', ServiceTaskSchema);
