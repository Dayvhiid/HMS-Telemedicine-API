// src/models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, index: true },
    sender: { type: String, default: 'anonymous' }, // doctor/patient or provided name
    type: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
    content: { type: String, required: true }, // text content or image URL
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // width/height etc
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);