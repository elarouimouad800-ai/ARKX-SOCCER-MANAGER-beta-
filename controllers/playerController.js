const playerModel = require('../models/playerModel');
const ratingModel = require('../models/ratingModel');

function calculateAverageRating(playerId, ratings) {
    const playerRatings = ratings.filter(r => r.ratedPlayerId === playerId);
    if (playerRatings.length === 0) return 0;
    const sum = playerRatings.reduce((acc, r) => acc + r.score, 0);
    return parseFloat((sum / playerRatings.length).toFixed(1));
}

async function getAllPlayers(req, res) {
    const users = await playerModel.find();
    const ratings = await ratingModel.findAll();

    const playersList = users.map(user => {
        const { password, ...playerData } = user;
        const avgRating = calculateAverageRating(user.id, ratings);
        return { ...playerData, avgRating };
    });
    
    res.json(playersList);
}

async function getMyProfile(req, res) {
    const user = await playerModel.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    const { password, ...userToSend } = user;
    res.json(userToSend);
}

async function updateMyProfile(req, res) {
    const loggedInUserId = req.user.id;
    const updatedUser = await playerModel.update(loggedInUserId, req.body);
    if (!updatedUser) {
        res.status(404);
        throw new Error("User not found");
    }
    const { password, ...userToSend } = updatedUser;
    res.json(userToSend);
}

async function deleteMyProfile(req, res) {
    const loggedInUserId = req.user.id;
    const deleted = await playerModel.remove(loggedInUserId);
    if (!deleted) {
        res.status(404);
        throw new Error("User not found");
    }
    await ratingModel.removeRatingsForUser(loggedInUserId);
    res.status(200).json({ message: "User deleted successfully" });
}

async function updateUser(req, res) {
    const playerId = parseInt(req.params.id, 10);
    const updatedUser = await playerModel.update(playerId, req.body);
    if (!updatedUser) {
        res.status(404);
        throw new Error("User not found");
    }
    const { password, ...userToSend } = updatedUser;
    res.json(userToSend);
}

async function deleteUser(req, res) {
    const playerId = parseInt(req.params.id, 10);
    const deleted = await playerModel.remove(playerId);
    if (!deleted) {
        res.status(404);
        throw new Error("User not found");
    }
    await ratingModel.removeRatingsForUser(playerId);
    res.status(200).json({ message: "User deleted successfully" });
}

module.exports = {
    getAllPlayers,
    getMyProfile,
    updateMyProfile,
    deleteMyProfile,
    updateUser,
    deleteUser
};

