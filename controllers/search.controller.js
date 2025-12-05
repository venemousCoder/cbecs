const SearchIndex = require('../models/searchIndex');
const Category = require('../models/category');
const SearchLog = require('../models/searchLog');

exports.search = async (req, res) => {
    try {
        const query = req.query.q || '';
        const typeFilter = req.query.type || 'all'; // 'product', 'service', 'all'
        const sort = req.query.sort || 'relevance'; // 'price_asc', 'price_desc', 'wait_asc'
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

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

        // Execute Search Count
        const totalResults = await SearchIndex.countDocuments(searchCriteria);
        const totalPages = Math.ceil(totalResults / limit);

        // Execute Search Query
        let resultsQuery = SearchIndex.find(searchCriteria);

        // Sorting
        if (query && sort === 'relevance') {
            resultsQuery = resultsQuery.sort({ score: { $meta: 'textScore' } });
        } else if (sort === 'price_asc') {
            resultsQuery = resultsQuery.sort({ price: 1 });
        } else if (sort === 'price_desc') {
            resultsQuery = resultsQuery.sort({ price: -1 });
        } else if (sort === 'wait_asc') {
            resultsQuery = resultsQuery.sort({ avg_wait_time: 1 });
        }

        const results = await resultsQuery.skip(skip).limit(limit);

        // Log Search Analytics (Async, non-blocking)
        if (query) {
            SearchLog.create({
                query,
                filters: { type: typeFilter, sort },
                resultCount: totalResults,
                user: req.user ? req.user._id : undefined
            }).catch(err => console.error('Search Analytics Error:', err));
        }

        res.render('search', {
            title: `Search Results for "${query}"`,
            query,
            typeFilter,
            sort,
            results,
            user: req.user,
            pagination: {
                page,
                totalPages,
                totalResults,
                limit
            }
        });

    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};
