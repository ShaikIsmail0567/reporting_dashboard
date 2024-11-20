const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true,unique: true },
    password: { type: String, required: true }, // Hashed password
    plainPassword: { type: String, required: true }, // Plain text password
    role: { type: String, default: 'user' }
});


userSchema.methods.hashPassword = function() {
    this.password = bcrypt.hashSync(this.password, 10);
};

userSchema.methods.comparePassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
