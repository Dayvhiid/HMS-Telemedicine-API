// src/routes/rooms.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const { isValidRoomCode } = require('../utils/validators');

const router = express.Router();
// Get a list of all available rooms (no pagination)
router.get('/list', async (req, res) => {
    try {
        const rooms = await Room.find().sort({ createdAt: -1 });
        return res.json({ rooms });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Auto-create telemed room with code format 'telemed-XXXX'
router.post('/autocreate', async (req, res) => {
    try {
        // Generate a random 4-5 digit number and allow a few retries for uniqueness
        let roomCode;
        let attempts = 0;
        let existing = null;
        do {
            const randomNum = Math.floor(1000 + Math.random() * 90000); // 4-5 digits
            roomCode = `telemed-${randomNum}`;
            existing = await Room.findOne({ code: roomCode });
            attempts++;
        } while (existing && attempts < 5);

        if (existing) {
            return res.status(409).json({ error: 'Failed to generate a unique room code. Please try again.' });
        }

        const room = await Room.create({ code: roomCode, title: 'telemed' });
        return res.status(201).json({ room });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Create room - auto-generate a friendly code if not provided
router.post('/create', async(req, res) => {
    try {
        const { code, title, createdBy } = req.body;
        let roomCode = code;
        if (roomCode) {
            if (!isValidRoomCode(roomCode)) return res.status(400).json({ error: 'Invalid room code format.' });
            const existing = await Room.findOne({ code: roomCode });
            if (existing) return res.status(409).json({ error: 'Room code already exists.' });
        } else {
            // generate short code: use uuid v4 truncated or custom algorithm
            roomCode = `rm-${uuidv4().split('-')[0]}`;
        }

        const room = await Room.create({ code: roomCode, title: title || null, createdBy: createdBy || null });
        return res.status(201).json({ room });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Get room by code
router.get('/:code', async(req, res) => {
    try {
        const { code } = req.params;
        if (!isValidRoomCode(code)) return res.status(400).json({ error: 'Invalid room code format.' });
        const room = await Room.findOne({ code });
        if (!room) return res.status(404).json({ error: 'Room not found.' });
        return res.json({ room });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;