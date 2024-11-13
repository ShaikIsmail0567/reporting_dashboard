const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    feedID: { type: String, required: true },
    date: Date,
    payout: Number,
    searches: Number,
    clicks: Number,
    ctr: Number  // Calculated as (clicks/searches) * 100
});

module.exports = mongoose.model('Report', reportSchema);
