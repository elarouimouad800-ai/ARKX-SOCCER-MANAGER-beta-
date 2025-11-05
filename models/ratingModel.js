const { readDB, writeDB } = require('../config/db');

async function findAll() {
    const db = await readDB();
    return db.ratings;
}

async function findOne(raterId, ratedPlayerId) {
    const db = await readDB();
    return db.ratings.find(r => r.raterId === raterId && r.ratedPlayerId === ratedPlayerId);
}

async function create(ratingData) {
    const db = await readDB();
    const newRating = {
        id: db.ratings.length > 0 ? Math.max(...db.ratings.map(r => r.id)) + 1 : 1,
        ...ratingData
    };
    db.ratings.push(newRating);
    await writeDB(db);
    return newRating;
}

async function update(id, score) {
    const db = await readDB();
    const ratingIndex = db.ratings.findIndex(r => r.id === id);
    if (ratingIndex === -1) {
        return null;
    }
    db.ratings[ratingIndex].score = score;
    await writeDB(db);
    return db.ratings[ratingIndex];
}

async function removeRatingsForUser(userId) {
    const db = await readDB();
    
    db.ratings = db.ratings.filter(r => r.raterId !== userId && r.ratedPlayerId !== userId);
    
    await writeDB(db);
    return true;
}

module.exports = {
    findAll,
    findOne,
    create,
    update,
    removeRatingsForUser
};

