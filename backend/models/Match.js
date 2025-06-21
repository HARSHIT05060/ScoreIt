const mongoose = require('mongoose');

// Ball by ball schema
const ballSchema = new mongoose.Schema({
    over: { type: Number, required: true },
    ball: { type: Number, required: true },
    runs: { type: Number, default: 0 },
    isWicket: { type: Boolean, default: false },
    isExtra: { type: Boolean, default: false },
    extraType: { type: String, enum: ['Wide', 'No Ball', 'Bye', 'Leg Bye', 'Penalty'] },
    wicketType: { type: String, enum: ['Bowled', 'Caught', 'LBW', 'Stumped', 'Run Out', 'Hit Wicket'] },
    batsman: { type: String },
    bowler: { type: String },
    fielder: { type: String }, // For catches, run outs, etc.
    timestamp: { type: Date, default: Date.now }
});

// Innings schema
const inningsSchema = new mongoose.Schema({
    innings: { type: Number, required: true }, // 1 or 2
    battingTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    bowlingTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    totalRuns: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    totalOvers: { type: Number, default: 0 },
    totalBalls: { type: Number, default: 0 },
    currentStriker: { type: String, default: '' },
    currentNonStriker: { type: String, default: '' },
    currentBowler: { type: String, default: '' },
    isCompleted: { type: Boolean, default: false },
    balls: [ballSchema],
    extras: {
        wides: { type: Number, default: 0 },
        noBalls: { type: Number, default: 0 },
        byes: { type: Number, default: 0 },
        legByes: { type: Number, default: 0 },
        penalties: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    }
});

const matchSchema = new mongoose.Schema({
    matchName: {
        type: String,
        required: true,
        trim: true
    },
    matchType: {
        type: String,
        enum: ['T10', 'T20', 'ODI'],
        required: true
    },
    location: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    overs: {
        type: Number,
        required: true,
        min: 1,
        max: 50
    },

    teamA: {
        name: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true
        },
        players: [{
            type: String,
            required: true,
            trim: true
        }]
    },
    teamB: {
        name: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true
        },
        players: [{
            type: String,
            required: true,
            trim: true
        }]
    },

    tossWinner: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true
    },
    tossDecision: {
        type: String,
        enum: ['Bat', 'Bowl'],
        required: true
    },
    umpire: {
        name: String,
        contact: String
    },

    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },

    // Live scoring data
    currentInnings: {
        type: Number,
        default: 1,
        min: 1,
        max: 2
    },

    // Detailed innings data
    innings: [inningsSchema],

    // Match statistics (legacy - keeping for backward compatibility)
    matchStats: {
        teamAScore: {
            runs: { type: Number, default: 0 },
            wickets: { type: Number, default: 0 },
            overs: { type: Number, default: 0 }
        },
        teamBScore: {
            runs: { type: Number, default: 0 },
            wickets: { type: Number, default: 0 },
            overs: { type: Number, default: 0 }
        },
        winner: String,
        result: String,
        winMargin: String,
        playerOfTheMatch: String
    },

    // Additional match metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    startTime: Date,
    endTime: Date,

    // For live updates
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance
matchSchema.index({ date: 1, status: 1 });
matchSchema.index({ createdBy: 1 });
matchSchema.index({ status: 1, lastUpdated: -1 }); // For live matches

// Middleware to update lastUpdated on save
matchSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    next();
});

// Methods for easier data manipulation
matchSchema.methods.getCurrentInnings = function () {
    return this.innings.find(inning => inning.innings === this.currentInnings);
};

matchSchema.methods.addBall = function (ballData) {
    const currentInnings = this.getCurrentInnings();
    if (!currentInnings) {
        throw new Error('Current innings not found');
    }

    currentInnings.balls.push(ballData);
    currentInnings.totalBalls++;

    // Update runs and wickets
    currentInnings.totalRuns += ballData.runs || 0;
    if (ballData.isWicket) {
        currentInnings.totalWickets++;
    }

    // Update extras
    if (ballData.isExtra && ballData.extraType) {
        switch (ballData.extraType) {
            case 'Wide':
                currentInnings.extras.wides++;
                break;
            case 'No Ball':
                currentInnings.extras.noBalls++;
                break;
            case 'Bye':
                currentInnings.extras.byes++;
                break;
            case 'Leg Bye':
                currentInnings.extras.legByes++;
                break;
            case 'Penalty':
                currentInnings.extras.penalties++;
                break;
        }
        currentInnings.extras.total++;
    }

    // Update overs (6 valid balls = 1 over)
    const validBalls = currentInnings.balls.filter(ball =>
        !ball.isExtra || (ball.extraType === 'Bye' || ball.extraType === 'Leg Bye')
    ).length;
    currentInnings.totalOvers = Math.floor(validBalls / 6) + (validBalls % 6) / 10;

    return this.save();
};

matchSchema.methods.initializeInnings = function (inningsNumber) {
    const battingTeam = this.getBattingTeam(inningsNumber);
    const bowlingTeam = this.getBowlingTeam(inningsNumber);

    const newInnings = {
        innings: inningsNumber,
        battingTeam: battingTeam,
        bowlingTeam: bowlingTeam,
        totalRuns: 0,
        totalWickets: 0,
        totalOvers: 0,
        totalBalls: 0,
        currentStriker: '',
        currentNonStriker: '',
        currentBowler: '',
        isCompleted: false,
        balls: [],
        extras: {
            wides: 0,
            noBalls: 0,
            byes: 0,
            legByes: 0,
            penalties: 0,
            total: 0
        }
    };

    this.innings.push(newInnings);
    return this.save();
};

matchSchema.methods.getBattingTeam = function (inningsNumber) {
    const tossWinnerId = this.tossWinner;
    const teamAId = this.teamA.name;
    const teamBId = this.teamB.name;

    const isTeamATossWinner = tossWinnerId.equals(teamAId);

    if (inningsNumber === 1) {
        return isTeamATossWinner
            ? (this.tossDecision === 'Bat' ? teamAId : teamBId)
            : (this.tossDecision === 'Bat' ? teamBId : teamAId);
    } else {
        return isTeamATossWinner
            ? (this.tossDecision === 'Bat' ? teamBId : teamAId)
            : (this.tossDecision === 'Bat' ? teamAId : teamBId);
    }
};

matchSchema.methods.getBowlingTeam = function (inningsNumber) {
    const battingTeam = this.getBattingTeam(inningsNumber);
    const teamAId = this.teamA.name;
    const teamBId = this.teamB.name;

    return battingTeam.equals(teamAId) ? teamBId : teamAId;
};

module.exports = mongoose.model('Match', matchSchema);