// controllers/playerController.js
const PlayerPerformance = require('../models/PlayerPerformance');
const Match = require('../models/Match');
const Team = require('../models/Team');

// Get player performance for a specific match
exports.getPlayerPerformance = async (req, res) => {
    try {
        const { matchId, playerName } = req.params;

        const performance = await PlayerPerformance.findOne({
            matchId,
            playerName
        }).populate('matchId', 'matchName date matchType')
            .populate('teamId', 'name');

        if (!performance) {
            return res.status(404).json({
                success: false,
                error: 'Player performance not found for this match'
            });
        }

        res.json({
            success: true,
            performance
        });
    } catch (err) {
        console.error('Error fetching player performance:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch player performance'
        });
    }
};

// Get all players performance for a match
exports.getMatchPlayerPerformances = async (req, res) => {
    try {
        const { matchId } = req.params;

        const performances = await PlayerPerformance.find({ matchId })
            .populate('matchId', 'matchName date matchType')
            .populate('teamId', 'name')
            .sort({ performanceRating: -1 });

        if (!performances.length) {
            return res.status(404).json({
                success: false,
                error: 'No player performances found for this match'
            });
        }

        // Separate by teams
        const teamA = performances.filter(p => p.teamId && performances[0].teamId && p.teamId.toString() === performances[0].teamId.toString());
        const teamB = performances.filter(p => p.teamId && performances[0].teamId && p.teamId.toString() !== performances[0].teamId.toString());

        res.json({
            success: true,
            performances: {
                all: performances,
                teamA,
                teamB
            },
            manOfTheMatch: performances.find(p => p.isManOfTheMatch)
        });
    } catch (err) {
        console.error('Error fetching match performances:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch match performances'
        });
    }
};

// Create or update player performance
exports.updatePlayerPerformance = async (req, res) => {
    try {
        const { matchId, playerName } = req.params;
        const updateData = req.body;

        // Find existing performance or create new one
        let performance = await PlayerPerformance.findOne({
            matchId,
            playerName
        });

        if (performance) {
            // Update existing performance
            Object.assign(performance, updateData);
            performance.calculatePerformanceRating();
            await performance.save();
        } else {
            // Create new performance record
            performance = new PlayerPerformance({
                matchId,
                playerName,
                ...updateData
            });
            performance.calculatePerformanceRating();
            await performance.save();
        }

        res.json({
            success: true,
            message: 'Player performance updated successfully',
            performance
        });
    } catch (err) {
        console.error('Error updating player performance:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to update player performance'
        });
    }
};

// Update player performance from ball-by-ball data
exports.updatePerformanceFromBall = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { ballData } = req.body;

        if (!ballData || !ballData.batsman || !ballData.bowler) {
            return res.status(400).json({
                success: false,
                error: 'Ball data must include batsman and bowler'
            });
        }

        // Update batsman performance
        let batsmanPerformance = await PlayerPerformance.findOne({
            matchId,
            playerName: ballData.batsman
        });

        if (batsmanPerformance) {
            batsmanPerformance.updateBattingStats(ballData);
            batsmanPerformance.calculatePerformanceRating();
            await batsmanPerformance.save();
        }

        // Update bowler performance
        let bowlerPerformance = await PlayerPerformance.findOne({
            matchId,
            playerName: ballData.bowler
        });

        if (bowlerPerformance) {
            bowlerPerformance.updateBowlingStats(ballData);
            bowlerPerformance.calculatePerformanceRating();
            await bowlerPerformance.save();
        }

        // Update fielder performance if there's a wicket
        if (ballData.isWicket && ballData.fielder &&
            ['Caught', 'Run Out', 'Stumped'].includes(ballData.wicketType)) {

            let fielderPerformance = await PlayerPerformance.findOne({
                matchId,
                playerName: ballData.fielder
            });

            if (fielderPerformance) {
                if (!fielderPerformance.fielding) fielderPerformance.fielding = {};

                switch (ballData.wicketType) {
                    case 'Caught':
                        fielderPerformance.fielding.catches = (fielderPerformance.fielding.catches || 0) + 1;
                        break;
                    case 'Run Out':
                        fielderPerformance.fielding.runOuts = (fielderPerformance.fielding.runOuts || 0) + 1;
                        break;
                    case 'Stumped':
                        fielderPerformance.fielding.stumpings = (fielderPerformance.fielding.stumpings || 0) + 1;
                        break;
                }

                fielderPerformance.calculatePerformanceRating();
                await fielderPerformance.save();
            }
        }

        res.json({
            success: true,
            message: 'Player performances updated from ball data',
            updated: {
                batsman: batsmanPerformance?.playerName,
                bowler: bowlerPerformance?.playerName,
                fielder: ballData.fielder || null
            }
        });
    } catch (err) {
        console.error('Error updating performance from ball:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to update performance from ball data'
        });
    }
};

// Initialize player performances for a match
exports.initializeMatchPerformances = async (req, res) => {
    try {
        const { matchId } = req.params;

        // Get match details
        const match = await Match.findById(matchId)
            .populate('teamA.name', 'name')
            .populate('teamB.name', 'name');

        if (!match) {
            return res.status(404).json({
                success: false,
                error: 'Match not found'
            });
        }

        // Check if performances already exist
        const existingPerformances = await PlayerPerformance.find({ matchId });
        if (existingPerformances.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Player performances already initialized for this match'
            });
        }

        const performances = [];

        // Initialize for Team A players
        for (const playerName of match.teamA.players) {
            if (playerName && playerName.trim()) {
                const performance = new PlayerPerformance({
                    matchId,
                    playerName: playerName.trim(),
                    teamId: match.teamA.name._id,
                    role: 'All Rounder', // Default role, can be updated later
                    batting: {},
                    bowling: {},
                    fielding: {}
                });
                performances.push(performance);
            }
        }

        // Initialize for Team B players
        for (const playerName of match.teamB.players) {
            if (playerName && playerName.trim()) {
                const performance = new PlayerPerformance({
                    matchId,
                    playerName: playerName.trim(),
                    teamId: match.teamB.name._id,
                    role: 'All Rounder', // Default role, can be updated later
                    batting: {},
                    bowling: {},
                    fielding: {}
                });
                performances.push(performance);
            }
        }

        // Save all performances
        await PlayerPerformance.insertMany(performances);

        res.json({
            success: true,
            message: 'Player performances initialized successfully',
            count: performances.length,
            match: {
                id: match._id,
                name: match.matchName,
                teamA: match.teamA.name.name,
                teamB: match.teamB.name.name
            }
        });
    } catch (err) {
        console.error('Error initializing match performances:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to initialize player performances'
        });
    }
};

// Set Man of the Match
exports.setManOfTheMatch = async (req, res) => {
    try {
        const { matchId, playerName } = req.params;

        // Remove MOTM from all players in this match
        await PlayerPerformance.updateMany(
            { matchId },
            { isManOfTheMatch: false }
        );

        // Set MOTM for the specified player
        const performance = await PlayerPerformance.findOneAndUpdate(
            { matchId, playerName },
            { isManOfTheMatch: true },
            { new: true }
        ).populate('matchId', 'matchName date')
            .populate('teamId', 'name');

        if (!performance) {
            return res.status(404).json({
                success: false,
                error: 'Player performance not found'
            });
        }

        // Also update the match record
        await Match.findByIdAndUpdate(matchId, {
            'matchStats.playerOfTheMatch': playerName
        });

        res.json({
            success: true,
            message: `${playerName} set as Man of the Match`,
            manOfTheMatch: performance
        });
    } catch (err) {
        console.error('Error setting Man of the Match:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to set Man of the Match'
        });
    }
};

// Get player statistics across multiple matches
exports.getPlayerStats = async (req, res) => {
    try {
        const { playerName } = req.params;
        const { limit = 10, page = 1 } = req.query;

        // Get all performances for this player
        const performances = await PlayerPerformance.find({ playerName })
            .populate('matchId', 'matchName date matchType status')
            .populate('teamId', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        if (!performances.length) {
            return res.status(404).json({
                success: false,
                error: 'No performances found for this player'
            });
        }

        // Calculate aggregate stats
        const stats = {
            totalMatches: performances.length,
            totalRuns: performances.reduce((sum, p) => sum + (p.batting?.runsScored || 0), 0),
            totalWickets: performances.reduce((sum, p) => sum + (p.bowling?.wicketsTaken || 0), 0),
            totalCatches: performances.reduce((sum, p) => sum + (p.fielding?.catches || 0), 0),
            manOfTheMatchAwards: performances.filter(p => p.isManOfTheMatch).length,
            averageRating: (performances.reduce((sum, p) => sum + p.performanceRating, 0) / performances.length).toFixed(2),
            highestScore: Math.max(...performances.map(p => p.batting?.runsScored || 0)),
            bestBowling: performances.reduce((best, current) => {
                const currentWickets = current.bowling?.wicketsTaken || 0;
                const bestWickets = best.wickets || 0;
                return currentWickets > bestWickets ?
                    { wickets: currentWickets, runs: current.bowling?.runsConceded || 0 } : best;
            }, { wickets: 0, runs: 0 })
        };

        const total = await PlayerPerformance.countDocuments({ playerName });

        res.json({
            success: true,
            player: {
                name: playerName,
                stats,
                recentPerformances: performances
            },
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (err) {
        console.error('Error fetching player stats:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch player statistics'
        });
    }
};

// Get top performers
exports.getTopPerformers = async (req, res) => {
    try {
        const { category = 'overall', limit = 10 } = req.query;

        let aggregationPipeline = [];

        switch (category) {
            case 'runs':
                aggregationPipeline = [
                    {
                        $group: {
                            _id: '$playerName',
                            totalRuns: { $sum: '$batting.runsScored' },
                            matches: { $sum: 1 },
                            avgRating: { $avg: '$performanceRating' }
                        }
                    },
                    { $sort: { totalRuns: -1 } },
                    { $limit: parseInt(limit) }
                ];
                break;

            case 'wickets':
                aggregationPipeline = [
                    {
                        $group: {
                            _id: '$playerName',
                            totalWickets: { $sum: '$bowling.wicketsTaken' },
                            matches: { $sum: 1 },
                            avgRating: { $avg: '$performanceRating' }
                        }
                    },
                    { $sort: { totalWickets: -1 } },
                    { $limit: parseInt(limit) }
                ];
                break;

            case 'motm':
                aggregationPipeline = [
                    { $match: { isManOfTheMatch: true } },
                    {
                        $group: {
                            _id: '$playerName',
                            motmCount: { $sum: 1 },
                            avgRating: { $avg: '$performanceRating' },
                            matches: { $sum: 1 }
                        }
                    },
                    { $sort: { motmCount: -1 } },
                    { $limit: parseInt(limit) }
                ];
                break;

            default: // overall rating
                aggregationPipeline = [
                    {
                        $group: {
                            _id: '$playerName',
                            avgRating: { $avg: '$performanceRating' },
                            matches: { $sum: 1 },
                            totalRuns: { $sum: '$batting.runsScored' },
                            totalWickets: { $sum: '$bowling.wicketsTaken' }
                        }
                    },
                    { $match: { matches: { $gte: 3 } } }, // Minimum 3 matches
                    { $sort: { avgRating: -1 } },
                    { $limit: parseInt(limit) }
                ];
        }

        const topPerformers = await PlayerPerformance.aggregate(aggregationPipeline);

        res.json({
            success: true,
            category,
            topPerformers
        });
    } catch (err) {
        console.error('Error fetching top performers:', err);
        res.status(500).json({
            success: false,
            error:// Completion of playerController.js - only the remaining part
            'Failed to fetch top performers' 
        });
    }
};

// Add impact moment to player performance
exports.addImpactMoment = async (req, res) => {
    try {
        const { matchId, playerName } = req.params;
        const { moment, description, overNumber, ballNumber, impact } = req.body;
        
        if (!moment || !description) {
            return res.status(400).json({
                success: false,
                error: 'Moment and description are required'
            });
        }

        const performance = await PlayerPerformance.findOne({
            matchId,
            playerName
        });
        
        if (!performance) {
            return res.status(404).json({
                success: false,
                error: 'Player performance not found'
            });
        }

        // Add impact moment
        performance.impactMoments.push({
            moment,
            description,
            overNumber,
            ballNumber,
            impact: impact || 'Medium'
        });

        // Recalculate performance rating
        performance.calculatePerformanceRating();
        await performance.save();

        res.json({
            success: true,
            message: 'Impact moment added successfully',
            performance
        });
    } catch (err) {
        console.error('Error adding impact moment:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to add impact moment' 
        });
    }
};

// Update player role
exports.updatePlayerRole = async (req, res) => {
    try {
        const { matchId, playerName } = req.params;
        const { role, battingPosition } = req.body;
        
        if (!role || !['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Valid role is required (Batsman, Bowler, All Rounder, Wicket Keeper)'
            });
        }

        const updateData = { role };
        if (battingPosition) {
            updateData.battingPosition = battingPosition;
        }

        const performance = await PlayerPerformance.findOneAndUpdate(
            { matchId, playerName },
            updateData,
            { new: true }
        ).populate('matchId', 'matchName date')
         .populate('teamId', 'name');
        
        if (!performance) {
            return res.status(404).json({
                success: false,
                error: 'Player performance not found'
            });
        }

        res.json({
            success: true,
            message: 'Player role updated successfully',
            performance
        });
    } catch (err) {
        console.error('Error updating player role:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update player role' 
        });
    }
};

// Delete player performance
exports.deletePlayerPerformance = async (req, res) => {
    try {
        const { matchId, playerName } = req.params;
        
        const performance = await PlayerPerformance.findOneAndDelete({
            matchId,
            playerName
        });
        
        if (!performance) {
            return res.status(404).json({
                success: false,
                error: 'Player performance not found'
            });
        }

        res.json({
            success: true,
            message: 'Player performance deleted successfully',
            deletedPlayer: playerName
        });
    } catch (err) {
        console.error('Error deleting player performance:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete player performance' 
        });
    }
};

// Get performance comparison between players
exports.comparePlayerPerformances = async (req, res) => {
    try {
        const { player1, player2 } = req.query;
        const { matchType, limit = 5 } = req.query;
        
        if (!player1 || !player2) {
            return res.status(400).json({
                success: false,
                error: 'Both player1 and player2 are required for comparison'
            });
        }

        // Build match filter
        let matchFilter = {};
        if (matchType) {
            matchFilter = { 'matchId.matchType': matchType };
        }

        // Get performances for both players
        const [player1Performances, player2Performances] = await Promise.all([
            PlayerPerformance.find({ playerName: player1 })
                .populate('matchId', 'matchName date matchType')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit)),
            PlayerPerformance.find({ playerName: player2 })
                .populate('matchId', 'matchName date matchType')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
        ]);

        // Calculate comparison stats
        const calculateStats = (performances) => ({
            matches: performances.length,
            totalRuns: performances.reduce((sum, p) => sum + (p.batting?.runsScored || 0), 0),
            totalWickets: performances.reduce((sum, p) => sum + (p.bowling?.wicketsTaken || 0), 0),
            avgRating: performances.length > 0 ? 
                (performances.reduce((sum, p) => sum + p.performanceRating, 0) / performances.length).toFixed(2) : 0,
            motmCount: performances.filter(p => p.isManOfTheMatch).length,
            highestScore: performances.length > 0 ? 
                Math.max(...performances.map(p => p.batting?.runsScored || 0)) : 0,
            bestBowlingFigures: performances.reduce((best, current) => {
                const wickets = current.bowling?.wicketsTaken || 0;
                return wickets > (best.wickets || 0) ? 
                    { wickets, runs: current.bowling?.runsConceded || 0 } : best;
            }, { wickets: 0, runs: 0 })
        });

        const comparison = {
            player1: {
                name: player1,
                stats: calculateStats(player1Performances),
                recentPerformances: player1Performances
            },
            player2: {
                name: player2,
                stats: calculateStats(player2Performances),
                recentPerformances: player2Performances
            }
        };

        res.json({
            success: true,
            comparison
        });
    } catch (err) {
        console.error('Error comparing player performances:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to compare player performances' 
        });
    }
};

// Get match summary with top performers
exports.getMatchSummary = async (req, res) => {
    try {
        const { matchId } = req.params;
        
        const performances = await PlayerPerformance.find({ matchId })
            .populate('matchId', 'matchName date matchType status result')
            .populate('teamId', 'name')
            .sort({ performanceRating: -1 });
        
        if (!performances.length) {
            return res.status(404).json({
                success: false,
                error: 'No performances found for this match'
            });
        }

        // Get top performers in different categories
        const topBatsman = performances.reduce((best, current) => 
            (current.batting?.runsScored || 0) > (best.batting?.runsScored || 0) ? current : best
        );

        const topBowler = performances.reduce((best, current) => 
            (current.bowling?.wicketsTaken || 0) > (best.bowling?.wicketsTaken || 0) ? current : best
        );

        const topFielder = performances.reduce((best, current) => {
            const currentFielding = (current.fielding?.catches || 0) + 
                                  (current.fielding?.runOuts || 0) + 
                                  (current.fielding?.stumpings || 0);
            const bestFielding = (best.fielding?.catches || 0) + 
                               (best.fielding?.runOuts || 0) + 
                               (best.fielding?.stumpings || 0);
            return currentFielding > bestFielding ? current : best;
        });

        const manOfTheMatch = performances.find(p => p.isManOfTheMatch);

        // Team-wise breakdown
        const teams = {};
        performances.forEach(perf => {
            const teamName = perf.teamId?.name || 'Unknown';
            if (!teams[teamName]) {
                teams[teamName] = {
                    players: [],
                    totalRuns: 0,
                    totalWickets: 0
                };
            }
            teams[teamName].players.push(perf);
            teams[teamName].totalRuns += perf.batting?.runsScored || 0;
            teams[teamName].totalWickets += perf.bowling?.wicketsTaken || 0;
        });

        res.json({
            success: true,
            matchSummary: {
                match: performances[0].matchId,
                topPerformers: {
                    overall: performances[0], // Highest rated
                    topBatsman: {
                        player: topBatsman.playerName,
                        runs: topBatsman.batting?.runsScored || 0,
                        balls: topBatsman.batting?.ballsFaced || 0,
                        strikeRate: topBatsman.batting?.strikeRate || 0
                    },
                    topBowler: {
                        player: topBowler.playerName,
                        wickets: topBowler.bowling?.wicketsTaken || 0,
                        runs: topBowler.bowling?.runsConceded || 0,
                        overs: topBowler.bowling?.oversBowled || 0,
                        economy: topBowler.bowling?.economy || 0
                    },
                    topFielder: {
                        player: topFielder.playerName,
                        catches: topFielder.fielding?.catches || 0,
                        runOuts: topFielder.fielding?.runOuts || 0,
                        stumpings: topFielder.fielding?.stumpings || 0
                    }
                },
                manOfTheMatch: manOfTheMatch ? {
                    player: manOfTheMatch.playerName,
                    rating: manOfTheMatch.performanceRating,
                    team: manOfTheMatch.teamId?.name || 'Unknown'
                } : null,
                teamBreakdown: teams,
                totalPlayers: performances.length
            }
        });
    } catch (err) {
        console.error('Error getting match summary:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get match summary' 
        });
    }
};