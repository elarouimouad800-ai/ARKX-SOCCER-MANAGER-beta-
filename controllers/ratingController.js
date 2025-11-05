const ratingModel = require('../models/ratingModel');

async function ratePlayer(req, res) {
    const raterId = req.user.id;
    const ratedPlayerId = parseInt(req.params.id, 10);
    const { score } = req.body;

    if (raterId === ratedPlayerId) {
        res.status(400);
        throw new Error("You cannot rate yourself");
    }
    
    const existingRating = await ratingModel.findOne(raterId, ratedPlayerId);

    let savedRating;
    if (existingRating) {
        savedRating = await ratingModel.update(existingRating.id, score);
    } else {
        savedRating = await ratingModel.create({ raterId, ratedPlayerId, score });
    }
    
    res.status(201).json(savedRating);
}

module.exports = { ratePlayer };

