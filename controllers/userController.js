const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const adminEmails = ['lambu@gmail.com', 'admin2@example.com'];

// exports.signup = async (req, res) => {
//     const { username, password, role } = req.body;
//     if (role === 'admin') {
//         return res.status(403).send('Admin role cannot be set on signup');
//     }
//     try{

//         let user = new User({ username, password, role: 'user' });
//         user.hashPassword();
//         await user.save();
//         console.log("user created",user)
//         res.redirect('/login');
//     }
//     catch (error) {
//         res.status(500).send('Error creating user');
//     }
// };

exports.signup = async (req, res) => {
    const { username, password, email } = req.body;

    try {
        // Check if the email already exists
        console.log("email",email,username,password);
        const existingUser = await User.findOne({ username });
        console.log("existing",existingUser);
         if (existingUser) {
             // Render the signup page with an error message
             res.locals.errorMessage = 'User already exists';
            return res.render('signup');
            //  return res.render('signup', { errorMessage: 'User already exists' });
         }
 
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            password: hashedPassword,
            plainPassword: password, // Store plain text password
        });
        await user.save();
        res.redirect('/login');
    } catch (err) {
        res.locals.errorMessage = 'Error signing up. Please try again.';
        return res.render('signup');
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        // Check if user exists and password is correct
        if (!user || !(await user.comparePassword(password))) {
            res.locals.errorMessage = 'Invalid credentials';
            return res.render('login');
        }

        // Check if the user should have admin access
        if (user.role === 'admin' && !adminEmails.includes(user.username)) {
            res.locals.errorMessage = 'Unauthorized access to admin';
            return res.render('login');        }

        // Generate token and redirect based on role
        const token = jwt.sign({ id: user._id, role: user.role }, 'secretkey', { expiresIn: '1h' });
        res.cookie('token', token);
        return res.redirect(user.role === 'admin' ? '/admin' : '/user/dashboard');
    } catch (err) {
        res.locals.errorMessage = 'An error occurred during login. Please try again.';
        return res.render('login');
    }
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