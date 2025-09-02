require('dotenv').config();
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const roomsRouter = require('./routes/rooms');
const messagesRouter = require('./routes/messages');
const createSocketHandlers = require('./socket');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const corsOrigin = "*";

// Basic security & parsing
app.use(helmet());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Routes without io
app.use('/api/rooms', roomsRouter);
app.use('/api/messages', messagesRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Connect DB then start server
mongoose.connect(process.env.MONGO_URI, {})
    .then(() => {
        console.log('MongoDB connected');

        // ✅ Initialize Socket.IO
        const io = new Server(server, {
            cors: { origin: corsOrigin },
            pingTimeout: 60000
        });

        createSocketHandlers(io);

        // ✅ Add upload routes after io is ready
        const uploadRoutes = require('./routes/upload')(io);
        app.use('/api/upload', uploadRoutes);

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });