const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('./config/db');
const User = require('./models/user');
const Report = require('./models/report');
const userController = require('./controllers/userController');
const adminController = require('./controllers/adminController');
const path = require('path');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to set `res.locals.user` for views
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// Routes
app.get('/signup', (req, res) => res.render('signup'));
app.post('/signup', userController.signup);

app.get('/login', (req, res) => res.render('login'));
app.post('/login', userController.login);

// Redirect root route to login page
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Admin Dashboard Route
app.get('/admin', userController.authenticate, async (req, res) => {
    if (req.user.role !== 'admin') return res.redirect('/dashboard');

    try {
        // Fetch all users to populate the dropdown
        const users = await User.find({}, { _id: 1, username: 1, email: 1 });
        console.log("usersin the /admin route", users)
        res.render('admin', { users });
    } catch (err) {
        res.status(500).send('Error loading admin page');
    }
});

// Admin Entry Submission Route
app.post('/admin/entry', userController.authenticate, async (req, res) => {
    if (req.user.role !== 'admin') return res.redirect('/dashboard');

    const { userID, date, feedID, payout, searches, clicks } = req.body;
    const ctr = (clicks / searches) * 100; // Calculate CTR

    try {
        const targetUser = await User.findById(userID);
        if (!targetUser) {
            return res.status(400).send('Invalid user ID');
        }
        const reportEntry = new Report({
            userID,
            date,
            feedID,
            payout,
            searches,
            clicks,
            ctr
        });
        await reportEntry.save();
        res.redirect('/admin');
    } catch (err) {
        res.status(500).send('Error saving entry');
    }
});

// Route to Get All Users as JSON for Admin
app.get('/admin/users', userController.authenticate, async (req, res) => {
    if (req.user.role !== 'admin') return res.redirect('/dashboard');

    try {
        const users = await User.find({}, { _id: 1, username: 1, email: 1 });
        res.json(users);
    } catch (err) {
        res.status(500).send('Error fetching users');
    }
});

// Route for Admin to Add a Report (Alternative)
app.post('/admin/add-report', userController.authenticate, adminController.addReport);

// User Dashboard Route (User-Specific Reports)
app.get('/dashboard', userController.authenticate, async (req, res) => {
    try {
        // console.log("user", req.user)
        const userID = req.user.id;  // Get logged-in user's ID
        const userReports = await Report.find({ userID });
        // console.log("userReports", userReports)
        res.render('user_dashboard', { reports: userReports });
    } catch (err) {
        res.status(500).send('Error loading user dashboard');
    }
});

app.get('/user/dashboard',userController.authenticate,async (req, res) => {
    try {
        // console.log('Authenticated user:', req.user);
        const userID = req.user.id; // Get the user's ID
        const username = req.user.username; // Get the user's username
        
        // // Find reports related to this user only
        // const userReports = await Report.find({ userID });
        // console.log("userId",userID,username);
        const filters = {userID};

        // Apply filters based on query parameters
        if (req.query.feedID) filters.feedID = req.query.feedID;
        if (req.query.dateFrom || req.query.dateTo) {
            filters.date = {};
            if (req.query.dateFrom) filters.date.$gte = new Date(req.query.dateFrom);
            if (req.query.dateTo) filters.date.$lte = new Date(req.query.dateTo);
        }

        // Add userID filter to only get the logged-in user's reports
        filters.userID = userID;
        const userReports = await Report.find(filters);
        // console.log("userReports",userReports)
        // console.log("user dashboard",{
        //     username,
        //     reports: userReports,
        //     feedID: req.query.feedID || '',
        //     dateFrom: req.query.dateFrom || '',
        //     dateTo: req.query.dateTo || ''
        // });
        res.render('user_dashboard', {
            username,
            reports: userReports,
            feedID: req.query.feedID || '',   // Ensure `feedID` has a default value
            dateFrom: req.query.dateFrom || '', // Ensure `dateFrom` has a default value
            dateTo: req.query.dateTo || ''    // Ensure `dateTo` has a default value
        });
    } catch (err) {
        res.status(500).send('Error loading user dashboard');
    }
});


// CSV Download Route for User-Specific Reports
app.get('/dashboard/download-csv', userController.authenticate, adminController.downloadCSV);

// Logout Route
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
