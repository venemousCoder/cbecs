const mongoose = require('mongoose');
const request = require('supertest');
const { app } = require('../app');
const Business = require('../models/business');
const User = require('../models/user');
const ServiceScript = require('../models/serviceScript');
const ServiceSession = require('../models/serviceSession');

let serviceOwner, operator1, operator2, consumer;
let serviceBiz;
let script;

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cbecs_test');
    }

    // Cleanup
    await Business.deleteMany({});
    await User.deleteMany({});
    await ServiceScript.deleteMany({});
    await ServiceSession.deleteMany({});

    const timestamp = Date.now();

    // Create Users
    serviceOwner = new User({
        name: 'Service Owner',
        email: `owner-${timestamp}@test.com`,
        password: 'password123',
        role: 'sme_owner'
    });
    await serviceOwner.save();

    operator1 = new User({
        name: 'Operator One',
        email: `op1-${timestamp}@test.com`,
        password: 'password123',
        role: 'operator'
    });
    await operator1.save();

    operator2 = new User({
        name: 'Operator Two',
        email: `op2-${timestamp}@test.com`,
        password: 'password123',
        role: 'operator'
    });
    await operator2.save();

    consumer = new User({
        name: 'Consumer User',
        email: `consumer-${timestamp}@test.com`,
        password: 'password123',
        role: 'consumer'
    });
    await consumer.save();

    // Create Business
    serviceBiz = new Business({
        owner: serviceOwner._id,
        name: 'Test Service Shop',
        category: 'service',
        business_type: 'service',
        address: '123 Test St',
        operators: [operator1._id, operator2._id]
    });
    await serviceBiz.save();

    // Link operators to business
    operator1.operatorOf = serviceBiz._id;
    await operator1.save();
    operator2.operatorOf = serviceBiz._id;
    await operator2.save();

    // Create Script
    script = new ServiceScript({
        business: serviceBiz._id,
        steps: [
            {
                stepId: 'q1',
                question: 'What do you need?',
                type: 'text',
                nextStepId: null
            }
        ]
    });
    await script.save();
});

afterAll(async () => {
    await mongoose.connection.close();
});

const login = async (email, password) => {
    const agent = request.agent(app);
    await agent
        .post('/login')
        .send({ email, password })
        .expect(302);
    return agent;
};

describe('Phase 7: Service Booking Flow Correction', () => {

    test('7.1: Access Shop Landing Page (Operator Selection)', async () => {
        const agent = await login(consumer.email, 'password123');
        
        const res = await agent
            .get(`/service/shop/${serviceBiz._id}`)
            .expect(200);
        
        // Check for operator names in response (HTML)
        expect(res.text).toContain('Operator One');
        expect(res.text).toContain('Operator Two');
        expect(res.text).toContain('Choose an Operator');
    });

    test('7.2: Redirect to Landing Page if accessing Chat without Operator', async () => {
        const agent = await login(consumer.email, 'password123');
        
        // Try to access /book/:id directly
        await agent
            .get(`/service/book/${serviceBiz._id}`)
            .expect(302)
            .expect('Location', `/service/shop/${serviceBiz._id}`);
    });

    test('7.3: Redirect to Landing Page if Operator is invalid', async () => {
        const agent = await login(consumer.email, 'password123');
        
        // Random fake ID
        const fakeId = new mongoose.Types.ObjectId();

        await agent
            .get(`/service/book/${serviceBiz._id}?operator=${fakeId}`)
            .expect(302)
            .expect('Location', `/service/shop/${serviceBiz._id}`);
    });

    test('7.4: Access Chat Page with Valid Operator', async () => {
        const agent = await login(consumer.email, 'password123');
        
        await agent
            .get(`/service/book/${serviceBiz._id}?operator=${operator1._id}`)
            .expect(200);
    });

    test('7.5: Start Session requires Operator ID', async () => {
        const agent = await login(consumer.email, 'password123');
        
        // Missing operatorId
        await agent
            .post('/service/start')
            .send({
                businessId: serviceBiz._id
            })
            .expect(400);
    });

    test('7.6: Start Session with Invalid Operator returns error', async () => {
        const agent = await login(consumer.email, 'password123');
        const fakeId = new mongoose.Types.ObjectId();

        await agent
            .post('/service/start')
            .send({
                businessId: serviceBiz._id,
                operatorId: fakeId
            })
            .expect(400); // We set it to return 400 for invalid operator
    });

    test('7.7: Start Session Success', async () => {
        const agent = await login(consumer.email, 'password123');
        
        const res = await agent
            .post('/service/start')
            .send({
                businessId: serviceBiz._id,
                operatorId: operator1._id
            })
            .expect(200);
        
        expect(res.body).toHaveProperty('sessionId');
        expect(res.body.step.question).toBe('What do you need?');

        // Verify session in DB
        const session = await ServiceSession.findById(res.body.sessionId);
        expect(session).not.toBeNull();
        expect(session.operator.toString()).toBe(operator1._id.toString());
    });

});
