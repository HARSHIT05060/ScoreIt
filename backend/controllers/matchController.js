const Match = require('../models/Match');

// Create a new match
exports.createMatch = async (req, res) => {
    try {
        const {
            matchName,
            matchType,
            location,
            date,
            overs,
            teamA,
            teamB,
            tossWinner,
            tossDecision,
            umpire
        } = req.body;

        // Validation
        if (!matchName || !matchType || !date || !overs || !teamA || !teamB || !tossWinner || !tossDecision) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['matchName', 'matchType', 'date', 'overs', 'teamA', 'teamB', 'tossWinner', 'tossDecision']
            });
        }

        // Validate teams have players
        if (!teamA.players || teamA.players.length === 0) {
            return res.status(400).json({ error: 'Team A must have at least one player' });
        }

        if (!teamB.players || teamB.players.length === 0) {
            return res.status(400).json({ error: 'Team B must have at least one player' });
        }

        // Validate tossWinner is one of the team ObjectIds (not team names)
        if (tossWinner !== teamA.name && tossWinner !== teamB.name) {
            return res.status(400).json({
                error: 'Toss winner must be one of the teams',
                received: tossWinner,
                expected: `${teamA.name} or ${teamB.name}`
            });
        }

        // Ensure user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Create new match
        const newMatch = new Match({
            matchName,
            matchType,
            location,
            date: new Date(date),
            overs,
            teamA: {
                name: teamA.name, // This should be ObjectId
                players: teamA.players.filter(player => player && player.trim()) // Remove empty players
            },
            teamB: {
                name: teamB.name, // This should be ObjectId  
                players: teamB.players.filter(player => player && player.trim()) // Remove empty players
            },
            tossWinner, // This should be ObjectId
            tossDecision,
            umpire: umpire || {},
            createdBy: req.user.id // Use req.user.id from auth middleware
        });

        await newMatch.save();

        res.status(201).json({
            success: true,
            message: 'Match created successfully',
            match: {
                id: newMatch._id,
                matchName: newMatch.matchName,
                matchType: newMatch.matchType,
                date: newMatch.date,
                status: newMatch.status
            }
        });

    } catch (err) {
        console.error('❌ Error creating match:', err);

        // Handle mongoose validation errors
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({
                error: 'Validation failed',
                details: errors,
                validationErrors: err.errors
            });
        }

        res.status(500).json({
            error: 'Failed to create match',
            message: err.message || 'Internal server error'
        });
    }
};
exports.resetMatchById = async (req, res) => {
    try {
        const { matchId } = req.params;

        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        // Reset fields
        match.status = 'upcoming';
        match.currentInnings = 1;
        match.innings = [];
        match.matchStats = {
            teamAScore: { runs: 0, wickets: 0, overs: 0 },
            teamBScore: { runs: 0, wickets: 0, overs: 0 },
            winner: '',
            result: '',
            winMargin: '',
            playerOfTheMatch: ''
        };
        match.startTime = null;
        match.endTime = null;

        await match.save();

        res.status(200).json({ message: 'Match has been reset successfully' });
    } catch (error) {
        console.error('Error resetting match:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
// Get all matches
exports.getAllMatches = async (req, res) => {
    try {
        const { status, limit = 10, page = 1 } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }

        const matches = await Match.find(query)
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('teamA.name', 'name')
            .populate('teamB.name', 'name')
            .populate('tossWinner', 'name')
            .populate('createdBy', 'name email');

        const total = await Match.countDocuments(query);

        res.json({
            success: true,
            matches,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (err) {
        console.error('Error fetching matches:', err);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
};

// Get single match by ID
exports.getMatchById = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('teamA.name', 'name players')
            .populate('teamB.name', 'name players')
            .populate('tossWinner', 'name')
            .populate('innings.currentBowler', 'name') // Populate current bowler
            .populate('innings.currentStriker', 'name') // Populate current striker
            .populate('innings.currentNonStriker', 'name') // Populate current non-striker
            .populate('innings.balls.bowler', 'name') // Populate bowler in each ball
            .populate('innings.balls.batsman', 'name') // Populate batsman in each ball
            .populate('createdBy', 'name email');

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        res.json({
            success: true,
            match
        });
    } catch (err) {
        console.error('Error fetching match:', err);
        res.status(500).json({ error: 'Failed to fetch match' });
    }
};

// Update match
exports.updateMatch = async (req, res) => {
    try {
        const match = await Match.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        res.json({
            success: true,
            message: 'Match updated successfully',
            match
        });
    } catch (err) {
        console.error('Error updating match:', err);
        res.status(500).json({ error: 'Failed to update match' });
    }
};

// Delete match
exports.deleteMatch = async (req, res) => {
    try {
        const match = await Match.findByIdAndDelete(req.params.id);

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        res.json({
            success: true,
            message: 'Match deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting match:', err);
        res.status(500).json({ error: 'Failed to delete match' });
    }
};