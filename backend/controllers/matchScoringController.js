// controllers/matchScoringController.js
const Match = require('../models/Match');
const getBowlerNameManually = async (bowlerId, match) => {
    if (!bowlerId) return 'Unknown';

    try {
        // If bowlerId is already an object with name
        if (typeof bowlerId === 'object' && bowlerId.name) {
            return bowlerId.name;
        }

        // If it's a string (player name), return it
        if (typeof bowlerId === 'string' && !bowlerId.match(/^[0-9a-fA-F]{24}$/)) {
            return bowlerId;
        }

        // If it's an ObjectId, look it up in the database
        const Player = require('../models/Player'); // Adjust path as needed
        const player = await Player.findById(bowlerId).select('name');

        if (player) {
            return player.name;
        }

        // Fallback: check if bowler exists in team rosters
        const allTeamPlayers = [
            ...(match.teamA?.players || []),
            ...(match.teamB?.players || [])
        ];

        // If teams are populated, search there
        for (let player of allTeamPlayers) {
            if (player._id?.toString() === bowlerId.toString()) {
                return player.name || 'Unknown';
            }
        }

        return 'Unknown';
    } catch (error) {
        console.error('Error fetching bowler name:', error);
        return 'Unknown';
    }
};
// Update match score - main scoring endpoint
exports.updateMatchScore = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            innings,
            runs,
            wickets,
            overs,
            balls,
            overBalls,
            striker,
            nonStriker,
            bowler,
            currentBowler,
            lastBall,
            action,
            status,           // Added status field
            finalResult,      // Added finalResult field
            completedAt       // Added completedAt field
        } = req.body;

        const match = await Match.findById(id);
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Update match status to ongoing if it's not already
        if (match.status === 'upcoming') {
            match.status = 'ongoing';
            match.startTime = new Date();
        }

        // Handle match completion
        if (action === 'complete_match' || status === 'complete') {
            match.status = 'completed';
            match.endTime = completedAt ? new Date(completedAt) : new Date();

            // Store final result if provided
            if (finalResult) {
                match.result = {
                    winner: finalResult.winner,
                    result: finalResult.result,
                    margin: finalResult.margin,
                    completedAt: match.endTime
                };
            }

            // Mark current innings as completed
            const currentInningsData = match.innings.find(inning => inning.innings === innings);
            if (currentInningsData) {
                currentInningsData.isCompleted = true;
            }
        }

        // Find or create current innings
        let currentInnings = match.innings.find(inning => inning.innings === innings);
        if (!currentInnings) {
            await match.initializeInnings(innings);
            currentInnings = match.innings.find(inning => inning.innings === innings);
        }

        // Update current innings data
        currentInnings.totalRuns = runs || 0;
        currentInnings.totalWickets = wickets || 0;

        // Fix: Don't subtract 1 when completing match, only during normal play
        if (action === 'complete_match') {
            // For match completion, use actual overs and balls without subtracting
            currentInnings.totalOvers = Math.floor((overs - 1)) + (balls / 6);
            currentInnings.totalBalls = ((overs - 1) * 6) + balls;
        } else {
            // For normal scoring, subtract 1 as usual
            currentInnings.totalOvers = Math.floor((overs - 1)) + ((balls - 1) / 6);
            currentInnings.totalBalls = ((overs - 1) * 6) + (balls - 1);
        }

        currentInnings.currentStriker = striker || '';
        currentInnings.currentNonStriker = nonStriker || '';

        // *** KEY FIX: Always update currentBowler - use bowler or currentBowler field ***
        const activeBowler = currentBowler || bowler || '';
        currentInnings.currentBowler = activeBowler;

        // Add ball to history if it's not an undo action and not a match completion
        if (lastBall && action !== 'undo' && action !== 'complete_match') {
            const ballData = {
                over: overs,
                ball: balls - 1,
                runs: lastBall.runs || 0,
                isWicket: lastBall.type === 'wicket',
                isExtra: lastBall.type === 'extra',
                extraType: lastBall.extraType,
                wicketType: lastBall.wicketType,
                batsman: striker,
                bowler: activeBowler,
                fielder: lastBall.fielder,
                timestamp: new Date()
            };

            currentInnings.balls.push(ballData);

            // Update extras logic...
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
                }
                currentInnings.extras.total++;
            }
        }

        // Handle undo action
        if (action === 'undo' && currentInnings.balls.length > 0) {
            currentInnings.balls.pop();

            // Recalculate extras
            currentInnings.extras = {
                wides: 0, noBalls: 0, byes: 0, legByes: 0, penalties: 0, total: 0
            };

            currentInnings.balls.forEach(ball => {
                if (ball.isExtra && ball.extraType) {
                    switch (ball.extraType) {
                        case 'Wide': currentInnings.extras.wides++; break;
                        case 'No Ball': currentInnings.extras.noBalls++; break;
                        case 'Bye': currentInnings.extras.byes++; break;
                        case 'Leg Bye': currentInnings.extras.legByes++; break;
                    }
                    currentInnings.extras.total++;
                }
            });

            if (currentInnings.balls.length > 0) {
                const previousBall = currentInnings.balls[currentInnings.balls.length - 1];
                currentInnings.currentBowler = previousBall.bowler;
            }
        }

        match.currentInnings = innings;

        // Check if innings is completed
        if (lastBall?.type === 'end_innings') {
            currentInnings.isCompleted = true;
            if (innings === 2) {
                match.status = 'completed';
                match.endTime = new Date();
                await calculateMatchResult(match);
            }
        }

        // Update legacy matchStats
        if (innings === 1) {
            match.matchStats.teamAScore.runs = runs || 0;
            match.matchStats.teamAScore.wickets = wickets || 0;
            // Fix: Don't subtract 1 when completing match
            if (action === 'complete_match') {
                match.matchStats.teamAScore.overs = Math.floor((overs - 1)) + (balls / 6);
            } else {
                match.matchStats.teamAScore.overs = Math.floor((overs - 1)) + ((balls - 1) / 6);
            }
        } else {
            match.matchStats.teamBScore.runs = runs || 0;
            match.matchStats.teamBScore.wickets = wickets || 0;
            // Fix: Don't subtract 1 when completing match
            if (action === 'complete_match') {
                match.matchStats.teamBScore.overs = Math.floor((overs - 1)) + (balls / 6);
            } else {
                match.matchStats.teamBScore.overs = Math.floor((overs - 1)) + ((balls - 1) / 6);
            }
        }

        await match.save();

        // *** ENHANCED POPULATION: Include more comprehensive population ***
        const populatedMatch = await Match.findById(id)
            .populate({
                path: 'innings.currentBowler',
                select: 'name'
            })
            .populate({
                path: 'innings.currentStriker',
                select: 'name'
            })
            .populate({
                path: 'innings.currentNonStriker',
                select: 'name'
            })
            .populate({
                path: 'teamA.players',
                select: 'name'
            })
            .populate({
                path: 'teamB.players',
                select: 'name'
            })
            .populate({
                path: 'innings.balls.bowler',
                select: 'name'
            });

        const currentInningsData = populatedMatch.innings.find(inning => inning.innings === innings);

        // *** HELPER FUNCTION: Get bowler name with multiple fallbacks ***
        const getBowlerName = () => {
            // Try populated currentBowler first
            if (currentInningsData?.currentBowler?.name) {
                return currentInningsData.currentBowler.name;
            }

            // Try to find bowler in team players by ID
            const bowlerIdToFind = activeBowler;
            if (bowlerIdToFind) {
                // Check both teams for the bowler
                const allPlayers = [
                    ...(populatedMatch.teamA?.players || []),
                    ...(populatedMatch.teamB?.players || [])
                ];

                const foundBowler = allPlayers.find(player =>
                    player._id.toString() === bowlerIdToFind.toString()
                );

                if (foundBowler?.name) {
                    return foundBowler.name;
                }
            }

            return 'Unknown';
        };

        const bowlerName = await getBowlerNameManually(activeBowler, match);

        res.json({
            success: true,
            message: action === 'complete_match' ? 'Match completed successfully' : 'Score updated successfully',
            match: {
                id: populatedMatch._id,
                status: populatedMatch.status,
                currentInnings: populatedMatch.currentInnings,
                innings: populatedMatch.innings,
                currentBowler: bowlerName,
                currentStriker: currentInningsData?.currentStriker?.name || 'Unknown',
                currentNonStriker: currentInningsData?.currentNonStriker?.name || 'Unknown',
                result: populatedMatch.result || null,
                endTime: populatedMatch.endTime || null
            }
        });
    } catch (err) {
        console.error('Error updating match score:', err);
        res.status(500).json({
            error: 'Failed to update score',
            message: err.message
        });
    }
};

// Get live match data
exports.getLiveMatchData = async (req, res) => {
    try {
        const { id } = req.params;

        const match = await Match.findById(id)
            .populate('teamA.name', 'name')
            .populate('teamB.name', 'name')
            .populate('tossWinner', 'name')
            .populate('createdBy', 'name email');

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Get current innings details
        const currentInnings = match.getCurrentInnings();

        // Get recent balls (last 2 overs)
        const recentBalls = currentInnings ?
            currentInnings.balls.slice(-12) : [];

        // Calculate run rate
        const runRate = currentInnings && currentInnings.totalOvers > 0 ?
            (currentInnings.totalRuns / currentInnings.totalOvers).toFixed(2) : '0.00';

        // Required run rate for second innings
        let requiredRunRate = null;
        if (match.currentInnings === 2 && match.innings.length > 1) {
            const firstInnings = match.innings[0];
            const target = firstInnings.totalRuns + 1;
            const remainingRuns = target - currentInnings.totalRuns;
            const remainingOvers = match.overs - currentInnings.totalOvers;
            requiredRunRate = remainingOvers > 0 ?
                (remainingRuns / remainingOvers).toFixed(2) : '0.00';
        }

        res.json({
            success: true,
            match: {
                ...match.toObject(),
                liveData: {
                    currentRunRate: runRate,
                    requiredRunRate,
                    recentBalls,
                    target: match.currentInnings === 2 && match.innings.length > 1 ?
                        match.innings[0].totalRuns + 1 : null
                }
            }
        });

    } catch (err) {
        console.error('Error fetching live match data:', err);
        res.status(500).json({
            error: 'Failed to fetch live match data',
            message: err.message
        });
    }
};

// Start match - initialize first innings
exports.startMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { striker, nonStriker, bowler } = req.body;

        const match = await Match.findById(id);
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        if (match.status !== 'upcoming') {
            return res.status(400).json({ error: 'Match already started or completed' });
        }

        // Initialize first innings
        await match.initializeInnings(1);

        // Update match status
        match.status = 'ongoing';
        match.startTime = new Date();
        match.currentInnings = 1;

        // Set initial players
        const firstInnings = match.getCurrentInnings();
        firstInnings.currentStriker = striker || '';
        firstInnings.currentNonStriker = nonStriker || '';
        firstInnings.currentBowler = bowler || '';

        await match.save();

        res.json({
            success: true,
            message: 'Match started successfully',
            match: {
                id: match._id,
                status: match.status,
                currentInnings: match.currentInnings,
                startTime: match.startTime
            }
        });

    } catch (err) {
        console.error('Error starting match:', err);
        res.status(500).json({
            error: 'Failed to start match',
            message: err.message
        });
    }
};

// Helper function to calculate match result
async function calculateMatchResult(match) {
    const firstInnings = match.innings[0];
    const secondInnings = match.innings[1];

    if (!firstInnings || !secondInnings) return;

    const team1Score = firstInnings.totalRuns;
    const team2Score = secondInnings.totalRuns;

    if (team1Score > team2Score) {
        // First batting team won
        const margin = team1Score - team2Score;
        match.matchStats.winner = firstInnings.battingTeam.toString();
        match.matchStats.result = `Won by ${margin} runs`;
        match.matchStats.winMargin = `${margin} runs`;
    } else if (team2Score > team1Score) {
        // Second batting team won
        const wicketsRemaining = 10 - secondInnings.totalWickets;
        match.matchStats.winner = secondInnings.battingTeam.toString();
        match.matchStats.result = `Won by ${wicketsRemaining} wickets`;
        match.matchStats.winMargin = `${wicketsRemaining} wickets`;
    } else {
        // Match tied
        match.matchStats.result = 'Match Tied';
        match.matchStats.winMargin = 'Tie';
    }
}

module.exports = {
    updateMatchScore: exports.updateMatchScore,
    getLiveMatchData: exports.getLiveMatchData,
    startMatch: exports.startMatch
};