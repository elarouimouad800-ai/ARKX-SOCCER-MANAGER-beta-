const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }
        
        req.user = payload.user;
        next();
    });
}

module.exports = { authenticateToken };

