const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const http = require('http');
const { Server } = require("socket.io");
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// It is highly recommended to use dotenv to manage your environment variables.
// e.g. const MONGO_URI = process.env.MONGO_URI;
const MONGO_URI = process.env.NODE_ENV === 'production' ? process.env.MONGO_URI : 'mongodb://127.0.0.1:27017/cbecs'; // Replace with your MongoDB connection string
const SESSION_SECRET = process.env.SESSION_SECRET;

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View engine setup
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));


// Session middleware
const sessionMiddleware = session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI })
});
app.use(sessionMiddleware);

// Flash middleware
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport Config
require('./config/passport')(passport);

const Category = require('./models/category');

// Global variables for views
app.use(async (req, res, next) => {
    try {
        const allCategories = await Category.find();
        res.locals.allCategories = allCategories;
    } catch (err) {
        console.error("Error fetching global categories:", err);
        res.locals.allCategories = [];
    }
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    res.locals.cart = req.session.cart;
    console.log("LOCALS: ",res.locals);
    next();
});


// Routes settings
const indexRouter = require('./routes/index.routes');
const serviceRouter = require('./routes/service.routes');
app.use('/', indexRouter);
app.use('/service', serviceRouter);


// Socket.io connection
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


// Database connection and server start
mongoose.connect(MONGO_URI).then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Database connection error:', err);
});
