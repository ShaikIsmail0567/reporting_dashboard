const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const adminEmails = ['lambu@gmail.com', 'admin2@example.com'];

exports.signup = async (req, res) => {
    const { username, password, role } = req.body;
    if (role === 'admin') {
        return res.status(403).send('Admin role cannot be set on signup');
    }
    try{

        let user = new User({ username, password, role: 'user' });
        User.hashPassword();
        await user.save();
        res.redirect('/login');
    }
    catch (error) {
        res.status(500).send('Error creating user');
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    // console.log(username, password);
    const user = await User.findOne({ username });
    // console.log("user in login",user)
    
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).send('Invalid credentials');
    }
       // Check if the user should have admin access
       if (user.role === 'admin' && !adminEmails.includes(user.username)) {
        return res.status(403).send('Unauthorized access to admin');
    }
    if (user && user.comparePassword(password)) {
        // console.log("user in login",user)
        const token = jwt.sign({ id: user._id, role: user.role }, 'secretkey', { expiresIn: '1h' });
        res.cookie('token', token);
        return res.redirect(user.role === 'admin' ? '/admin' : '/user/dashboard');
    }
    res.redirect('/login');
};

exports.authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');
    // console.log("Authentication middleware called.");
    jwt.verify(token, 'secretkey', (err, decoded) => {
        if (err) return res.redirect('/login');
        req.user = decoded;
        next();
    });
};

// exports.authorize = (role) =>{
//     return (req, res, next) => {
//         if (req.user.role !== role) {
//             return res.status(403).send('Forbidden');
//         }
//         next();
//     };
// }