import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: Number,
    role: String, // e.g., "Batsman", "Bowler", "All-rounder"
    stats: {
        matches: { type: Number, default: 0 },
        runs: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
    }
}, { timestamps: true });

export default mongoose.model('Player', playerSchema);
