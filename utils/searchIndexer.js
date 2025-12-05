const SearchIndex = require('../models/searchIndex');
const Business = require('../models/business');
const Listing = require('../models/listing');

// Helper: Upsert Listing into Search Index
exports.indexListing = async (listingId) => {
    try {
        const listing = await Listing.findById(listingId).populate('business');
        if (!listing) return;

        if (listing.type !== 'product' && listing.type !== 'food') return; // Only index products here? Or services too? 
        // Plan says: "Product created/updated -> index as product document"
        // Service businesses are indexed separately.
        
        await SearchIndex.findOneAndUpdate(
            { referenceId: listing._id, type: 'product' },
            {
                type: 'product',
                referenceId: listing._id,
                title: listing.name,
                description: listing.description,
                category: listing.category ? listing.category.toString() : 'Uncategorized', // Ideally fetch category name
                price: listing.price,
                business_id: listing.business._id,
                business_name: listing.business.name,
                business_type: listing.business.business_type,
                image: listing.image,
                updatedAt: new Date()
            },
            { upsert: true }
        );
    } catch (err) {
        console.error('Error indexing listing:', err);
    }
};

// Helper: Remove Listing from Index
exports.removeListingFromIndex = async (listingId) => {
    try {
        await SearchIndex.deleteOne({ referenceId: listingId, type: 'product' });
    } catch (err) {
        console.error('Error removing listing from index:', err);
    }
};

// Helper: Upsert Service Business into Search Index
exports.indexServiceBusiness = async (businessId) => {
    try {
        const business = await Business.findById(businessId).populate('operators');
        if (!business) return;
        
        // Only index if service or hybrid
        if (business.business_type === 'retail') {
             // Ensure it's NOT in the service index
             await SearchIndex.deleteOne({ referenceId: business._id, type: 'service_business' });
             return;
        }

        // Calculate aggregate stats
        const operatorCount = business.operators ? business.operators.length : 0;
        // Avg wait time logic could be complex, for now use placeholder or aggregate from User.queueLength * 15
        let totalWait = 0;
        if (business.operators) {
            business.operators.forEach(op => {
                 totalWait += (op.queueLength || 0) * 15;
            });
        }
        const avgWait = operatorCount > 0 ? Math.round(totalWait / operatorCount) + " min" : "0 min";

        // Fetch services from ServiceScript or Tags?
        // Task 6.2.3 says: "Service script updated -> extract service keywords"
        // We will implement a separate function for script updates which calls this or updates directly.
        // For now, we can default to empty array if script not passed, OR query it here.
        // Let's query it here to be robust.
        const ServiceScript = require('../models/serviceScript');
        const script = await ServiceScript.findOne({ business: business._id });
        let servicesOffered = [];
        
        if (script && script.steps) {
             // Extract keywords from options
             // Logic: Iterate steps, find options, add labels.
             script.steps.forEach(step => {
                 if (step.options) {
                     step.options.forEach(opt => servicesOffered.push(opt.label));
                 }
             });
        }
        // Dedup
        servicesOffered = [...new Set(servicesOffered)];

        await SearchIndex.findOneAndUpdate(
            { referenceId: business._id, type: 'service_business' },
            {
                type: 'service_business',
                referenceId: business._id,
                title: business.name,
                description: business.description,
                category: business.category, // 'service' or 'food' usually, or specific subcat if schema changed
                services_offered: servicesOffered,
                operator_count: operatorCount,
                avg_wait_time: avgWait,
                business_type: business.business_type,
                image: business.logo,
                updatedAt: new Date()
            },
            { upsert: true }
        );

    } catch (err) {
        console.error('Error indexing business:', err);
    }
};
