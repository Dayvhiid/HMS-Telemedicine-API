// src/routes/messages.js
const express = require('express');
const Message = require('../models/Message');
const { isValidRoomCode } = require('../utils/validators');

const router = express.Router();

// GET /api/messages/:roomCode?page=1&limit=50
router.get('/:roomCode', async(req, res) => {
    try {
        const { roomCode } = req.params;
        if (!isValidRoomCode(roomCode)) return res.status(400).json({ error: 'Invalid room code.' });

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 50);
        const skip = (page - 1) * limit;

        const total = await Message.countDocuments({ roomCode });
        const items = await Message.find({ roomCode })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return res.json({ meta: { total, page, limit }, data: items.reverse() }); // reverse to chronological
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;