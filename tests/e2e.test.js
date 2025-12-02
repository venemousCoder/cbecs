const request = require('supertest');
const { app, mongoose, startServer } = require('../app');
const path = require('path');
const fs = require('fs');

// Set timeout for long running tests
jest.setTimeout(30000);

describe('End-to-End System Test', () => {
    let smeCookie;
    let consumerCookie;
    let operatorCookie;
    
    let smeUser = {
        name: 'SME Owner',
        email: 'sme@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'sme_owner'
    };

    let consumerUser = {
        name: 'Consumer User',
        email: 'consumer@test.com',
        password: 'password123',
        confirmPassword: 'password123'
    };

    let operatorUser = {
        name: 'Operator User',
        email: 'operator@test.com',
        phone: '1234567890',
        password: 'password123',
        confirmPassword: 'password123'
    };

    let businessId;
    let serviceBusinessId;
    let listingId;
    let orderId;
    let serviceRequestId;
    let operatorId;
    let categoryId;

    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.png');

    beforeAll(async () => {
        await startServer();
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.dropDatabase();
        }

        // Seed Category
        const Category = mongoose.model('Category');
        const category = new Category({
            name: 'Electronics',
            type: 'retail',
            slug: 'electronics',
            icon: 'fa-tv',
            description: 'Test Category'
        });
        await category.save();
        categoryId = category._id;
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    });

    // --- Helper to Login ---
    const login = async (email, password) => {
        const res = await request(app)
            .post('/login')
            .send({ email, password });
        const cookies = res.headers['set-cookie'];
        return cookies;
    };

    test('1. User Registration', async () => {
        // Register SME
        const resSme = await request(app).post('/signup').send(smeUser);
        if (resSme.status !== 302) {
            console.log('SME Signup Error:', resSme.text);
        }
        expect(resSme.status).toBe(302);

        // Register Consumer
        const resConsumer = await request(app).post('/signup').send(consumerUser);
        if (resConsumer.status !== 302) {
             console.log('Consumer Signup Error:', resConsumer.text);
        }
        expect(resConsumer.status).toBe(302);
        
        // Login SME
        smeCookie = await login(smeUser.email, smeUser.password);
        expect(smeCookie).toBeDefined();

        // Login Consumer
        consumerCookie = await login(consumerUser.email, consumerUser.password);
        expect(consumerCookie).toBeDefined();
    });

    test('2. SME creates Retail Business & Product', async () => {
        // Create Business
        const res = await request(app)
            .post('/sme/create-business')
            .set('Cookie', smeCookie)
            .field('name', 'Test Retail Shop')
            .field('category', 'retail')
            .field('address', '123 Test St')
            .field('description', 'A test shop')
            .attach('logo', testImagePath)
            .expect(302);

        // Get Business ID (Assuming redirect to dashboard, need to fetch dashboard or query DB)
        // For simplicity in test, let's query DB directly to get ID, 
        // although strict E2E shouldn't, but it speeds up test dev.
        const Business = mongoose.model('Business');
        const business = await Business.findOne({ name: 'Test Retail Shop' });
        expect(business).toBeTruthy();
        businessId = business._id;

        // Create Product Listing
        await request(app)
            .post('/sme/listings/add')
            .set('Cookie', smeCookie)
            .field('name', 'Test Product')
            .field('description', 'Great product')
            .field('price', 100)
            .field('stock', 10)
            .field('category', categoryId.toString()) 
            .field('businessId', businessId.toString())
            .attach('image', testImagePath)
            .expect(302);

        const Listing = mongoose.model('Listing');
        const listing = await Listing.findOne({ name: 'Test Product' });
        expect(listing).toBeTruthy();
        listingId = listing._id;
    });

    test('3. Consumer buys Product', async () => {
        // Add to Cart
        await request(app)
            .post('/cart/add')
            .set('Cookie', consumerCookie)
            .send({ listingId: listingId, quantity: 1 })
            .expect(302);

        // Checkout
        await request(app)
            .post('/checkout')
            .set('Cookie', consumerCookie)
            .expect(302);
        
        const Order = mongoose.model('Order');
        const order = await Order.findOne({ user: (await mongoose.model('User').findOne({ email: consumerUser.email }))._id });
        expect(order).toBeTruthy();
        expect(order.totalAmount).toBe(100);
        orderId = order._id;
    });

    test('4. SME updates Order Status', async () => {
        // SME updates item status
        // We need itemId. Order has items array.
        const Order = mongoose.model('Order');
        const order = await Order.findById(orderId);
        const itemId = order.items[0]._id;

        await request(app)
            .post('/sme/orders/update-status')
            .set('Cookie', smeCookie)
            .send({ 
                orderId: orderId, 
                itemId: itemId, 
                status: 'processing' 
            })
            .expect(302);
        
        // Check Notification
        const Notification = mongoose.model('Notification');
        const notif = await Notification.findOne({ 
            recipient: order.user, 
            type: 'order_update' 
        });
        expect(notif).toBeTruthy();
        expect(notif.message).toContain('PROCESSING');
    });

    test('5. SME creates Service Business & Script', async () => {
        // Create Service Business
        await request(app)
            .post('/sme/create-business')
            .set('Cookie', smeCookie)
            .field('name', 'Test Service Shop')
            .field('category', 'service')
            .field('address', '456 Service Ln')
            .field('description', 'We fix things')
            .attach('logo', testImagePath)
            .expect(302);

        const Business = mongoose.model('Business');
        const business = await Business.findOne({ name: 'Test Service Shop' });
        serviceBusinessId = business._id;

        // Create Script
        const scriptData = {
            steps: [
                {
                    stepId: 'step_1',
                    type: 'text',
                    question: 'What is the issue?',
                    nextStepId: null // End
                }
            ]
        };

        await request(app)
            .post(`/sme/business/${serviceBusinessId}/script`)
            .set('Cookie', smeCookie)
            .send(scriptData)
            .expect(200);
    });

    test('6. SME adds Operator', async () => {
        await request(app)
            .post(`/sme/business/${serviceBusinessId}/operators/add`)
            .set('Cookie', smeCookie)
            .send(operatorUser) // contains name, email, phone, password
            .expect(302);

        const User = mongoose.model('User');
        const operator = await User.findOne({ email: operatorUser.email });
        expect(operator).toBeTruthy();
        expect(operator.role).toBe('operator');
        operatorId = operator._id;

        // Login Operator
        operatorCookie = await login(operatorUser.email, operatorUser.password);
        expect(operatorCookie).toBeDefined();
    });

    test('7. Consumer Books Service', async () => {
        // Start Session
        const resStart = await request(app)
            .post('/service/start')
            .set('Cookie', consumerCookie)
            .send({ 
                businessId: serviceBusinessId, 
                operatorId: operatorId 
            })
            .expect(200);
        
        const sessionId = resStart.body.sessionId;
        expect(sessionId).toBeDefined();

        // Submit Step (Review Summary -> Submit)
        // Our mocked script has step_1.
        // 1. Answer step_1
        await request(app)
            .post('/service/submit')
            .set('Cookie', consumerCookie)
            .send({ 
                sessionId: sessionId, 
                answer: 'My laptop is broken' 
            })
            .expect(200);
        
        // 2. Confirm Summary (Trigger completion)
        // The controller logic says: if !nextStepId, returns review summary. 
        // Then user submits 'CONFIRMED_SUMMARY' to finish.
        await request(app)
            .post('/service/submit')
            .set('Cookie', consumerCookie)
            .send({ 
                sessionId: sessionId, 
                answer: 'CONFIRMED_SUMMARY' 
            })
            .expect(200);

        // Check Service Request Order
        const Order = mongoose.model('Order');
        const serviceReq = await Order.findOne({ 
            type: 'service_request',
            'serviceDetails.business': serviceBusinessId 
        });
        expect(serviceReq).toBeTruthy();
        serviceRequestId = serviceReq._id;
    });

    test('8. Operator Updates Service Status', async () => {
        await request(app)
            .post('/operator/services/update-status')
            .set('Cookie', operatorCookie)
            .send({ 
                orderId: serviceRequestId, 
                status: 'in_progress' 
            })
            .expect(302);

        // Check Notification
        const Notification = mongoose.model('Notification');
        const consumer = await mongoose.model('User').findOne({ email: consumerUser.email });
        const notif = await Notification.findOne({ 
            recipient: consumer._id, 
            type: 'service_update',
            message: /IN PROGRESS/ 
        });
        expect(notif).toBeTruthy();
    });
});
