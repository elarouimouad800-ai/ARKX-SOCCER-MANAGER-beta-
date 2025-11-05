const playerModel = require('../models/playerModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

async function register(req, res) {
    const { username } = req.body;
    
    const existingUser = await playerModel.findByUsername(username);
    if (existingUser) {
        res.status(400);
        throw new Error("Username already exists");
    }

    const newUser = await playerModel.create(req.body);
    const { password, ...userToSend } = newUser;
    res.status(201).json(userToSend);
}

async function login(req, res) {
    const { username, password } = req.body;
    
    const user = await playerModel.findByUsername(username);
    if (!user) {
        res.status(400);
        throw new Error("Invalid username or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        res.status(400);
        throw new Error("Invalid username or password");
    }

    const payload = {
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
        if (err) throw err;
        
        const { password, ...userToSend } = user;
        res.json({ token, user: userToSend });
    });
}

module.exports = { register, login };

