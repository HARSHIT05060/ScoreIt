const Match = require('../../models/Match');
const Innings = require('../../models/Innings');

exports.startMatch = async (req, res) => {
  try {
    const { battingTeamId, bowlingTeamId } = req.body;
    const { matchId } = req.params;
    const { oversLimit } = req.body;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const innings = new Innings({
      matchId,
      battingTeam: battingTeamId,
      bowlingTeam: bowlingTeamId,
      overs: match.overs,
      currentOver: 0,
      oversLimit,
      totalRuns: 0,
      totalWickets: 0,
      balls: [],
    });

    await innings.save();

    match.status = 'ongoing';
    match.currentInnings = innings._id;
    await match.save();

    res.status(200).json({
      success: true,
      message: 'Match started successfully',
      inningsId: innings._id,
    });
  } catch (error) {
    console.error('Start match error:', error);
    res.status(500).json({ message: 'Server error starting match' });
  }
};
