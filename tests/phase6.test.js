const mongoose = require('mongoose');
const request = require('supertest');
const { app } = require('../app'); // Destructure app from exports
const Business = require('../models/business');
const User = require('../models/user');
const Listing = require('../models/listing');
const ServiceScript = require('../models/serviceScript');

let retailUser, serviceUser;
let retailBiz, serviceBiz;

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cbecs_test');
    }
    // No need to app.listen() for supertest

    // Cleanup
    await Business.deleteMany({});
    await User.deleteMany({});
    await Listing.deleteMany({});
    await ServiceScript.deleteMany({});
    
    const timestamp = Date.now();

    // Create Users
    retailUser = new User({
        name: 'Retail Owner',
        email: `retail-${timestamp}@test.com`,
        password: 'password123',
        role: 'sme_owner'
    });
    await retailUser.save();

    serviceUser = new User({
        name: 'Service Owner',
        email: `service-${timestamp}@test.com`,
        password: 'password123',
        role: 'sme_owner'
    });
    await serviceUser.save();

    // Create Businesses
    retailBiz = new Business({
        owner: retailUser._id,
        name: 'Retail Shop',
        category: 'retail',
        business_type: 'retail',
        address: 'Test Addr'
    });
    await retailBiz.save();

    serviceBiz = new Business({
        owner: serviceUser._id,
        name: 'Service Shop',
        category: 'service',
        business_type: 'service',
        address: 'Test Addr'
    });
    await serviceBiz.save();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Phase 6.1: Business Type Constraints', () => {

    // LOGIN HELPERS
    // We mock authentication by manually managing sessions or using a test helper if available.
    // Since we don't have easy access to session mocking without logging in, we'll simulate login.
    // BUT, for simplicity in this specific test file, we might need to rely on a login route.
    // Assuming standard passport-local login at /login

    const login = async (email, password) => {
        const agent = request.agent(app);
        await agent
            .post('/login')
            .send({ email, password })
            .expect(302);
        return agent;
    };

    test('Task 6.1.2: Service businesses cannot list products', async () => {
        const agent = await login(serviceUser.email, 'password123');
        
        // Try to add a listing (product)
        // We need a Category first
        const Category = mongoose.model('Category');
        let retailCat = await Category.findOne({ type: 'retail' });
        if (!retailCat) {
             retailCat = await Category.create({ name: 'Gadgets', type: 'retail', slug: 'gadgets' });
        }

        const res = await agent
            .post('/sme/listings/add')
            .send({
                businessId: serviceBiz._id,
                name: 'Illegal Product',
                description: 'Should fail',
                price: 100,
                category: retailCat._id,
                stock: 10
            });
        
        // Expect redirection back to add page (or list) with error flash
        // We can check if listing was created
        const listing = await Listing.findOne({ name: 'Illegal Product' });
        expect(listing).toBeNull();
    });

    test('Task 6.1.3: Retail businesses cannot add operators', async () => {
        const agent = await login(retailUser.email, 'password123');

        const res = await agent
            .post(`/sme/business/${retailBiz._id}/operators/create`)
            .send({
                name: 'Operator X',
                email: 'opx@test.com',
                phone: '123456',
                password: 'password'
            });

        // Verify operator was NOT created
        const operator = await User.findOne({ email: 'opx@test.com' });
        expect(operator).toBeNull();
    });

    test('Task 6.1.3: Retail businesses cannot save service scripts', async () => {
        const agent = await login(retailUser.email, 'password123');

        // Ensure the route is correct. Assuming /sme/business/:id/script/save based on pattern
        const res = await agent
            .post(`/sme/business/${retailBiz._id}/script`)
            .send({
                steps: [{ stepId: 'start', question: 'Q1?' }]
            })
            .expect(403); 
    });

});
