const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: { type: String, require: true, unique: true },
    addr: { type: String, require: true, unique: true },
    created_at: Date,
    updated_at: Date
});

const User = mongoose.model('User', userSchema, 'user');

module.exports = User;
