const express = require('express');
const router = express.Router();
const {
    createMatch,
    getAllMatches,
    getMatchById,
    updateMatch,
    deleteMatch,
    resetMatchById
} = require('../controllers/matchController');

// Import the new scoring controller
const {
    updateMatchScore,
    getLiveMatchData,
    startMatch
} = require('../controllers/matchScoringController');

// Authentication middleware
const auth = require('../middleware/auth');

// Basic CRUD routes
router.post('/', auth, createMatch);           // POST /api/matches
router.get('/', auth, getAllMatches);          // GET /api/matches
router.get('/:id', auth, getMatchById);        // GET /api/matches/:id
router.put('/:id', auth, updateMatch);         // PUT /api/matches/:id
router.delete('/:id', auth, deleteMatch);      // DELETE /api/matches/:id
router.post('/reset/:matchId',auth, resetMatchById);

// Live scoring routes
router.post('/start/:id', auth, startMatch);            // POST /api/matches/:id/start
router.put('/:id/score', auth, updateMatchScore);       // PUT /api/matches/:id/score
router.get('/:id/live', auth, getLiveMatchData);        // GET /api/matches/:id/live

module.exports = router;