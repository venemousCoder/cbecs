const ServiceScript = require('../models/serviceScript');
const ServiceSession = require('../models/serviceSession');
const ServiceTask = require('../models/serviceTask');
const Business = require('../models/business');
const User = require('../models/user');

// 1. Start Service Session
exports.startServiceSession = async (req, res) => {
    try {
        const { businessId, operatorId } = req.body;

        const script = await ServiceScript.findOne({ business: businessId });
        if (!script || script.steps.length === 0) {
            return res.status(400).json({ error: 'This business has not set up their service flow yet.' });
        }

        // Create new session
        const newSession = new ServiceSession({
            business: businessId,
            consumer: req.user._id,
            script: script._id,
            scriptVersion: script.version || 1, // Save version
            operator: operatorId || null, // Save selected operator
            currentStep: script.steps[0].stepId,
            responses: [],
            status: 'in_progress'
        });

        await newSession.save();

        // Return first step
        res.json({
            sessionId: newSession._id,
            step: script.steps[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// 2. Submit Answer & Get Next Step
exports.submitStep = async (req, res) => {
    try {
        const { sessionId, answer } = req.body;
        
        const session = await ServiceSession.findById(sessionId).populate('script');
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const script = session.script;
        const currentStepIndex = script.steps.findIndex(s => s.stepId === session.currentStep);
        const currentStep = script.steps[currentStepIndex];

        // Save answer
        session.responses.push({
            stepId: currentStep.stepId,
            question: currentStep.question,
            answer: answer
        });

        // Determine next step logic
        let nextStepId = currentStep.nextStepId;

        // Check for branching based on options
        if (currentStep.options && currentStep.options.length > 0) {
            const matchedOption = currentStep.options.find(opt => 
                opt.label.toLowerCase() === answer.trim().toLowerCase()
            );
            if (matchedOption && matchedOption.nextStepId) {
                nextStepId = matchedOption.nextStepId;
            }
        }

        // If no next step, trigger Review Summary (unless already confirmed)
        if (!nextStepId) {
            if (answer === 'CONFIRMED_SUMMARY') {
                session.status = 'completed';
                await session.save();
                await createTaskFromSession(session);
                return res.json({ completed: true });
            } else {
                // Send Review Step
                return res.json({ 
                    step: {
                        type: 'review_summary',
                        question: 'Please review your details before submitting:',
                        responses: session.responses
                    }
                });
            }
        }

        // Update session to next step
        session.currentStep = nextStepId;
        await session.save();

        // Return next step data
        const nextStep = script.steps.find(s => s.stepId === nextStepId);
        res.json({ step: nextStep });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// 2.5 Handle File Upload
exports.uploadFile = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const session = await ServiceSession.findById(sessionId).populate('script');
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const script = session.script;
        const currentStepIndex = script.steps.findIndex(s => s.stepId === session.currentStep);
        const currentStep = script.steps[currentStepIndex];

        // Save answer (file path)
        const filePath = `/${file.path}`; // Store relative path
        session.responses.push({
            stepId: currentStep.stepId,
            question: currentStep.question,
            answer: filePath,
            type: 'file'
        });

        // Determine next step logic (simplified for file upload as it usually doesn't branch)
        let nextStepId = currentStep.nextStepId;

        if (!nextStepId) {
            session.status = 'completed';
            await session.save();
            await createTaskFromSession(session);
            return res.json({ completed: true });
        }

        session.currentStep = nextStepId;
        await session.save();

        const nextStep = script.steps.find(s => s.stepId === nextStepId);
        res.json({ step: nextStep, filePath: filePath });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Helper to create task
async function createTaskFromSession(session) {
    let operatorId = session.operator;

    // If no operator selected, auto-assign (Round Robin / Load Balancing)
    if (!operatorId) {
        const business = await Business.findById(session.business).populate('operators');
        
        if (business.operators && business.operators.length > 0) {
            // Simple Load Balancing: Find operator with fewest PENDING tasks
            // We need to query ServiceTask to count pending tasks for each operator
            
            let bestOperator = business.operators[0]._id;
            let minTasks = Infinity;

            for (const op of business.operators) {
                const count = await ServiceTask.countDocuments({ 
                    assignedOperator: op._id, 
                    status: { $in: ['Pending', 'In Progress'] } 
                });
                
                if (count < minTasks) {
                    minTasks = count;
                    bestOperator = op._id;
                }
            }
            operatorId = bestOperator;
        } else {
            // Fallback to owner
            operatorId = session.business.owner; 
        }
    }

    const newTask = new ServiceTask({
        business: session.business,
        consumer: session.consumer,
        session: session._id,
        answers: session.responses,
        assignedOperator: operatorId
    });

    await newTask.save();
}

// 3. Get Chat Page
exports.getChatPage = async (req, res) => {
    try {
        const business = await Business.findById(req.params.businessId).populate('operators');
        if (!business) return res.redirect('/');

        res.render('service/chat', {
            title: `Book Service - ${business.name}`,
            business,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};
