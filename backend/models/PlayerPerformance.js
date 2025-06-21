// models/PlayerPerformance.js
const mongoose = require('mongoose');

// Batting Performance Schema
const battingPerformanceSchema = new mongoose.Schema({
    runsScored: { type: Number, default: 0, min: 0 },
    ballsFaced: { type: Number, default: 0, min: 0 },
    fours: { type: Number, default: 0, min: 0 },
    sixes: { type: Number, default: 0, min: 0 },
    strikeRate: { type: Number, default: 0, min: 0 },
    isOut: { type: Boolean, default: false },
    howOut: {
        type: String,
        enum: ['Bowled', 'Caught', 'LBW', 'Stumped', 'Run Out', 'Hit Wicket', 'Not Out'],
        default: 'Not Out'
    },
    bowlerWhoGotOut: { type: String, default: '' },
    fielderWhoGotOut: { type: String, default: '' },
    partnershipRuns: { type: Number, default: 0 },
    dotBalls: { type: Number, default: 0 },
    singles: { type: Number, default: 0 },
    doubles: { type: Number, default: 0 },
    triples: { type: Number, default: 0 }
});

// Bowling Performance Schema  
const bowlingPerformanceSchema = new mongoose.Schema({
    oversBowled: { type: Number, default: 0, min: 0 },
    ballsBowled: { type: Number, default: 0, min: 0 },
    runsConceded: { type: Number, default: 0, min: 0 },
    wicketsTaken: { type: Number, default: 0, min: 0 },
    maidenOvers: { type: Number, default: 0, min: 0 },
    economy: { type: Number, default: 0, min: 0 },
    dotBallsBowled: { type: Number, default: 0, min: 0 },
    wides: { type: Number, default: 0, min: 0 },
    noBalls: { type: Number, default: 0, min: 0 },
    foursConceded: { type: Number, default: 0, min: 0 },
    sixesConceded: { type: Number, default: 0, min: 0 },
    wicketsDetail: [{
        batsmanOut: { type: String, required: true },
        howOut: {
            type: String,
            enum: ['Bowled', 'Caught', 'LBW', 'Stumped'],
            required: true
        },
        fielder: { type: String, default: '' },
        overNumber: { type: Number, required: true },
        ballNumber: { type: Number, required: true }
    }]
});

// Fielding Performance Schema
const fieldingPerformanceSchema = new mongoose.Schema({
    catches: { type: Number, default: 0, min: 0 },
    runOuts: { type: Number, default: 0, min: 0 },
    stumpings: { type: Number, default: 0, min: 0 }, // For wicket keepers
    droppedCatches: { type: Number, default: 0, min: 0 },
    fieldsmanOfChoice: { type: Boolean, default: false },
    directHits: { type: Number, default: 0, min: 0 },
    missedRunOutChances: { type: Number, default: 0, min: 0 }
});

// Main Player Performance Schema
const playerPerformanceSchema = new mongoose.Schema({
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true
    },
    playerName: {
        type: String,
        required: true,
        trim: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },

    // Player Role
    role: {
        type: String,
        enum: ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'],
        required: true
    },

    // Performance Data
    batting: battingPerformanceSchema,
    bowling: bowlingPerformanceSchema,
    fielding: fieldingPerformanceSchema,

    // Match Participation
    playedInning1: { type: Boolean, default: false },
    playedInning2: { type: Boolean, default: false },
    battingPosition: { type: Number, min: 1, max: 11 },

    // Overall Performance Rating
    performanceRating: { type: Number, default: 0, min: 0, max: 10 },

    // Man of the Match
    isManOfTheMatch: { type: Boolean, default: false },

    // Additional Stats
    impactMoments: [{
        moment: { type: String, required: true },
        description: { type: String, required: true },
        overNumber: { type: Number },
        ballNumber: { type: Number },
        impact: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' }
    }],

    // Performance Notes
    performanceNotes: { type: String, maxlength: 500 }

}, {
    timestamps: true
});

// Indexes for better performance
playerPerformanceSchema.index({ matchId: 1, playerName: 1 });
playerPerformanceSchema.index({ playerName: 1, createdAt: -1 });
playerPerformanceSchema.index({ matchId: 1 });
playerPerformanceSchema.index({ isManOfTheMatch: 1 });
playerPerformanceSchema.index({ teamId: 1 });

// Virtual fields for calculated stats
playerPerformanceSchema.virtual('battingAverage').get(function () {
    if (!this.batting.isOut || this.batting.runsScored === 0) return this.batting.runsScored;
    return this.batting.runsScored; // In a single match, average = runs scored
});

playerPerformanceSchema.virtual('bowlingAverage').get(function () {
    if (this.bowling.wicketsTaken === 0) return 0;
    return (this.bowling.runsConceded / this.bowling.wicketsTaken).toFixed(2);
});

playerPerformanceSchema.virtual('bowlingStrikeRate').get(function () {
    if (this.bowling.wicketsTaken === 0) return 0;
    return (this.bowling.ballsBowled / this.bowling.wicketsTaken).toFixed(1);
});

// Method to calculate performance rating
playerPerformanceSchema.methods.calculatePerformanceRating = function () {
    let rating = 5.0; // Base rating

    // Batting contribution
    if (this.batting) {
        const runs = this.batting.runsScored;
        const strikeRate = this.batting.strikeRate;

        // Runs contribution
        if (runs >= 50) rating += 2.5;
        else if (runs >= 30) rating += 1.5;
        else if (runs >= 20) rating += 1.0;
        else if (runs >= 10) rating += 0.5;

        // Strike rate bonus (for T20/T10)
        if (strikeRate >= 150) rating += 1.0;
        else if (strikeRate >= 120) rating += 0.5;
        else if (strikeRate < 80 && runs < 20) rating -= 0.5;

        // Boundary bonus
        rating += (this.batting.sixes * 0.2);
        rating += (this.batting.fours * 0.1);
    }

    // Bowling contribution
    if (this.bowling && this.bowling.ballsBowled > 0) {
        const wickets = this.bowling.wicketsTaken;
        const economy = this.bowling.economy;

        // Wickets bonus
        if (wickets >= 3) rating += 2.0;
        else if (wickets >= 2) rating += 1.5;
        else if (wickets >= 1) rating += 1.0;

        // Economy rate (T20 context)
        if (economy <= 6) rating += 1.0;
        else if (economy <= 8) rating += 0.5;
        else if (economy > 12) rating -= 1.0;

        // Maiden overs bonus
        rating += (this.bowling.maidenOvers * 0.5);
    }

    // Fielding contribution
    if (this.fielding) {
        rating += (this.fielding.catches * 0.5);
        rating += (this.fielding.runOuts * 1.0);
        rating += (this.fielding.stumpings * 0.8);
        rating -= (this.fielding.droppedCatches * 0.3);
    }

    // Impact moments bonus
    if (this.impactMoments && this.impactMoments.length > 0) {
        this.impactMoments.forEach(moment => {
            switch (moment.impact) {
                case 'High': rating += 0.5; break;
                case 'Medium': rating += 0.3; break;
                case 'Low': rating += 0.1; break;
            }
        });
    }

    // Ensure rating is within bounds
    this.performanceRating = Math.min(10, Math.max(0, rating));
    return this.performanceRating;
};

// Method to update batting stats from ball data
playerPerformanceSchema.methods.updateBattingStats = function (ballData) {
    if (!this.batting) this.batting = {};

    this.batting.ballsFaced = (this.batting.ballsFaced || 0) + 1;
    this.batting.runsScored = (this.batting.runsScored || 0) + (ballData.runs || 0);

    // Update boundaries
    if (ballData.runs === 4) this.batting.fours = (this.batting.fours || 0) + 1;
    if (ballData.runs === 6) this.batting.sixes = (this.batting.sixes || 0) + 1;

    // Update singles, doubles, etc.
    switch (ballData.runs) {
        case 0: this.batting.dotBalls = (this.batting.dotBalls || 0) + 1; break;
        case 1: this.batting.singles = (this.batting.singles || 0) + 1; break;
        case 2: this.batting.doubles = (this.batting.doubles || 0) + 1; break;
        case 3: this.batting.triples = (this.batting.triples || 0) + 1; break;
    }

    // Calculate strike rate
    if (this.batting.ballsFaced > 0) {
        this.batting.strikeRate = ((this.batting.runsScored / this.batting.ballsFaced) * 100).toFixed(2);
    }

    // Handle wicket
    if (ballData.isWicket && ballData.batsman === this.playerName) {
        this.batting.isOut = true;
        this.batting.howOut = ballData.wicketType;
        this.batting.bowlerWhoGotOut = ballData.bowler;
        this.batting.fielderWhoGotOut = ballData.fielder || '';
    }
};

// Method to update bowling stats from ball data
playerPerformanceSchema.methods.updateBowlingStats = function (ballData) {
    if (!this.bowling) this.bowling = {};

    // Only count if this player is the bowler
    if (ballData.bowler !== this.playerName) return;

    this.bowling.ballsBowled = (this.bowling.ballsBowled || 0) + 1;
    this.bowling.runsConceded = (this.bowling.runsConceded || 0) + (ballData.runs || 0);

    // Handle extras
    if (ballData.isExtra) {
        if (ballData.extraType === 'Wide') this.bowling.wides = (this.bowling.wides || 0) + 1;
        if (ballData.extraType === 'No Ball') this.bowling.noBalls = (this.bowling.noBalls || 0) + 1;
    }

    // Handle boundaries conceded
    if (ballData.runs === 4) this.bowling.foursConceded = (this.bowling.foursConceded || 0) + 1;
    if (ballData.runs === 6) this.bowling.sixesConceded = (this.bowling.sixesConceded || 0) + 1;

    // Handle dot balls
    if (ballData.runs === 0 && !ballData.isExtra) {
        this.bowling.dotBallsBowled = (this.bowling.dotBallsBowled || 0) + 1;
    }

    // Handle wickets
    if (ballData.isWicket && ballData.bowler === this.playerName) {
        this.bowling.wicketsTaken = (this.bowling.wicketsTaken || 0) + 1;

        // Add wicket detail
        if (!this.bowling.wicketsDetail) this.bowling.wicketsDetail = [];
        this.bowling.wicketsDetail.push({
            batsmanOut: ballData.batsman,
            howOut: ballData.wicketType,
            fielder: ballData.fielder || '',
            overNumber: ballData.over,
            ballNumber: ballData.ball
        });
    }

    // Calculate overs and economy
    const validBalls = this.bowling.ballsBowled - (this.bowling.wides || 0) - (this.bowling.noBalls || 0);
    this.bowling.oversBowled = Math.floor(validBalls / 6) + (validBalls % 6) / 10;

    if (this.bowling.oversBowled > 0) {
        this.bowling.economy = (this.bowling.runsConceded / this.bowling.oversBowled).toFixed(2);
    }
};

module.exports = mongoose.model('PlayerPerformance', playerPerformanceSchema);