// routes/playerRoutes.js
const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

// Match-specific player performance routes
router.get('/match/:matchId/player/:playerName', playerController.getPlayerPerformance);
router.get('/match/:matchId/players', playerController.getMatchPlayerPerformances);
router.put('/match/:matchId/player/:playerName', playerController.updatePlayerPerformance);
router.delete('/match/:matchId/player/:playerName', playerController.deletePlayerPerformance);

// Ball-by-ball update route
router.post('/match/:matchId/update-from-ball', playerController.updatePerformanceFromBall);

// Match initialization and management
router.post('/match/:matchId/initialize', playerController.initializeMatchPerformances);
router.put('/match/:matchId/motm/:playerName', playerController.setManOfTheMatch);
router.get('/match/:matchId/summary', playerController.getMatchSummary);

// Player role and details management
router.put('/match/:matchId/player/:playerName/role', playerController.updatePlayerRole);
router.post('/match/:matchId/player/:playerName/impact', playerController.addImpactMoment);

// Player statistics and analysis routes
router.get('/player/:playerName/stats', playerController.getPlayerStats);
router.get('/compare', playerController.comparePlayerPerformances);
router.get('/top-performers', playerController.getTopPerformers);

module.exports = router;