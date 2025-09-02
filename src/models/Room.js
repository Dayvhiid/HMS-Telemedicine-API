// src/models/Room.js
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: null },
    createdBy: { type: String, default: null }, // optional, e.g., doctor's id/email
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', RoomSchema);