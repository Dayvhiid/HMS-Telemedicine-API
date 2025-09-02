// src/socket.js
const Message = require('./models/Message');
const Room = require('./models/Room');

module.exports = function(io) {
    io.on('connection', (socket) => {
        console.log('socket connected', socket.id);

        // join-room: { roomCode, displayName }
        socket.on('join-room', async(payload, ack) => {
            try {
                const { roomCode, displayName } = payload || {};
                if (!roomCode) return ack && ack({ ok: false, error: 'roomCode required' });

                // check or create room (persisted)
                let room = await Room.findOne({ code: roomCode });
                if (!room) {
                    room = await Room.create({ code: roomCode, title: null });
                }

                socket.join(roomCode);
                socket.data = { roomCode, displayName: displayName || 'anonymous' };

                // send last 50 messages to the socket (chronological)
                const lastMsgs = await Message.find({ roomCode }).sort({ createdAt: -1 }).limit(50).lean();
                ack && ack({ ok: true, recent: lastMsgs.reverse() });

                // notify others
                socket.to(roomCode).emit('user-joined', { id: socket.id, displayName: socket.data.displayName });
            } catch (err) {
                console.error('join-room error', err);
                ack && ack({ ok: false, error: 'server error' });
            }
        });

        // send-message: { roomCode, type, content, meta }
        socket.on('send-message', async(payload, ack) => {
            try {
                const { roomCode, type, content, meta, sender } = payload || {};
                if (!roomCode || !content) return ack && ack({ ok: false, error: 'roomCode & content required' });

                // persist message
                const msg = await Message.create({
                    roomCode,
                    sender: sender || (socket && socket.data && socket.data.displayName) || 'anonymous',
                    type: type || 'text',
                    content,
                    meta: meta || {}
                });

                // broadcast to room (including sender)
                io.to(roomCode).emit('new-message', {
                    id: msg._id,
                    roomCode: msg.roomCode,
                    sender: msg.sender,
                    type: msg.type,
                    content: msg.content,
                    meta: msg.meta,
                    createdAt: msg.createdAt
                });

                ack && ack({ ok: true, message: msg });
            } catch (err) {
                console.error('send-message err', err);
                ack && ack({ ok: false, error: 'server error' });
            }
        });

        // simple signaling pass-through for WebRTC (optional)
        // payload: { roomCode, toSocketId?, signalData }
        socket.on('signal', (payload) => {
            const { roomCode, to, signal } = payload || {};
            if (!roomCode) return;
            // if "to" provided, emit to specific socket; else broadcast to room
            if (to) {
                io.to(to).emit('signal', { from: socket.id, signal });
            } else {
                socket.to(roomCode).emit('signal', { from: socket.id, signal });
            }
        });

        socket.on('disconnect', (reason) => {
            try {
                const { roomCode } = socket.data || {};
                if (roomCode) {
                    socket.to(roomCode).emit('user-left', { id: socket.id });
                }
            } catch (e) {}
            console.log('socket disconnected', socket.id, reason);
        });
    });
};