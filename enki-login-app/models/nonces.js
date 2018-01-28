const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const nonceSchema = new Schema({
    serverNonce: { type: String, require: true, unique: true },
    serverEpoch: { type: String, require: true }
});

const Nonce = mongoose.model('Nonce', nonceSchema, 'nonce');

module.exports = Nonce;
