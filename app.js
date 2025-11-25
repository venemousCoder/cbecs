const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// It is highly recommended to use dotenv to manage your environment variables.
// e.g. const MONGO_URI = process.env.MONGO_URI;
const MONGO_URI = 'mongodb://localhost:27017/cbecs'; // Replace with your MongoDB connection string
const SESSION_SECRET = 'your-secret-session-key'; // Replace with a strong secret

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS is a good choice for a view engine, but you can use others.
// app.set('view engine', 'ejs');
// app.use(express.static('public'));


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

// TODO: Configure Passport local strategy
// const User = require('./models/user'); // Assuming you have a User model
// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// Global variables for views
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    next();
});


// Routes
// You can move your routes to a separate 'routes' directory
app.get('/', (req, res) => {
    res.send('Welcome to CBECS!');
});


// Socket.io connection
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


// Database connection and server start
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Database connection error:', err);
});
