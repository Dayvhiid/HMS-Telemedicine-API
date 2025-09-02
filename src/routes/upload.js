// src/routes/upload.js
// const express = require('express');
// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('cloudinary').v2;

// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // Cloudinary storage via multer-storage-cloudinary
// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: 'telemed_chat',
//         allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
//         transformation: [{ width: 1200, crop: 'limit' }]
//     }
// });

// const parser = multer({
//     storage,
//     limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
// });

// const router = express.Router();

// // POST /api/upload/image
// router.post('/image', parser.single('image'), async(req, res) => {
//     try {
//         // multer-storage-cloudinary sets req.file with .path (url) and .filename
//         if (!req.file || !req.file.path) return res.status(400).json({ error: 'No file uploaded' });

//         const url = req.file.path;
//         const meta = {
//             width: req.file.width || null,
//             height: req.file.height || null,
//             format: req.file.format || null,
//             size: req.file.size || null
//         };

//         return res.json({ url, meta });
//     } catch (err) {
//         console.error('Upload error:', err);
//         return res.status(500).json({ error: 'Upload failed' });
//     }
// });

// module.exports = router;

// src/routes/upload.js
const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'telemed_chat',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, crop: 'limit' }]
    }
});

const parser = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

module.exports = (io) => {
    const router = express.Router();

    // POST /api/upload/image
    router.post('/image', parser.single('image'), async(req, res) => {
        try {
            if (!req.file || !req.file.path)
                return res.status(400).json({ error: 'No file uploaded' });

            const url = req.file.path;
            const { room, username } = req.body; // From formData
            const meta = {
                width: req.file.width || null,
                height: req.file.height || null,
                format: req.file.format || null,
                size: req.file.size || null
            };

            // Emit message to room
            if (room) {
                io.to(room).emit('new-message', {
                    sender: username || 'anonymous',
                    type: 'image',
                    content: url,
                    meta
                });
            }

            return res.json({ url, meta });
        } catch (err) {
            console.error('Upload error:', err);
            return res.status(500).json({ error: 'Upload failed' });
        }
    });

    return router;
};