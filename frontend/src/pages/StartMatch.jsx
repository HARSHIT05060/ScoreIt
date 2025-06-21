// Fixed StartMatch.js - Navigation issue resolved
import React, { useEffect, useState } from 'react';
import { Play, Users, Trophy, Clock, MapPin, RotateCcw } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const StartMatch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false); // Separate loading state for start button

  // Configure axios interceptors for authentication
  useEffect(() => {
    const setupAxiosInterceptors = () => {
      // Request interceptor to add auth token
      axios.interceptors.request.use(
        (config) => {
          const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
          const token = userData.token;

          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }

          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Response interceptor to handle common errors
      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            // Handle unauthorized access
            sessionStorage.removeItem('user');
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      );
    };

    setupAxiosInterceptors();
  }, []);

  // Fetch match data from API
  useEffect(() => {
    const fetchMatch = async () => {
      if (!id) {
        setError('Match ID is missing');
        setLoading(false);
        return;
      }

      try {
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
        const token = userData.token;

        if (!token) {
          throw new Error('Authentication token not found. Please login again.');
        }

        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/matches/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        console.log("Match Start Response:", response.data);

        if (response.data && response.data.match) {
          setMatch(response.data.match);
        } else if (response.data && response.data._id) {
          setMatch(response.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching match:', err);
        handleFetchError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [id]);

  // Helper function to handle fetch errors
  const handleFetchError = (err) => {
    if (err.code === 'ECONNABORTED') {
      setError('Request timeout. Please check your connection and try again.');
    } else if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
      setError('Cannot connect to server. Make sure the backend is running on port 5000.');
    } else if (err.response) {
      const status = err.response.status;
      const message = err.response.data?.message || err.response.data?.error;

      switch (status) {
        case 401:
          setError('Unauthorized access. Please login first.');
          break;
        case 404:
          setError(`Match with ID "${id}" not found.`);
          break;
        case 500:
          setError('Server error. Please try again later.');
          break;
        default:
          setError(message || `Server error (${status}). Please try again.`);
      }
    } else {
      setError(err.message || 'Failed to load match data');
    }
  };

  // Helper functions
  const getTeamName = (team) => {
    return team?.name?.name || team?.name || 'Unknown Team';
  };

  const getTossWinnerName = () => {
    if (!match?.tossWinner) return 'Unknown';

    const teamAId = match.teamA?.name?._id || match.teamA?._id;
    const teamBId = match.teamB?.name?._id || match.teamB?._id;
    const tossWinnerId = match.tossWinner._id || match.tossWinner;

    if (tossWinnerId === teamAId) {
      return getTeamName(match.teamA);
    } else if (tossWinnerId === teamBId) {
      return getTeamName(match.teamB);
    }

    return match.tossWinner.name || 'Unknown';
  };

  const handleStartMatch = async () => {
    if (!match) {
      setError('Match data not available');
      return;
    }

    try {
      setStarting(true);
      setError('');

      const teamAId = match.teamA?.name?._id || match.teamA?._id;
      const teamBId = match.teamB?.name?._id || match.teamB?._id;
      const tossWinnerId = match.tossWinner?._id || match.tossWinner;

      // Validate required data
      if (!teamAId || !teamBId || !tossWinnerId) {
        throw new Error('Missing team or toss winner information');
      }

      const isTeamA_TossWinner = tossWinnerId === teamAId;

      const battingTeamId = isTeamA_TossWinner
        ? (match.tossDecision === 'Bat' ? teamAId : teamBId)
        : (match.tossDecision === 'Bat' ? teamBId : teamAId);

      const bowlingTeamId = battingTeamId === teamAId ? teamBId : teamAId;

      const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
      const token = userData.token;

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      console.log('Starting match with data:', {
        matchId: match._id,
        battingTeamId,
        bowlingTeamId,
        oversLimit: match.overs
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/matches/start/${match._id}`,
        {
          id: match._id,
          battingTeamId,
          bowlingTeamId,
          oversLimit: match.overs,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // Increased timeout for match start
        }
      );

      console.log('Start match response:', response.data);

      // Check for successful response
      if (response.data && (response.data.success || response.status === 200)) {
        console.log('Match started successfully, navigating to scoring...');
        // Add a small delay to ensure state is updated
        setTimeout(() => {
          navigate(`/scoring/${id}`, { replace: true });
        }, 100);
      } else {
        throw new Error(response.data?.message || 'Failed to start match - invalid response');
      }
    } catch (err) {
      console.error('Error starting match:', err);
      handleStartError(err);
    } finally {
      setStarting(false);
    }
  };

  // Helper function to handle start match errors
  const handleStartError = (err) => {
    if (err.code === 'ECONNABORTED') {
      setError('Request timeout. Please try again.');
    } else if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
      setError('Cannot connect to server. Please try again later.');
    } else if (err.response) {
      const message = err.response.data?.message || err.response.data?.error;
      const status = err.response.status;

      switch (status) {
        case 400:
          setError(message || 'Invalid match data. Please check match details.');
          break;
        case 401:
          setError('Unauthorized. Please login again.');
          break;
        case 404:
          setError('Match not found. Please check the match ID.');
          break;
        case 409:
          setError(message || 'Match has already been started.');
          break;
        case 500:
          setError('Server error. Please try again later.');
          break;
        default:
          setError(message || `Server error (${status}). Please try again.`);
      }
    } else {
      setError(err.message || 'Failed to start match');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Loading match data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p className="text-red-600 font-semibold mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No match data
  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">No match data found</p>
        </div>
      </div>
    );
  }

  // Main match interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
              <h1 className="text-3xl font-bold mb-2">{match.matchName}</h1>
              <div className="flex items-center gap-4 text-green-100">
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {match.matchType}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {match.overs} Overs
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {match.location}
                </span>
              </div>
            </div>

            <div className="p-6">
              {/* Show error message if any */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <strong>Error:</strong> {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Teams */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Teams</h3>

                  <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500 rounded-full p-2">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800">Team A</h4>
                        <p className="text-blue-600">{getTeamName(match.teamA)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-2">
                    <span className="bg-gray-200 text-gray-600 px-4 py-1 rounded-full text-sm font-medium">VS</span>
                  </div>

                  <div className="bg-orange-50 rounded-xl p-4 border-l-4 border-orange-500">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-500 rounded-full p-2">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-800">Team B</h4>
                        <p className="text-orange-600">{getTeamName(match.teamB)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Details */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Match Details</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Date</span>
                      <span className="font-semibold">{formatDate(match.date)}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Toss Winner</span>
                      <span className="font-semibold text-green-600">{getTossWinnerName()}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Decision</span>
                      <span className="font-semibold">{match.tossDecision}</span>
                    </div>

                    {match.umpire && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Umpire</span>
                        <div className="text-right">
                          <p className="font-semibold">{match.umpire.name}</p>
                          <p className="text-sm text-gray-500">{match.umpire.contact}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Start Match Button */}
              <div className="text-center">
                <button
                  onClick={handleStartMatch}
                  disabled={starting}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 mx-auto"
                >
                  <Play className="w-6 h-6" />
                  {starting ? 'Starting Match...' : 'Start Match'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartMatch;