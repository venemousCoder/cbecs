const mongoose = require('mongoose');
const Category = require('../models/category');

const MONGO_URI = 'mongodb://127.0.0.1:27017/cbecs';

const categories = [
    // Retail
    { name: "Supermarket", icon: "fa-shopping-basket", type: "retail", description: "Groceries and daily essentials" },
    { name: "Phones & Tablets", icon: "fa-mobile-alt", type: "retail", description: "Smartphones, tablets, and accessories" },
    { name: "Fashion", icon: "fa-tshirt", type: "retail", description: "Clothing, shoes, and jewelry for all" },
    { name: "Electronics", icon: "fa-tv", type: "retail", description: "TVs, audio, and home entertainment" },
    { name: "Home & Office", icon: "fa-couch", type: "retail", description: "Furniture, decor, and office supplies" },
    { name: "Computing", icon: "fa-laptop", type: "retail", description: "Laptops, desktops, and peripherals" },
    { name: "Automobile Parts", icon: "fa-car-battery", type: "retail", description: "Car accessories and spare parts" },
    { name: "Health & Beauty", icon: "fa-medkit", type: "retail", description: "Skincare, makeup, and personal care products" },
    { name: "Baby Products", icon: "fa-baby", type: "retail", description: "Diapers, toys, and baby gear" },
    { name: "Gaming", icon: "fa-gamepad", type: "retail", description: "Consoles, games, and accessories" },
    { name: "Sporting Goods", icon: "fa-futbol", type: "retail", description: "Equipment for sports and fitness" },
    
    // Services
    { name: "Beauty & Salons", icon: "fa-cut", type: "service", description: "Haircuts, styling, and spa services" },
    { name: "Repairs & Mechanics", icon: "fa-tools", type: "service", description: "Auto repair, electronics fix, and maintenance" },
    { name: "Laundry & Cleaning", icon: "fa-soap", type: "service", description: "Dry cleaning and home cleaning services" },
    { name: "Logistics & Moving", icon: "fa-truck", type: "service", description: "Delivery, moving, and transportation" },
    { name: "Home Maintenance", icon: "fa-hammer", type: "service", description: "Plumbing, electrical, and carpentry" },
    { name: "Photography", icon: "fa-camera", type: "service", description: "Event photography and photoshoots" },
    { name: "Tutoring & Education", icon: "fa-chalkboard-teacher", type: "service", description: "Private lessons and skill acquisition" },

    // Food
    { name: "Restaurants", icon: "fa-utensils", type: "food", description: "Dine-in and takeout meals" },
    { name: "Cafés & Bakeries", icon: "fa-coffee", type: "food", description: "Coffee, pastries, and snacks" },
    { name: "Fast Food", icon: "fa-hamburger", type: "food", description: "Quick bites and burgers" },
    { name: "Local Kitchens", icon: "fa-pepper-hot", type: "food", description: "Traditional homemade meals" }
];

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to DB for Seeding...');
        
        for (const cat of categories) {
            // Simple slug generation
            const slug = cat.name.toLowerCase()
                .replace(/&/g, 'and')
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '');

            await Category.findOneAndUpdate(
                { slug: slug },
                { ...cat, slug: slug },
                { upsert: true, new: true }
            );
            console.log(`Processed: ${cat.name} [${slug}]`);
        }
        
        console.log('Category seeding completed successfully!');
        mongoose.connection.close();
        process.exit(0);
    })
    .catch(err => {
        console.error('Error seeding categories:', err);
        mongoose.connection.close();
        process.exit(1);
    });
