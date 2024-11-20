const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(`mongodb+srv://shubhamadbundl:${process.env.DBPASS}@reporting-dashboard.ybrut.mongodb.net/reporting_dashboard?retryWrites=true&w=majority&appName=reporting-dashboard`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

module.exports = db;
