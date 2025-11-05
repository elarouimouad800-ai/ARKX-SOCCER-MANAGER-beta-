const { readDB, writeDB } = require('../config/db');
const bcrypt = require('bcryptjs');

async function find() {
    const db = await readDB();
    return db.users;
}

async function findById(id) {
    const db = await readDB();
    return db.users.find(user => user.id === id);
}

async function findByUsername(username) {
    const db = await readDB();
    return db.users.find(user => user.username === username);
}

async function create(userData) {
    const db = await readDB();
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const newUser = {
        id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
        username: userData.username,
        password: hashedPassword,
        player: userData.player,
        height: parseFloat(userData.height),
        matches: 0,
        goals: 0,
        minPlayed: 0,
        position: userData.position,
        preferredFoot: userData.preferredFoot,
        profilePicUrl: userData.profilePicUrl || null,
        status: "Ready",
        role: "player"
    };
    
    db.users.push(newUser);
    await writeDB(db);
    return newUser;
}

async function update(id, updateData) {
    const db = await readDB();
    const userIndex = db.users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
        return null;
    }

    const updatedUser = { ...db.users[userIndex], ...updateData };
    
    if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updatedUser.password = await bcrypt.hash(updateData.password, salt);
    }
    
    if (updateData.height) {
        updatedUser.height = parseFloat(updateData.height);
    }

    db.users[userIndex] = updatedUser;
    await writeDB(db);
    return updatedUser;
}

async function remove(id) {
    const db = await readDB();
    const userIndex = db.users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
        return false;
    }
    
    db.users.splice(userIndex, 1);
    await writeDB(db);
    return true;
}

module.exports = {
    find,
    findById,
    findByUsername,
    create,
    update,
    remove
};

