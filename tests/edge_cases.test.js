const request = require('supertest');
const { app, mongoose, startServer } = require('../app');
const path = require('path');

jest.setTimeout(30000);

describe('Edge Cases & Error Handling', () => {
    let consumerCookie;
    let smeCookie;
    let businessId;

    beforeAll(async () => {
        await startServer();
        if (mongoose.connection.readyState === 1) {
            const collections = mongoose.connection.collections;
            for (const key in collections) {
                await collections[key].deleteMany({});
            }
        }
        
        // Register & Login Consumer
        await request(app).post('/signup').send({
            name: 'Edge Consumer',
            email: 'edge@test.com',
            password: 'password',
            confirmPassword: 'password'
        });
        const resLogin = await request(app).post('/login').send({
            email: 'edge@test.com',
            password: 'password'
        });
        consumerCookie = resLogin.headers['set-cookie'];

        // Register SME & Business (needed for some tests)
        await request(app).post('/signup').send({
            name: 'Edge SME',
            email: 'edgesme@test.com',
            password: 'password',
            confirmPassword: 'password',
            role: 'sme_owner'
        });
        const resSmeLogin = await request(app).post('/login').send({
             email: 'edgesme@test.com',
             password: 'password'
        });
        smeCookie = resSmeLogin.headers['set-cookie'];

        // Create dummy business
        const Business = mongoose.model('Business');
        const business = new Business({
            owner: (await mongoose.model('User').findOne({ email: 'edgesme@test.com' }))._id,
            name: 'Edge Shop',
            category: 'service',
            business_type: 'service',
            address: 'Edge St'
        });
        await business.save();
        businessId = business._id;
    });

    afterAll(async () => {
        if (mongoose.connection.readyState === 1) {
            const collections = mongoose.connection.collections;
            for (const key in collections) {
                await collections[key].deleteMany({});
            }
        }
        await mongoose.disconnect();
    });

    test('1. Add to Cart with Invalid Listing ID', async () => {
        await request(app)
            .post('/cart/add')
            .set('Cookie', consumerCookie)
            .send({ listingId: new mongoose.Types.ObjectId(), quantity: 1 })
            .expect(302); // Should redirect back with flash error
    });

    test('2. Service Session Start without Script', async () => {
        // Business exists but has no script
        const res = await request(app)
            .post('/service/start')
            .set('Cookie', consumerCookie)
            .send({ businessId: businessId });
        
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('not set up their service flow');
    });

    test('3. Access Restricted Page without Login', async () => {
        await request(app)
            .get('/sme/dashboard')
            .expect(302)
            .expect('Location', '/login');
    });

    test('4. Unauthorized Access to SME Dashboard', async () => {
        // Consumer tries to access SME dashboard
        await request(app)
            .get('/sme/dashboard')
            .set('Cookie', consumerCookie)
            .expect(302) // Should redirect
            .expect('Location', '/'); // Redirects to home usually
    });
});
