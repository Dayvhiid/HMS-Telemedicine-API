// src/utils/validators.js
const roomCodeRegex = /^[a-zA-Z0-9\-_]{6,40}$/;

function isValidRoomCode(code) {
    if (!code || typeof code !== 'string') return false;
    return roomCodeRegex.test(code);
}

module.exports = { isValidRoomCode };