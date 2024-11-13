const { createObjectCsvStringifier } = require('csv-writer');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const Report = require('../models/report');
const User = require('../models/user');

exports.addReport = async (req, res) => {
    const { userID, feedId, date, payout, searches, clicks } = req.body;
    const ctr = (clicks / searches) * 100;

    const report = new Report({
        userID,
        feedId,
        date,
        payout,
        searches,
        clicks,
        ctr
    });

    await report.save();
    res.redirect('/admin');
};

exports.getUserReports = async (req, res) => {
    const reports = await Report.find({ userID: req.user.id });
    res.render('dashboard', { reports });
};


// exports.downloadCSV = async (req, res) => {
//     const reports = await Report.find({ userId: req.user._id });
//     const csvWriter = createCsvWriter({
//         path: path.join(__dirname, '../public/reports.csv'),
//         header: [
//             {id: 'date', title: 'Date'},
//             {id: 'feedId', title: 'Feed ID'},
//             {id: 'payout', title: 'Payout'},
//             {id: 'searches', title: 'Searches'},
//             {id: 'clicks', title: 'Clicks'},
//             {id: 'ctr', title: 'CTR'}
//         ]
//     });

//     const records = reports.map(report => ({
//         date: report.date.toISOString().split('T')[0],
//         feedId: report.feedId,
//         payout: report.payout,
//         searches: report.searches,
//         clicks: report.clicks,
//         ctr: report.ctr
//     }));

//     await csvWriter.writeRecords(records);
//     res.download(path.join(__dirname, '../public/reports.csv'), 'reports.csv');
// };

exports.downloadCSV = async (req, res) => {
    try {
        console.log("user",req.user);
        const userID = req.user.id;
        const userReports = await Report.find({ userID });

        // Set up CSV writer
        const csvStringifier = createObjectCsvStringifier({
            header: [
            {id: 'date', title: 'Date'},
            {id: 'feedId', title: 'Feed ID'},
            {id: 'payout', title: 'Payout'},
            {id: 'searches', title: 'Searches'},
            {id: 'clicks', title: 'Clicks'},
            {id: 'ctr', title: 'CTR'}
            ]
        });

        // Format data for CSV
        const records = userReports.map(report => ({
            date: report.date.toISOString().split('T')[0],
            feedId: report.feedID,
            payout: report.payout,
            searches: report.searches,
            clicks: report.clicks,
            ctr: report.ctr
        }));

        const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="user_reports.csv"');
        res.send(csvData);
    } catch (err) {
        res.status(500).send('Error generating CSV');
    }
};
