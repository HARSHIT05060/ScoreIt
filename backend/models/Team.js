const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: {
        type: String,
        enum: ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'],
        required: true
    }
});

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    players: [playerSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Team', teamSchema);