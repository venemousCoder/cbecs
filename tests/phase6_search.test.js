const mongoose = require('mongoose');
const request = require('supertest');
const { app } = require('../app');
const Business = require('../models/business');
const User = require('../models/user');
const Listing = require('../models/listing');
const SearchIndex = require('../models/searchIndex');
const SearchLog = require('../models/searchLog');
const Category = require('../models/category');
const ServiceScript = require('../models/serviceScript');

// Increase timeout for async operations
jest.setTimeout(30000);

let retailUser, serviceUser;
let retailBiz, serviceBiz;
let retailCat, serviceCat;
let timestamp;

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cbecs_test_search');
    }

    timestamp = Date.now();
    console.log('SearchIndex Collection Name:', SearchIndex.collection.name);

    // Clean up
    await User.deleteMany({});
    await Business.deleteMany({});
    await Listing.deleteMany({});
    try { await SearchIndex.collection.drop(); } catch (e) { console.log('Drop SearchIndex failed:', e.message); }
    await SearchLog.deleteMany({});
    await Category.deleteMany({});
    await ServiceScript.deleteMany({});

    // Create Categories
    retailCat = await Category.create({ name: 'Electronics', type: 'retail', slug: 'electronics' });
    serviceCat = await Category.create({ name: 'Repairs', type: 'service', slug: 'repairs' });

    // Create Users
    await User.init(); // Ensure User indexes (email unique) are ready
    
    retailUser = await User.create({
        name: 'Retailer Bob',
        email: `bob-${timestamp}@retail.com`,
        password: 'password123',
        role: 'sme_owner'
    });
    
    serviceUser = await User.create({
        name: 'Service Sarah',
        email: `sarah-${timestamp}@service.com`,
        password: 'password123',
        role: 'sme_owner'
    });

    // Create Businesses
    retailBiz = await Business.create({
        owner: retailUser._id,
        name: 'Bob Gadgets',
        category: 'retail',
        business_type: 'retail',
        address: '123 Retail St'
    });

    serviceBiz = await Business.create({
        owner: serviceUser._id,
        name: 'Sarah Repairs',
        category: 'service',
        business_type: 'service',
        address: '456 Service Rd'
    });
    
    await SearchIndex.init(); // Ensure text indexes are built
});

afterAll(async () => {
    await mongoose.connection.close();
});

// Mock Login Helper
const login = async (email, password) => {
    const agent = request.agent(app);
    await agent
        .post('/login')
        .send({ email, password })
        .expect(302);
    return agent;
};

describe('Phase 6.6: Search Functionality', () => {

    test('Task 6.2.2: Index Product on Creation', async () => {
        const agent = await login(`bob-${timestamp}@retail.com`, 'password123');

        // Create Listing
        await agent
            .post('/sme/listings/add')
            .field('businessId', retailBiz._id.toString())
            .field('name', 'Super Smartphone')
            .field('description', 'The best phone ever with 5G.')
            .field('price', 999)
            .field('stock', 10)
            .field('category', retailCat._id.toString())
            .expect(302);

        // Give time for async indexing
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify Search Index
        const indexEntry = await SearchIndex.findOne({ title: 'Super Smartphone' });
        expect(indexEntry).toBeTruthy();
        expect(indexEntry.type).toBe('product');
        expect(indexEntry.business_id.toString()).toBe(retailBiz._id.toString());
    });

    test('Task 6.2.3: Index Service Business Keywords from Script', async () => {
        const agent = await login(`sarah-${timestamp}@service.com`, 'password123');

        // Update Service Script
        const scriptData = {
            steps: [
                {
                    stepId: 'step1',
                    question: 'What do you need?',
                    type: 'multiple_choice',
                    options: [
                        { label: 'Screen Replacement', value: 'screen' },
                        { label: 'Battery Fix', value: 'battery' }
                    ]
                }
            ]
        };

        await agent
            .post(`/sme/business/${serviceBiz._id}/script`)
            .send(scriptData)
            .expect(200);

        // Give time for async indexing
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify Search Index
        const indexEntry = await SearchIndex.findOne({ title: 'Sarah Repairs' });
        expect(indexEntry).toBeTruthy();
        expect(indexEntry.type).toBe('service_business');
        expect(indexEntry.services_offered).toContain('Screen Replacement');
        expect(indexEntry.services_offered).toContain('Battery Fix');
    });

    test('Task 6.6.1: Search Query - Mixed Results', async () => {
        // Search for "Smartphone" (matches Smartphone)
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for text index
        let res = await request(app).get('/search?q=Smartphone');
        expect(res.status).toBe(200);
        expect(res.text).toContain('Super Smartphone');
        
        // Search for "Battery" (matches Service)
        res = await request(app).get('/search?q=Battery');
        expect(res.status).toBe(200);
        expect(res.text).toContain('Sarah Repairs');
        expect(res.text).toContain('Battery Fix');
    });

    test('Task 6.6.2: Search Analytics Logging', async () => {
        // Perform a search
        await request(app).get('/search?q=AnalyticsTest');

        // Check Log
        // Give time for async save
        await new Promise(resolve => setTimeout(resolve, 1000));

        const log = await SearchLog.findOne({ query: 'AnalyticsTest' });
        expect(log).toBeTruthy();
    });

    test('Task 6.6.3: Pagination', async () => {
        const agent = await login(`bob-${timestamp}@retail.com`, 'password123');
        
        // Create 5 more products
        for (let i = 1; i <= 5; i++) {
            await agent
                .post('/sme/listings/add')
                .field('businessId', retailBiz._id.toString())
                .field('name', `PageItem ${i}`)
                .field('description', 'Test pagination')
                .field('price', 10)
                .field('stock', 5)
                .field('category', retailCat._id.toString())
                .expect(302);
        }
        
        // Wait for indexing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Search with limit 2
        const res = await request(app).get('/search?q=PageItem&limit=2&page=1');
        expect(res.status).toBe(200);
        // Should show 2 items
        const matches = (res.text.match(/PageItem/g) || []).length;
        // In the HTML, title appears once per card.
        expect(matches).toBeGreaterThanOrEqual(2); // Could be more if text repeats, but at least 2 cards.
        expect(res.text).toContain('Next');
    });
});
