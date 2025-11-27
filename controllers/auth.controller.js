const passport = require('passport');
const User = require('../models/user');

// Handle Registration
exports.registerUser = async (req, res) => {
    const { name, email, password, confirmPassword, phone, role } = req.body;
    let errors = [];

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
        errors.push({ msg: 'Please enter all required fields' });
    }

    if (password !== confirmPassword) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        // Determine which view to render based on the attempted role or referer
        const view = role === 'sme_owner' ? 'signup-business' : 'signup';
        return res.render(view, {
            errors,
            name,
            email,
            phone,
            password,
            confirmPassword
        });
    }

    try {
        // Check if user exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            errors.push({ msg: 'Email is already registered' });
            const view = role === 'sme_owner' ? 'signup-business' : 'signup';
            return res.render(view, {
                errors,
                name,
                email,
                phone,
                password,
                confirmPassword
            });
        }

        // Create new user
        const newUser = new User({
            name,
            email,
            password,
            phone,
            role: role || 'consumer' // Default to consumer if not specified
        });

        // Save user (hashing handled by pre-save hook)
        await newUser.save();

        req.flash('success', 'You are now registered and can log in');
        res.redirect('/login');

    } catch (err) {
        console.error(err);
        errors.push({ msg: 'Server error during registration' });
        res.render('signup', {
            errors,
            name,
            email,
            password,
            confirmPassword
        });
    }
};

// Handle Login
exports.loginUser = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) {
            req.flash('error', info.message || 'Login failed');
            return res.redirect('/login');
        }
        
        req.logIn(user, (err) => {
            if (err) { return next(err); }
            
            // Role-based redirect
            const targetUrl = req.session.returnTo || getRedirectUrlByRole(user.role);
            delete req.session.returnTo;
            
            return res.redirect(targetUrl);
        });
    })(req, res, next);
};

// Handle Logout
exports.logoutUser = (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.flash('success', 'You are logged out');
        res.redirect('/login');
    });
};

// Helper for Redirects
function getRedirectUrlByRole(role) {
    switch (role) {
        case 'admin':
            return '/admin/dashboard';
        case 'sme_owner':
            return '/sme/dashboard';
        case 'operator':
            return '/operator/dashboard';
        case 'consumer':
        default:
            return '/'; // Home page for consumers
    }
}
