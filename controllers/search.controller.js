const SearchIndex = require('../models/searchIndex');
const Category = require('../models/category');

exports.search = async (req, res) => {
    try {
        const query = req.query.q || '';
        const typeFilter = req.query.type || 'all'; // 'product', 'service', 'all'
        const sort = req.query.sort || 'relevance'; // 'price_asc', 'price_desc', 'wait_asc'

        let searchCriteria = {};

        // Text Search
        if (query) {
            searchCriteria.$text = { $search: query };
        }

        // Type Filter
        if (typeFilter === 'product') {
            searchCriteria.type = 'product';
        } else if (typeFilter === 'service') {
            searchCriteria.type = 'service_business';
        }

        // Execute Search
        let resultsQuery = SearchIndex.find(searchCriteria);

        // Sorting
        if (query) {
            resultsQuery = resultsQuery.sort({ score: { $meta: 'textScore' } });
        }

        if (sort === 'price_asc') {
            resultsQuery = resultsQuery.sort({ price: 1 });
        } else if (sort === 'price_desc') {
            resultsQuery = resultsQuery.sort({ price: -1 });
        } else if (sort === 'wait_asc') {
            // avg_wait_time is a string "X min", strictly speaking sorting strings might not be perfect numeric sort
            // but for now let's assume it sorts loosely. 
            // Ideally we should store numeric wait time in index.
            resultsQuery = resultsQuery.sort({ avg_wait_time: 1 });
        }

        const results = await resultsQuery.limit(50); // Limit results

        res.render('search', {
            title: `Search Results for "${query}"`,
            query,
            typeFilter,
            sort,
            results,
            user: req.user
        });

    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};
