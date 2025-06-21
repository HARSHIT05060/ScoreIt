// /backend/models/Innings.js

const mongoose = require('mongoose');

const inningsSchema = new mongoose.Schema({
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true
    },
    battingTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    bowlingTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    totalRuns: {
        type: Number,
        default: 0
    },
    totalWickets: {
        type: Number,
        default: 0
    },
    totalBalls: {
        type: Number,
        default: 0
    },
    oversLimit: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Innings', inningsSchema);
