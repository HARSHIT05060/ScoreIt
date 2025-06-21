const Team = require('../models/Team');

// teamController.js
const createTeam = async (req, res) => {
    try {
        const { name, players } = req.body;

        // Validate required fields
        if (!name || !players || !Array.isArray(players)) {
            return res.status(400).json({
                success: false,
                message: 'Name and players array are required'
            });
        }

        // Create new team using Mongoose model
        const newTeam = new Team({
            name,
            players
        });

        // Save to database
        const savedTeam = await newTeam.save();

        res.status(201).json({
            success: true,
            data: savedTeam,
            message: 'Team created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating team',
            error: error.message
        });
    }
};

const getAllTeams = async (req, res) => {
    try {
        // Get all teams from database
        const teams = await Team.find();

        res.status(200).json({
            success: true,
            data: teams,
            message: 'Teams retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving teams',
            error: error.message
        });
    }
};

const getTeamById = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await Team.findById(id);

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        res.status(200).json({
            success: true,
            data: team,
            message: 'Team retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving team',
            error: error.message
        });
    }
};

const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, players } = req.body;

        const updatedTeam = await Team.findByIdAndUpdate(
            id,
            { name, players },
            { new: true, runValidators: true }
        );

        if (!updatedTeam) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedTeam,
            message: 'Team updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating team',
            error: error.message
        });
    }
};

const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTeam = await Team.findByIdAndDelete(id);

        if (!deletedTeam) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Team deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting team',
            error: error.message
        });
    }
};

module.exports = {
    createTeam,
    getAllTeams,
    getTeamById,
    updateTeam,
    deleteTeam
};