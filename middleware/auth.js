module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error', 'Please log in to view that resource');
        req.session.returnTo = req.originalUrl; // Store requested URL for redirect after login
        res.redirect('/login');
    },
    
    ensureRole: function(role) {
        return function(req, res, next) {
            if (req.isAuthenticated() && req.user.role === role) {
                return next();
            }
            req.flash('error', 'You do not have permission to view that resource');
            res.redirect('/'); // Or some error page
        }
    },

    // Allow multiple allowed roles
    ensureRoles: function(roles) {
        return function(req, res, next) {
            if (req.isAuthenticated() && roles.includes(req.user.role)) {
                return next();
            }
            req.flash('error', 'You do not have permission to view that resource');
            res.redirect('/');
        }
    },
    
    forwardAuthenticated: function(req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        }
        // If already logged in, redirect based on role
        const role = req.user.role;
        if (role === 'admin') return res.redirect('/admin/dashboard');
        if (role === 'sme_owner') return res.redirect('/sme/dashboard');
        if (role === 'operator') return res.redirect('/operator/dashboard');
        return res.redirect('/');
    }
};
