const Notification = require('../models/notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 });
        
        res.render('notifications/index', {
            title: 'My Notifications',
            notifications,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.redirect('/notifications');
    } catch (err) {
        console.error(err);
        res.redirect('/notifications');
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
        res.redirect('/notifications');
    } catch (err) {
        console.error(err);
        res.redirect('/notifications');
    }
};
