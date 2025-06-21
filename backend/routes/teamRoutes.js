import express from 'express';
import { 
    createTeam, 
    getAllTeams, 
    getTeamById, 
    updateTeam, 
    deleteTeam 
} from '../controllers/teamController.js';

const router = express.Router();

// POST /api/teams - Create a new team
router.post('/', createTeam);

// GET /api/teams - Get all teams
router.get('/', getAllTeams);

// GET /api/teams/:id - Get team by ID
router.get('/:id', getTeamById);

// PUT /api/teams/:id - Update team by ID
router.put('/:id', updateTeam);

// DELETE /api/teams/:id - Delete team by ID
router.delete('/:id', deleteTeam);

export default router;