// Frontend: Fixed CreateMatch Component
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CreateMatch.css';

const CreateMatch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [matchData, setMatchData] = useState({
    matchName: '',
    venue: '',
    matchDate: '',
    matchTime: '',
    matchType: 'T20',
    overs: 20,
    team1Name: '',
    team2Name: '',
    tossWinner: '',
    tossDecision: '',
    umpire1: '',
    umpire2: ''
  });

  const [newTeam1, setNewTeam1] = useState({
    name: '',
    players: [{ name: '', role: 'Batsman' }]
  });

  const [newTeam2, setNewTeam2] = useState({
    name: '',
    players: [{ name: '', role: 'Batsman' }]
  });

  // Update team names when matchData changes
  React.useEffect(() => {
    if (matchData.team1Name && newTeam1.name !== matchData.team1Name) {
      setNewTeam1(prev => ({ ...prev, name: matchData.team1Name }));
    }
    if (matchData.team2Name && newTeam2.name !== matchData.team2Name) {
      setNewTeam2(prev => ({ ...prev, name: matchData.team2Name }));
    }
  }, [matchData.team1Name, matchData.team2Name]);

  const playerRoles = ['Batsman', 'Bowler', 'All Rounder', 'Wicket Keeper'];
  const matchTypes = ['T10', 'T20', 'ODI'];

  // Create team API call
  const createTeamAPI = async (team) => {
    const res = await fetch("${import.meta.env.VITE_API_BASE_URL}/api/teams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(team),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to create team");
    }

    return data;
  };

  // API call to create match
  const createMatchAPI = async (matchPayload) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify(matchPayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create match');
    }

    const result = await response.json();
    return result;
  };

  // In CreateMatch.js - Fix the navigation after match creation
  const handleCreateMatch = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Create both teams
      const teamAData = {
        name: newTeam1.name,
        players: newTeam1.players.map(p => ({ name: p.name, role: p.role }))
      };

      const teamBData = {
        name: newTeam2.name,
        players: newTeam2.players.map(p => ({ name: p.name, role: p.role }))
      };

      const { data: createdTeamA } = await createTeamAPI(teamAData);
      const { data: createdTeamB } = await createTeamAPI(teamBData);

      // 2. Prepare match payload according to your schema
      const matchPayload = {
        matchName: matchData.matchName,
        matchType: matchData.matchType,
        location: matchData.venue,
        date: new Date(`${matchData.matchDate}T${matchData.matchTime}`),
        overs: matchData.overs,
        teamA: {
          name: createdTeamA._id,
          players: createdTeamA.players.map(p => p.name)
        },
        teamB: {
          name: createdTeamB._id,
          players: createdTeamB.players.map(p => p.name)
        },
        tossWinner: matchData.tossWinner === matchData.team1Name ? createdTeamA._id : createdTeamB._id,
        tossDecision: matchData.tossDecision,
        umpire: {
          name: matchData.umpire1,
          contact: matchData.umpire2
        },
        createdBy: user._id
      };

      // 3. Create match
      const result = await createMatchAPI(matchPayload);

      console.log('✅ Match created successfully:', result);

      // CHANGE: Navigate to match/start/:id instead of matches/start/:id
      navigate(`/match/start/${result.match._id || result.match.id}`);
      alert('Match created successfully!');

    } catch (error) {
      console.error('❌ Error creating match:', error);
      setError(error.message || 'Failed to create match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return matchData.matchName && matchData.venue && matchData.matchDate &&
          matchData.matchTime && matchData.team1Name && matchData.team2Name;
      case 2:
        return newTeam1.players.every(p => p.name) &&
          newTeam2.players.every(p => p.name);
      case 3:
        return matchData.tossWinner && matchData.tossDecision;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const addPlayer = (teamNumber) => {
    if (teamNumber === 1) {
      setNewTeam1({
        ...newTeam1,
        players: [...newTeam1.players, { name: '', role: 'Batsman' }]
      });
    } else {
      setNewTeam2({
        ...newTeam2,
        players: [...newTeam2.players, { name: '', role: 'Batsman' }]
      });
    }
  };

  const removePlayer = (teamNumber, index) => {
    if (teamNumber === 1) {
      const updatedPlayers = newTeam1.players.filter((_, i) => i !== index);
      setNewTeam1({ ...newTeam1, players: updatedPlayers });
    } else {
      const updatedPlayers = newTeam2.players.filter((_, i) => i !== index);
      setNewTeam2({ ...newTeam2, players: updatedPlayers });
    }
  };

  const updatePlayer = (teamNumber, index, field, value) => {
    if (teamNumber === 1) {
      const updatedPlayers = [...newTeam1.players];
      updatedPlayers[index][field] = value;
      setNewTeam1({ ...newTeam1, players: updatedPlayers });
    } else {
      const updatedPlayers = [...newTeam2.players];
      updatedPlayers[index][field] = value;
      setNewTeam2({ ...newTeam2, players: updatedPlayers });
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3, 4].map((step) => (
        <div
          key={step}
          className={`step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
        >
          <div className="step-number">{step}</div>
          <div className="step-label">
            {step === 1 && 'Match Details'}
            {step === 2 && 'Create Teams'}
            {step === 3 && 'Toss & Settings'}
            {step === 4 && 'Review & Create'}
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="step-content">
      <h2>Match Details</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>Match Name</label>
          <input
            type="text"
            value={matchData.matchName}
            onChange={(e) => setMatchData({ ...matchData, matchName: e.target.value })}
            placeholder="e.g., Sunday Gully Match"
          />
        </div>
        <div className="form-group">
          <label>Venue</label>
          <input
            type="text"
            value={matchData.venue}
            onChange={(e) => setMatchData({ ...matchData, venue: e.target.value })}
            placeholder="e.g., Local Ground"
          />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={matchData.matchDate}
            onChange={(e) => setMatchData({ ...matchData, matchDate: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Time</label>
          <input
            type="time"
            value={matchData.matchTime}
            onChange={(e) => setMatchData({ ...matchData, matchTime: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Match Type</label>
          <select
            value={matchData.matchType}
            onChange={(e) => {
              const type = e.target.value;
              let overs = 20;
              if (type === 'T10') overs = 10;
              else if (type === 'ODI') overs = 50;
              setMatchData({ ...matchData, matchType: type, overs });
            }}
          >
            {matchTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Overs</label>
          <input
            type="number"
            min="1"
            max="50"
            value={matchData.overs}
            onChange={(e) => setMatchData({ ...matchData, overs: parseInt(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>Team 1 Name</label>
          <input
            type="text"
            value={matchData.team1Name}
            onChange={(e) => setMatchData({ ...matchData, team1Name: e.target.value })}
            placeholder="e.g., Mumbai Indians"
          />
        </div>
        <div className="form-group">
          <label>Team 2 Name</label>
          <input
            type="text"
            value={matchData.team2Name}
            onChange={(e) => setMatchData({ ...matchData, team2Name: e.target.value })}
            placeholder="e.g., Chennai Super Kings"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h2>Create Teams</h2>
      <div className="new-teams-creation">
        <div className="new-team">
          <h3>Team 1: {matchData.team1Name || 'Team 1'}</h3>
          <div className="players-section">
            <h4>Players</h4>
            {newTeam1.players.map((player, index) => (
              <div key={index} className="player-row">
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updatePlayer(1, index, 'name', e.target.value)}
                  placeholder="Player name"
                />
                <select
                  value={player.role}
                  onChange={(e) => updatePlayer(1, index, 'role', e.target.value)}
                >
                  {playerRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {newTeam1.players.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlayer(1, index)}
                    className="remove-player-btn"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addPlayer(1)}
              className="add-player-btn"
            >
              + Add Player
            </button>
          </div>
        </div>

        <div className="vs-divider">VS</div>

        <div className="new-team">
          <h3>Team 2: {matchData.team2Name || 'Team 2'}</h3>
          <div className="players-section">
            <h4>Players</h4>
            {newTeam2.players.map((player, index) => (
              <div key={index} className="player-row">
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updatePlayer(2, index, 'name', e.target.value)}
                  placeholder="Player name"
                />
                <select
                  value={player.role}
                  onChange={(e) => updatePlayer(2, index, 'role', e.target.value)}
                >
                  {playerRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {newTeam2.players.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlayer(2, index)}
                    className="remove-player-btn"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addPlayer(2)}
              className="add-player-btn"
            >
              + Add Player
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h2>Toss & Match Settings</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>Toss Winner</label>
          <select
            value={matchData.tossWinner}
            onChange={(e) => setMatchData({ ...matchData, tossWinner: e.target.value })}
          >
            <option value="">Select toss winner</option>
            <option value={matchData.team1Name}>{matchData.team1Name}</option>
            <option value={matchData.team2Name}>{matchData.team2Name}</option>
          </select>
        </div>
        <div className="form-group">
          <label>Toss Decision</label>
          <select
            value={matchData.tossDecision}
            onChange={(e) => setMatchData({ ...matchData, tossDecision: e.target.value })}
          >
            <option value="">Select decision</option>
            <option value="Bat">Chose to Bat</option>
            <option value="Bowl">Chose to Bowl</option>
          </select>
        </div>
        <div className="form-group">
          <label>Umpire Name (Optional)</label>
          <input
            type="text"
            value={matchData.umpire1}
            onChange={(e) => setMatchData({ ...matchData, umpire1: e.target.value })}
            placeholder="Umpire name"
          />
        </div>
        <div className="form-group">
          <label>Umpire Contact (Optional)</label>
          <input
            type="text"
            value={matchData.umpire2}
            onChange={(e) => setMatchData({ ...matchData, umpire2: e.target.value })}
            placeholder="Umpire contact"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <h2>Review & Create Match</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="match-summary">
        <div className="summary-section">
          <h3>Match Information</h3>
          <div className="summary-grid">
            <div><strong>Match Name:</strong> {matchData.matchName}</div>
            <div><strong>Venue:</strong> {matchData.venue}</div>
            <div><strong>Date:</strong> {matchData.matchDate}</div>
            <div><strong>Time:</strong> {matchData.matchTime}</div>
            <div><strong>Type:</strong> {matchData.matchType}</div>
            <div><strong>Overs:</strong> {matchData.overs}</div>
            <div><strong>Team 1:</strong> {matchData.team1Name}</div>
            <div><strong>Team 2:</strong> {matchData.team2Name}</div>
          </div>
        </div>

        <div className="summary-section">
          <h3>Teams</h3>
          <div className="teams-summary">
            <div className="team-summary">
              <h4>{matchData.team1Name}</h4>
              <ul>
                {newTeam1.players.map((player, index) => (
                  <li key={index}>{player.name} ({player.role})</li>
                ))}
              </ul>
            </div>
            <div className="vs-text">VS</div>
            <div className="team-summary">
              <h4>{matchData.team2Name}</h4>
              <ul>
                {newTeam2.players.map((player, index) => (
                  <li key={index}>{player.name} ({player.role})</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="summary-section">
          <h3>Toss Information</h3>
          <div className="summary-grid">
            <div><strong>Toss Winner:</strong> {matchData.tossWinner}</div>
            <div><strong>Decision:</strong> {matchData.tossDecision}</div>
            {matchData.umpire1 && <div><strong>Umpire:</strong> {matchData.umpire1}</div>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="create-match-container">
      <div className="create-match-header">
        <h1>Create New Match</h1>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
      </div>

      {renderStepIndicator()}

      <div className="create-match-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      <div className="step-navigation">
        {currentStep > 1 && (
          <button onClick={handlePrevious} className="nav-btn secondary">
            Previous
          </button>
        )}
        {currentStep < 4 ? (
          <button
            onClick={handleNext}
            className="nav-btn primary"
            disabled={!validateCurrentStep()}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleCreateMatch}
            className="nav-btn primary"
            disabled={loading}
          >
            {loading ? 'Creating Match...' : 'Create Match'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateMatch;