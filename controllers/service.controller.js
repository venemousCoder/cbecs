const ServiceScript = require('../models/serviceScript');
const ServiceSession = require('../models/serviceSession');
const ServiceTask = require('../models/serviceTask');
const Business = require('../models/business');
const User = require('../models/user');

// 1. Start Service Session
exports.startServiceSession = async (req, res) => {
    try {
        const { businessId, operatorId } = req.body;

        if (!businessId || !operatorId) {
            return res.status(400).json({ error: 'Business ID and Operator ID are required.' });
        }

        // Check Business Type first (Task 6.1.3)
        const business = await Business.findById(businessId).populate('operators');
        if (!business) return res.status(404).json({ error: 'Business not found' });

        if (business.business_type === 'retail') {
            return res.status(403).json({ error: 'Retail businesses cannot accept service requests.' });
        }

        // Validate Operator belongs to Business
        const operatorUser = business.operators.find(op => op._id.toString() === operatorId);
        if (!operatorUser) {
            return res.status(400).json({ error: 'Selected operator does not belong to this business.' });
        }

        // Check if Operator is Available (Task 7.6.1)
        // We need to fetch the full user object to check isAvailable, as populate might only get basic fields or we just have the ref from business
        // Actually business.populate('operators') fetches full documents.
        if (!operatorUser.isAvailable) {
             return res.status(400).json({ error: 'Selected operator is currently unavailable. Please choose another.' });
        }

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
            operator: operatorId, // Save selected operator
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

const Order = require('../models/order');

// ... (existing imports and functions)

// Helper to create task (Refactored to create Order)
async function createTaskFromSession(session) {
    let operatorId = session.operator;

    // If no operator selected, auto-assign (Round Robin / Load Balancing)
    if (!operatorId) {
        const business = await Business.findById(session.business).populate('operators');
        
        if (business.operators && business.operators.length > 0) {
            // Simple Load Balancing: Find operator with shortest queue
            let bestOperator = business.operators[0];
            let minQueue = bestOperator.queueLength || 0;

            for (const op of business.operators) {
                if ((op.queueLength || 0) < minQueue) {
                    minQueue = op.queueLength || 0;
                    bestOperator = op;
                }
            }
            operatorId = bestOperator._id;
        } else {
            // Fallback to owner
            operatorId = session.business.owner; 
        }
    }

    // Calculate Queue Position & Wait Time (Task 7.6.3 - Atomic Update)
    // We atomically increment the queue length and get the updated document
    const updatedOperator = await User.findByIdAndUpdate(
        operatorId, 
        { $inc: { queueLength: 1 } },
        { new: true } // Return the modified document
    );
    
    // If operator not found (rare race condition or deletion), handle gracefully
    if (!updatedOperator) {
         console.error(`Operator ${operatorId} not found during queue assignment`);
         // We might want to throw error or assign to backup, but for now we proceed with fallback logic or just fail safely
         // Let's assume queuePos 1 if fail
    }

    const queuePos = updatedOperator ? updatedOperator.queueLength : 1;
    const estWait = queuePos * 15; // Assuming 15 mins per task roughly

    // Create unified Order of type 'service_request'
    const newOrder = new Order({
        user: session.consumer,
        type: 'service_request',
        serviceDetails: {
            business: session.business,
            operator: operatorId,
            scriptAnswers: session.responses,
            queuePosition: queuePos,
            estimatedWaitTime: estWait
        },
        totalAmount: 0, // Service requests might be quoted later or fixed price not yet implemented
        status: 'pending'
    });

    await newOrder.save();
    // Operator queue updated via atomic operation above
}

// 3. Get Shop Landing Page (Operator Selection)
exports.getShopLandingPage = async (req, res) => {
    try {
        const business = await Business.findById(req.params.businessId).populate('operators');
        if (!business) return res.redirect('/');

        // Enforce Business Type
        if (business.business_type === 'retail') {
             return res.redirect('/'); 
        }

        // Get Script to show services (optional, just for display)
        const script = await ServiceScript.findOne({ business: business._id });

        res.render('service/landing', {
            title: `${business.name} - Select Operator`,
            business,
            script, // Pass script to show services list
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};

// 4. Get Chat Page
exports.getChatPage = async (req, res) => {
    try {
        const business = await Business.findById(req.params.businessId).populate('operators');
        if (!business) return res.redirect('/');

        // Enforce Business Type (Task 6.1.3)
        if (business.business_type === 'retail') {
             return res.redirect('/'); 
        }

        const selectedOperatorId = req.query.operator; 

        // Phase 7: Enforce Operator Selection
        if (!selectedOperatorId) {
            return res.redirect(`/service/shop/${business._id}`);
        }

        // Validate Operator belongs to business
        const operatorExists = business.operators.some(op => op._id.toString() === selectedOperatorId);
        if (!operatorExists) {
            // If invalid operator, go back to selection
            return res.redirect(`/service/shop/${business._id}`);
        }

        res.render('service/chat', {
            title: `Book Service - ${business.name}`,
            business,
            user: req.user,
            selectedOperatorId // Pass to view
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};
