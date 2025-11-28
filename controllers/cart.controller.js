const Listing = require('../models/listing');
const Order = require('../models/order');

// Add item to cart
exports.addToCart = async (req, res) => {
    const listingId = req.body.listingId;
    const quantity = parseInt(req.body.quantity) || 1;

    try {
        const listing = await Listing.findById(listingId).populate('business');
        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('back');
        }

        // Initialize cart if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = {
                items: [],
                totalQty: 0,
                totalPrice: 0
            };
        }

        const cart = req.session.cart;
        
        // Check if item already exists
        const existingItemIndex = cart.items.findIndex(item => item.listingId == listingId);

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].qty += quantity;
        } else {
            cart.items.push({
                listingId: listing._id,
                businessId: listing.business._id, // Save Business ID
                name: listing.name,
                price: listing.price,
                image: listing.image,
                qty: quantity,
                type: listing.type,
                businessName: listing.business ? listing.business.name : 'Unknown Business'
            });
        }

        // Update totals
        cart.totalQty += quantity;
        cart.totalPrice += listing.price * quantity;

        req.flash('success', 'Item added to cart');
        res.redirect('back');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error adding to cart');
        res.redirect('back');
    }
};

// View Cart
exports.getCart = (req, res) => {
    if (!req.session.cart) {
        return res.render('cart', { 
            title: 'Shopping Cart', 
            items: [], 
            totalPrice: 0 
        });
    }
    res.render('cart', {
        title: 'Shopping Cart',
        items: req.session.cart.items,
        totalPrice: req.session.cart.totalPrice
    });
};

// Remove item from cart
exports.removeFromCart = (req, res) => {
    const listingId = req.params.id;
    const cart = req.session.cart;

    if (!cart) return res.redirect('/cart');

    const itemIndex = cart.items.findIndex(item => item.listingId == listingId);
    
    if (itemIndex > -1) {
        const item = cart.items[itemIndex];
        cart.totalQty -= item.qty;
        cart.totalPrice -= item.price * item.qty;
        cart.items.splice(itemIndex, 1);
    }

    if (cart.items.length === 0) {
        delete req.session.cart;
    }

    res.redirect('/cart');
};

// Process Checkout
exports.postCheckout = async (req, res) => {
    if (!req.session.cart || req.session.cart.items.length === 0) {
        req.flash('error', 'Your cart is empty');
        return res.redirect('/cart');
    }

    try {
        const cart = req.session.cart;
        
        const order = new Order({
            user: req.user._id,
            items: cart.items.map(item => ({
                listing: item.listingId,
                business: item.businessId, // Using the saved businessId
                quantity: item.qty,
                price: item.price,
                name: item.name,
                status: 'pending'
            })),
            totalAmount: cart.totalPrice
        });

        await order.save();

        // Clear Cart
        delete req.session.cart;

        req.flash('success', 'Order placed successfully!');
        res.redirect('/orders'); 

    } catch (err) {
        console.error(err);
        req.flash('error', 'Error processing checkout');
        res.redirect('/cart');
    }
};