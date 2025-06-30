import React, { useEffect, useState } from 'react';
import { Users, RotateCcw, Undo, Trophy, Target, Clock, ArrowLeft } from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

// Notification Component
const Notification = ({ notification, onClose }) => {
  const { id, type, title, message, duration = 5000 } = notification;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`flex items-start p-4 mb-3 rounded-lg border ${getBgColor()} shadow-lg animate-slide-in`}>
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {title}
          </p>
        )}
        <p className="text-sm text-gray-700">
          {message}
        </p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-gray-200 transition-colors"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "warning" }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-8 h-8 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  const getConfirmButtonColor = () => {
    switch (type) {
      case 'error':
      case 'warning':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10">
              {getIcon()}
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {message}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${getConfirmButtonColor()}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Provider Hook
const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { ...notification, id }]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
};


const ScoringComponent = () => {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const { notifications, addNotification, removeNotification } = useNotifications();
  // eslint-disable-next-line no-unused-vars
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [showForceNavigateModal, setShowForceNavigateModal] = useState(false);


  // Match state
  const [currentInnings, setCurrentInnings] = useState(1);
  const [currentBall, setCurrentBall] = useState(0);
  const [currentOver, setCurrentOver] = useState(1);
  const [currentRuns, setCurrentRuns] = useState(0);
  const [currentWickets, setCurrentWickets] = useState(0);
  const [overBalls, setOverBalls] = useState([]);
  const [ballHistory, setBallHistory] = useState([]);
  const [overHandled, setOverHandled] = useState(false);


  // Player states
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [currentBowler, setCurrentBowler] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [availablePlayers, setAvailablePlayers] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [battingLineup, setBattingLineup] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [bowlingLineup, setBowlingLineup] = useState([]);
  const [nextBatsmanIndex, setNextBatsmanIndex] = useState(2); // Start from 3rd batsman (index 2)
  const [outPlayers, setOutPlayers] = useState([]); // Track dismissed players
  const [showBowlerModal, setShowBowlerModal] = useState(false);

  // Innings tracking
  const [firstInningsScore, setFirstInningsScore] = useState(0);
  const [firstInningsWickets, setFirstInningsWickets] = useState(0);
  const [firstInningsOvers, setFirstInningsOvers] = useState(0);
  const [target, setTarget] = useState(0);

  // Extras tracking
  const [extras, setExtras] = useState({
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    total: 0
  });

  // Over tracking
  const [overHistory, setOverHistory] = useState([]);
  const [currentOverRuns, setCurrentOverRuns] = useState(0);

  // Modal states
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showLineupModal, setShowLineupModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'striker', 'bowler', 'lineup'
  const [matchResult, setMatchResult] = useState(null);

  // Configure axios interceptors for authentication
  useEffect(() => {
    const setupAxiosInterceptors = () => {
      axios.interceptors.request.use(
        (config) => {
          const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
          const token = userData.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            sessionStorage.removeItem('user');
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      );
    };

    setupAxiosInterceptors();
  }, []);

  // Fetch match data and initialize players
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

        console.log("Match Scoring Body:", response.data);

        let matchData;
        if (response.data && response.data.match) {
          matchData = response.data.match;
        } else if (response.data && response.data._id) {
          matchData = response.data;
        } else {
          throw new Error('Invalid response format');
        }

        setMatch(matchData);

        // Initialize available players from both teams
        const teamAPlayers = matchData.teamA?.players || [];
        const teamBPlayers = matchData.teamB?.players || [];
        setAvailablePlayers([...teamAPlayers, ...teamBPlayers]);

        // Initialize innings if not present
        if (!matchData.innings || matchData.innings.length === 0) {
          await initializeMatch(matchData);
        } else {
          // Load existing match state
          loadMatchState(matchData);
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


  useEffect(() => {
    // Automatically trigger over completion when 6 balls have been bowled
    if (overBalls.length === 6 && !overHandled) {
      setOverHandled(true);
      handleEndOver();
      console.log("Triggering bowler modal after over end");

    }
    console.log("Current Over Balls:", overBalls);

    // Reset for next over
    if (overBalls.length < 6 && overHandled) {
      setOverHandled(false);
    }
  }, [overBalls]);



  useEffect(() => {
    if (match && !loading && !striker && !nonStriker && !currentBowler) {
      // Automatically show lineup modal when match loads without players set
      setModalType('lineup');
      setShowLineupModal(true);
    }
  }, [match, loading, striker, nonStriker, currentBowler]);

  // const debugPlayerData = () => {
  //   console.log('Match data:', match);
  //   console.log('Team A players:', match?.teamA?.players);
  //   console.log('Team B players:', match?.teamB?.players);
  //   console.log('Available players:', availablePlayers);
  //   console.log('Batting team players:', getBattingTeamPlayers());
  //   console.log('Bowling team players:', getBowlingTeamPlayers());
  // };
  const getPlayerNameById = (players, id) => {
    const found = players.find(p => p._id === id);
    return found?.name || id;
  };

  const initializeMatch = async (matchData) => {
    try {
      // Initialize first innings
      const battingTeamId = getBattingTeamId(1);
      const bowlingTeamId = getBowlingTeamId(1);

      const battingPlayers = battingTeamId === matchData.teamA.name._id ?
        matchData.teamA.players : matchData.teamB.players;
      const bowlingPlayers = bowlingTeamId === matchData.teamA.name._id ?
        matchData.teamA.players : matchData.teamB.players;

      setBattingLineup(battingPlayers);
      setBowlingLineup(bowlingPlayers);

      // Show lineup modal to set initial players
      setModalType('lineup');
      setShowLineupModal(true);

    } catch (err) {
      console.error('Error initializing match:', err);
    }
  };

  const loadMatchState = (matchData) => {
    const currentInningsData = matchData.innings?.[currentInnings - 1];
    if (currentInningsData) {
      setCurrentRuns(currentInningsData.totalRuns || 0);
      setCurrentWickets(currentInningsData.totalWickets || 0);
      setCurrentOver(Math.floor(currentInningsData.totalBalls / 6) + 1);
      setCurrentBall((currentInningsData.totalBalls % 6) + 1);
      setStriker(currentInningsData.currentStriker || '');
      setNonStriker(currentInningsData.currentNonStriker || '');
      setCurrentBowler(currentInningsData.currentBowler || '');
      setExtras(currentInningsData.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 });
    }

    // Load first innings data if in second innings
    if (currentInnings === 2 && matchData.innings?.[0]) {
      const firstInnings = matchData.innings[0];
      setFirstInningsScore(firstInnings.totalRuns || 0);
      setFirstInningsWickets(firstInnings.totalWickets || 0);
      setFirstInningsOvers(firstInnings.totalOvers || 0);
      // FIXED: Target should be first innings score + 1 (runs needed to win)
      setTarget((firstInnings.totalRuns || 0) + 1);
    }
  };


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

  const getBattingTeamId = (innings) => {
    if (!match) return null;
    const teamAId = match.teamA?.name?._id || match.teamA?._id;
    const tossWinnerId = match.tossWinner?._id;
    const isTeamATossWinner = tossWinnerId === teamAId;

    if (innings === 1) {
      return isTeamATossWinner
        ? (match.tossDecision === 'Bat' ? teamAId : match.teamB?.name?._id || match.teamB?._id)
        : (match.tossDecision === 'Bat' ? match.teamB?.name?._id || match.teamB?._id : teamAId);
    } else {
      return isTeamATossWinner
        ? (match.tossDecision === 'Bat' ? match.teamB?.name?._id || match.teamB?._id : teamAId)
        : (match.tossDecision === 'Bat' ? teamAId : match.teamB?.name?._id || match.teamB?._id);
    }
  };

  const getBowlingTeamId = (innings) => {
    const battingTeamId = getBattingTeamId(innings);
    const teamAId = match.teamA?.name?._id || match.teamA?._id;
    const teamBId = match.teamB?.name?._id || match.teamB?._id;
    return battingTeamId === teamAId ? teamBId : teamAId;
  };

  const getBattingTeam = () => {
    if (!match) return 'Unknown Team';
    const battingTeamId = getBattingTeamId(currentInnings);
    const teamAId = match.teamA?.name?._id || match.teamA?._id;
    return battingTeamId === teamAId ? getTeamName(match.teamA) : getTeamName(match.teamB);
  };

  const getBowlingTeam = () => {
    if (!match) return 'Unknown Team';
    const bowlingTeamId = getBowlingTeamId(currentInnings);
    const teamAId = match.teamA?.name?._id || match.teamA?._id;
    return bowlingTeamId === teamAId ? getTeamName(match.teamA) : getTeamName(match.teamB);
  };

  const getBattingTeamPlayers = () => {
    if (!match) return [];

    const battingTeamId = getBattingTeamId(currentInnings);
    const teamAId = match.teamA?.name?._id || match.teamA?._id;

    const battingTeam = battingTeamId === teamAId ? match.teamA : match.teamB;
    const players = battingTeam?.players || [];

    console.log('Batting team players:', players); // Debug log

    // Convert string array to object array for consistency
    return players.map((player, index) => {
      if (typeof player === 'string') {
        return {
          _id: `${battingTeamId}_${index}`,
          name: player,
          role: 'Player'
        };
      }
      return player;
    });
  };

  const getBowlingTeamPlayers = () => {
    if (!match) return [];

    const bowlingTeamId = getBowlingTeamId(currentInnings);
    const teamAId = match.teamA?.name?._id || match.teamA?._id;

    const bowlingTeam = bowlingTeamId === teamAId ? match.teamA : match.teamB;
    const players = bowlingTeam?.players || [];

    console.log('Bowling team players:', players); // Debug log

    // Convert string array to object array for consistency
    return players.map((player, index) => {
      if (typeof player === 'string') {
        return {
          _id: `${bowlingTeamId}_${index}`,
          name: player,
          role: 'Player'
        };
      }
      return player;
    });
  };

  // Calculate required run rate
  const getRequiredRunRate = () => {
    if (currentInnings !== 2 || target === 0) return 0;
    const remainingRuns = target - currentRuns;
    const remainingBalls = (match.overs * 6) - ((currentOver - 1) * 6 + (currentBall - 1));
    const remainingOvers = remainingBalls / 6;
    return remainingOvers > 0 ? (remainingRuns / remainingOvers).toFixed(2) : 0;
  };

  // Calculate current run rate
  const getCurrentRunRate = () => {
    const totalBalls = (currentOver - 1) * 6 + (currentBall - 1);
    const totalOvers = totalBalls / 6;
    return totalOvers > 0 ? (currentRuns / totalOvers).toFixed(2) : 0;
  };

  // Check if match should end
  const checkMatchEnd = () => {
    const totalBalls = (currentOver - 1) * 6 + (currentBall - 1);
    const maxBalls = match.overs * 6;

    // PRIORITY CHECK: Target achieved in second innings (this should be checked first)
    if (currentInnings === 2 && currentRuns >= target) {
      return 'target_achieved';
    }

    // Check if overs completed
    if (totalBalls >= maxBalls) {
      return 'overs_completed';
    }

    // Check if all wickets fallen (assuming 10 wickets max)
    if (currentWickets >= 10) {
      return 'all_out';
    }

    return null;
  };

  // Determine match result
  const determineMatchResult = () => {
    if (currentInnings === 1) {
      // First innings completed
      setFirstInningsScore(currentRuns);
      setFirstInningsWickets(currentWickets);
      setFirstInningsOvers(currentOver - 1 + (currentBall - 1) / 6);
      setTarget(currentRuns + 1); // Target for second team
      return null;
    } else {
      // Second innings completed
      const battingTeam = getBattingTeam();
      const bowlingTeam = getBowlingTeam();

      if (currentRuns >= target) {
        // Batting team won
        return {
          winner: battingTeam,
          result: `${battingTeam} won by ${10 - currentWickets} wickets`,
          margin: `${10 - currentWickets} wickets`
        };
      } else {
        // Bowling team won (first batting team)
        const runsDifference = target - currentRuns - 1;
        return {
          winner: bowlingTeam,
          result: `${bowlingTeam} won by ${runsDifference} runs`,
          margin: `${runsDifference} runs`
        };
      }
    }
  };

  // Save match data to backend
  const saveMatchData = async (scoreData) => {
    try {
      const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
      const token = userData.token;
      const completeScoreData = {
        ...scoreData,
        currentBowler: currentBowler, // Make sure currentBowler is included
      };
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/matches/${id}/score`, completeScoreData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.error('Error saving match data:', err);
    }
  };

  const swapStrikers = () => {
    const temp = striker;
    setStriker(nonStriker);
    setNonStriker(temp);
  };

  const recordBallInHistory = () => {
    if (!currentBowler) {
      addNotification({
        type: 'warning',
        title: 'Bowler Required',
        message: 'Please select a bowler first before recording this ball.',
        duration: 4000
      });
      return;
    }
    setBallHistory(prev => [...prev, {
      runsBeforeThisBall: currentRuns,
      wicketsBeforeThisBall: currentWickets,
      ballBeforeThisBall: currentBall,
      overBeforeThisBall: currentOver,
      overBallsBeforeThisBall: [...overBalls],
      extrasBeforeThisBall: { ...extras },
      currentOverRunsBeforeThisBall: currentOverRuns
    }]);
  };

  const handleUndo = () => {
    if (ballHistory.length === 0) {
      addNotification({
        type: 'info',
        title: 'No History',
        message: 'No balls to undo. The ball history is empty.',
        duration: 3000
      });
      return;
    }

    const lastBall = ballHistory[ballHistory.length - 1];

    setCurrentRuns(lastBall.runsBeforeThisBall);
    setCurrentWickets(lastBall.wicketsBeforeThisBall);
    setCurrentBall(lastBall.ballBeforeThisBall);
    setCurrentOver(lastBall.overBeforeThisBall);
    setOverBalls(lastBall.overBallsBeforeThisBall);
    setExtras(lastBall.extrasBeforeThisBall);
    setCurrentOverRuns(lastBall.currentOverRunsBeforeThisBall);

    setBallHistory(prev => prev.slice(0, -1));

    const scoreData = {
      innings: currentInnings,
      runs: lastBall.runsBeforeThisBall,
      wickets: lastBall.wicketsBeforeThisBall,
      overs: lastBall.overBeforeThisBall,
      balls: lastBall.ballBeforeThisBall,
      overBalls: lastBall.overBallsBeforeThisBall,
      striker,
      nonStriker,
      currentBowler,
      extras: lastBall.extrasBeforeThisBall,
      action: 'undo'
    };
    saveMatchData(scoreData);
  };

  const handleOverCompletion = () => {
    setOverHistory(prev => [...prev, { over: currentOver, runs: currentOverRuns, balls: overBalls }]);

    const newOver = currentOver + 1;

    setCurrentOver(newOver);
    setCurrentBall(1);
    setOverBalls([]);
    setCurrentOverRuns(0);

    // Show over completion notification
    addNotification({
      type: 'info',
      title: 'Over Completed',
      message: `Over ${currentOver} completed. ${currentOverRuns} runs scored.`,
      duration: 4000
    });

    // Swap strikers after over completion
    setTimeout(() => {
      swapStrikers();
    }, 0);

    const scoreData = {
      innings: currentInnings,
      runs: currentRuns,
      wickets: currentWickets,
      overs: newOver,
      balls: 1,
      overBalls: [],
      striker: nonStriker, // Will be the new striker
      nonStriker: striker, // Will be the new non-striker
      currentBowler,
      extras,
      lastBall: {
        type: 'end_over',
        ball: `${currentOver}.6`
      }
    };
    saveMatchData(scoreData);

    // Check if innings should end due to overs completion
    if (newOver > match.overs) {
      addNotification({
        type: 'success',
        title: 'Innings Complete',
        message: `All ${match.overs} overs have been bowled. Innings ending.`,
        duration: 5000
      });
      handleEndInnings();
      return;
    }

    setModalType('bowler');
    setShowBowlerModal(true);
  };

  const handleScoring = (runs) => {
    if (!currentBowler) {
      // Replace alert with notification
      addNotification({
        type: 'warning',
        title: 'Bowler Required',
        message: 'Please select a bowler first before scoring runs.',
        duration: 4000
      });
      return;
    }

    recordBallInHistory();

    const newRuns = currentRuns + runs;
    const newOverBalls = [...overBalls, runs];
    const newOverRuns = currentOverRuns + runs;

    setCurrentRuns(newRuns);
    setOverBalls(newOverBalls);
    setCurrentOverRuns(newOverRuns);


    // IMMEDIATE CHECK: If target achieved, end match immediately
    if (currentInnings === 2 && newRuns >= target) {
      // Show target achieved notification
      addNotification({
        type: 'success',
        title: 'Target Achieved!',
        message: `Target of ${target} runs reached! Match won!`,
        duration: 6000
      });

      // Update state first
      setTimeout(() => {
        const result = determineMatchResult();
        if (result) {
          setMatchResult(result);
          setShowResultModal(true);
        }
      }, 100);

      // Save final score
      const scoreData = {
        innings: currentInnings,
        runs: newRuns,
        wickets: currentWickets,
        overs: currentOver,
        balls: currentBall + 1,
        overBalls: newOverBalls,
        striker,
        nonStriker,
        currentBowler,
        extras,
        lastBall: {
          type: 'winning_run',
          runs: runs,
          ball: `${currentOver}.${currentBall}`,
          bowler: currentBowler
        }
      };
      saveMatchData(scoreData);
      return; // Exit immediately, don't continue with normal ball processing
    }

    // Swap strikers on odd runs
    if (runs % 2 === 1) {
      setTimeout(() => {
        swapStrikers();
      }, 0);
    }

    let newBall = currentBall + 1;
    let newOver = currentOver;

    // Check if over is complete (6 balls bowled)
    if (newBall > 6) {
      handleOverCompletion();
      return; // Exit early as handleOverCompletion will handle the rest
    }

    setCurrentBall(newBall);

    // Check for other match end conditions after updating state
    setTimeout(() => {
      const matchEndReason = checkMatchEnd();
      if (matchEndReason && matchEndReason !== 'target_achieved') {
        const result = determineMatchResult();
        if (result) {
          setMatchResult(result);
          setShowResultModal(true);
        } else if (currentInnings === 1) {
          handleEndInnings();
          return;
        }
      }
    }, 0);

    const scoreData = {
      innings: currentInnings,
      runs: newRuns,
      wickets: currentWickets,
      overs: newOver,
      balls: newBall,
      overBalls: newOverBalls,
      striker,
      nonStriker,
      currentBowler,
      extras,
      lastBall: {
        type: 'run',
        runs: runs,
        ball: `${newOver}.${newBall - 1}`,
        bowler: currentBowler
      }
    };
    saveMatchData(scoreData);
  };

  const handleWicket = () => {
    if (!currentBowler) {
      // Replace alert with notification
      addNotification({
        type: 'warning',
        title: 'Bowler Required',
        message: 'Please select a bowler first before recording a wicket.',
        duration: 4000
      });
      return;
    }

    recordBallInHistory();

    const newWickets = currentWickets + 1;
    const newOverBalls = [...overBalls, 'W'];

    setCurrentWickets(newWickets);
    setOverBalls(newOverBalls);


    // Add dismissed player to out players list
    setOutPlayers(prev => [...prev, striker]);

    let newBall = currentBall + 1;
    let newOver = currentOver;
    let overComplete = false;

    // Check if over is complete (6 balls bowled)
    if (newBall > 6) {
      overComplete = true;
      newBall = 1;
      newOver = currentOver + 1;
      handleOverCompletion();
    } else {
      setCurrentBall(newBall);
    }

    const scoreData = {
      innings: currentInnings,
      runs: currentRuns,
      wickets: newWickets,
      overs: newOver,
      balls: newBall,
      overBalls: newOverBalls,
      striker,
      nonStriker,
      currentBowler,
      extras,
      lastBall: {
        type: 'wicket',
        ball: `${currentOver}.${currentBall}`
      }
    };
    saveMatchData(scoreData);

    const battingPlayers = getBattingTeamPlayers();
    if (newWickets >= 10 || nextBatsmanIndex >= battingPlayers.length) {
      setTimeout(() => {
        const result = determineMatchResult();
        if (result) {
          setMatchResult(result);
          setShowResultModal(true);
        } else if (currentInnings === 1) {
          handleEndInnings();
        }
      }, 100);
      return;
    }

    // Check for match end
    setTimeout(() => {
      const matchEndReason = checkMatchEnd();
      if (matchEndReason) {
        const result = determineMatchResult();
        if (result) {
          setMatchResult(result);
          setShowResultModal(true);
        } else if (currentInnings === 1) {
          handleEndInnings();
          return;
        }
      }
    }, 0);

    // Don't show striker modal if over is complete (bowler modal will show instead)
    if (!overComplete) {
      setModalType('striker');
      setShowPlayerModal(true);
    }
  };

  const handleExtra = (extraType, runs = 1) => {
      if (!currentBowler) {
        addNotification({
          type: 'warning',
          title: 'Bowler Required',
          message: 'Please select a bowler first before recording extras.',
          duration: 4000
        });
        return;
      }

      recordBallInHistory();

      // Show extras notification
      const extraTypeNames = {
        'wide': 'Wide Ball',
        'noball': 'No Ball',
        'bye': 'Bye',
        'legbye': 'Leg Bye'
      };

      addNotification({
        type: 'info',
        title: extraTypeNames[extraType] || 'Extra',
        message: `${extraTypeNames[extraType]} - ${runs + 1} runs added to total`,
        duration: 3000
      });

      const newRuns = currentRuns + runs;
      const newOverBalls = [...overBalls, extraType];
      const newOverRuns = currentOverRuns + runs;
      const newExtras = { ...extras };

      // Update extras count
      switch (extraType) {
        case 'Wide':
          newExtras.wides++;
          break;
        case 'No Ball':
          newExtras.noBalls++;
          break;
        case 'Bye':
          newExtras.byes++;
          break;
        case 'Leg Bye':
          newExtras.legByes++;
          break;
      }
      newExtras.total++;

      setCurrentRuns(newRuns);
      setOverBalls(newOverBalls);
      setCurrentOverRuns(newOverRuns);
      setExtras(newExtras);

      // IMMEDIATE CHECK: If target achieved, end match immediately
      if (currentInnings === 2 && newRuns >= target) {
        setTimeout(() => {
          const result = determineMatchResult();
          if (result) {
            setMatchResult(result);
            setShowResultModal(true);
          }
        }, 100);

        // Save final score
        const scoreData = {
          innings: currentInnings,
          runs: newRuns,
          wickets: currentWickets,
          overs: currentOver,
          balls: currentBall,
          overBalls: newOverBalls,
          striker,
          nonStriker,
          currentBowler,
          extras: newExtras,
          lastBall: {
            type: 'winning_extra',
            extraType: extraType,
            runs: runs,
            ball: `${currentOver}.${currentBall}`
          }
        };
        saveMatchData(scoreData);
        return; // Exit immediately
      }

      // Continue with normal extra processing...
      // Bye and Leg Bye count as balls, Wide and No Ball don't
      if (extraType === 'Bye' || extraType === 'Leg Bye') {
        let newBall = currentBall + 1;
        let newOver = currentOver;

        // Check if over is complete
        if (newBall > 6) {
          handleOverCompletion();
          return;
        } else {
          setCurrentBall(newBall);
        }

        const scoreData = {
          innings: currentInnings,
          runs: newRuns,
          wickets: currentWickets,
          overs: newOver,
          balls: newBall,
          overBalls: newOverBalls,
          striker,
          nonStriker,
          currentBowler,
          extras: newExtras,
          lastBall: {
            type: 'extra',
            extraType: extraType,
            runs: runs,
            ball: `${newOver}.${newBall - 1}`
          }
        };
        saveMatchData(scoreData);
      } else {
        // Wide and No Ball - ball doesn't count
        const scoreData = {
          innings: currentInnings,
          runs: newRuns,
          wickets: currentWickets,
          overs: currentOver,
          balls: currentBall,
          overBalls: newOverBalls,
          striker,
          nonStriker,
          currentBowler,
          extras: newExtras,
          lastBall: {
            type: 'extra',
            extraType: extraType,
            runs: runs,
            ball: `${currentOver}.${currentBall}`
          }
        };
        saveMatchData(scoreData);
      }

      // Check for other match end conditions
      setTimeout(() => {
        const matchEndReason = checkMatchEnd();
        if (matchEndReason && matchEndReason !== 'target_achieved') {
          const result = determineMatchResult();
          if (result) {
            setMatchResult(result);
            setShowResultModal(true);
          }
        }
      }, 0);
    };

    const handleEndOver = () => {
      recordBallInHistory();

      setOverHistory(prev => [...prev, { over: currentOver, runs: currentOverRuns, balls: overBalls }]);
      const newOver = currentOver + 1;
      setCurrentOver(newOver);
      setCurrentBall(1);
      setOverBalls([]);
      setCurrentOverRuns(0);
      swapStrikers();

      const scoreData = {
        innings: currentInnings,
        runs: currentRuns,
        wickets: currentWickets,
        overs: newOver,
        balls: 1,
        overBalls: [],
        striker,
        nonStriker,
        currentBowler,
        extras,
        lastBall: {
          type: 'end_over',
          ball: `${newOver - 1}.6`
        }
      };
      saveMatchData(scoreData);

      // Show bowler selection modal for new over
      setModalType('bowler');
      setShowBowlerModal(true);

      // Check if innings should end due to overs completion
      if (newOver > match.overs) {
        handleEndInnings();
      }
    };

    const handleEndInnings = () => {
      if (currentInnings === 1) {
        // Save first innings data
        const finalScore = currentRuns;
        const finalWickets = currentWickets;
        const finalOvers = currentOver - 1 + (currentBall - 1) / 6;

        setFirstInningsScore(finalScore);
        setFirstInningsWickets(finalWickets);
        setFirstInningsOvers(finalOvers);
        // FIXED: Set correct target
        setTarget(finalScore + 1);

        // Reset for second innings
        setCurrentInnings(2);
        setCurrentRuns(0);
        setCurrentWickets(0);
        setCurrentOver(1);
        setCurrentBall(1);
        setOverBalls([]);
        setCurrentOverRuns(0);
        setBallHistory([]);
        setExtras({ wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 });

        const battingId = getBattingTeamId(2);
        const bowlingId = getBowlingTeamId(2);

        const newBattingLineup = battingId === match.teamA.name._id
          ? match.teamA.players
          : match.teamB.players;

        const newBowlingLineup = bowlingId === match.teamA.name._id
          ? match.teamA.players
          : match.teamB.players;

        setBattingLineup(newBattingLineup);
        setBowlingLineup(newBowlingLineup);
        setNextBatsmanIndex(2);
        setOutPlayers([]);

        // Clear current players
        setStriker('');
        setNonStriker('');
        setCurrentBowler('');

        // Show lineup modal again for new innings
        setModalType('lineup');
        setShowLineupModal(true);
      } else {
        // Match complete - determine final result
        const result = determineMatchResult();
        if (result) {
          setMatchResult(result);
        }
        setShowResultModal(true);
      }
    };

    const handlePlayerSelection = (playerId, playerName) => {
      if (modalType === 'striker') {
        setStriker(playerName);
        // Increment next batsman index
        setNextBatsmanIndex(prev => prev + 1);
      } else if (modalType === 'nonStriker') {
        setNonStriker(playerName);
      } else if (modalType === 'bowler') {
        setCurrentBowler(playerName);
      }
      setShowPlayerModal(false);
      setShowBowlerModal(false);
    };

    const getAvailableBatsmen = () => {
      const battingPlayers = getBattingTeamPlayers();
      return battingPlayers.filter(player => {
        const playerName = player.name;
        return playerName &&
          !outPlayers.includes(playerName) &&
          playerName !== striker &&
          playerName !== nonStriker;
      });
    };

    const getAvailableBowlers = () => {
      const bowlingPlayers = getBowlingTeamPlayers();
      return bowlingPlayers.filter(player => {
        const playerName = player.name;
        return playerName && playerName !== currentBowler;
      });
    };

    const handleLineupSetup = (selectedStriker, selectedNonStriker, selectedBowler) => {
      setStriker(selectedStriker);
      setNonStriker(selectedNonStriker);
      setCurrentBowler(selectedBowler);
      setShowLineupModal(false);

      // Save initial lineup to backend
      const scoreData = {
        innings: currentInnings,
        runs: currentRuns,
        wickets: currentWickets,
        overs: currentOver,
        balls: currentBall,
        striker: selectedStriker,
        nonStriker: selectedNonStriker,
        currentBowler: selectedBowler,
        extras: extras,
        lastBall: {
          type: 'lineup_set',
          innings: currentInnings
        }
      };
      saveMatchData(scoreData);
    };

    const handleResetClick = async () => {
      setShowResetConfirmModal(true);
    };

    const handleConfirmReset = async () => {
      setShowResetConfirmModal(false);

      try {
        // Show loading notification
        const loadingId = addNotification({
          type: 'info',
          title: 'Processing...',
          message: 'Completing match and saving data...',
          duration: 0 // Keep it until manually removed
        });

        // Update match status to "completed" using the existing score endpoint
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
        const token = userData.token;

        // Prepare final match data for completion
        const finalScoreData = {
          innings: currentInnings,
          runs: currentRuns,
          wickets: currentWickets,
          overs: currentOver,
          balls: currentBall, // Don't subtract 1 here for match completion
          overBalls: overBalls,
          striker,
          nonStriker,
          currentBowler,
          extras,
          status: 'completed',  // Changed from 'complete' to 'completed' for consistency
          finalResult: matchResult || {
            winner: null,
            result: 'Match completed manually',
            margin: 'N/A'
          },
          completedAt: new Date().toISOString(),
          lastBall: {
            type: 'match_completed',
            ball: `${currentOver}.${currentBall}`,
            runs: 0
          },
          action: 'complete_match'
        };

        console.log('Completing match with data:', finalScoreData);

        // Use the existing score endpoint to complete the match
        const response = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/api/matches/${id}/score`,
          finalScoreData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Remove loading notification
        removeNotification(loadingId);

        if (response.data.success) {
          console.log('Match completed successfully:', response.data);

          // Clear any local storage data related to this match
          sessionStorage.removeItem('currentMatchData');
          sessionStorage.removeItem(`match_${id}_data`);

          // Show success notification
          addNotification({
            type: 'success',
            title: 'Match Completed!',
            message: 'Match has been completed successfully and data has been saved.',
            duration: 4000
          });

          // Navigate to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          throw new Error('Failed to complete match');
        }
      } catch (error) {
        console.error('Error completing match:', error);

        let errorMessage = 'An unexpected error occurred';
        let errorTitle = 'Match Completion Failed';

        if (error.response) {
          // Server responded with error status
          console.error('Server error:', error.response.data);
          errorMessage = error.response.data.message || 'Server error occurred';
        } else if (error.request) {
          // Request was made but no response received
          console.error('Network error:', error.request);
          errorMessage = 'Network error: Could not reach server. Please check your connection.';
        } else {
          // Something else happened
          console.error('Error:', error.message);
          errorMessage = error.message;
        }

        // Show error notification
        addNotification({
          type: 'error',
          title: errorTitle,
          message: errorMessage,
          duration: 6000
        });

        // Ask user if they want to navigate anyway after a delay
        setTimeout(() => {
          setShowForceNavigateModal(true);
        }, 2000);
      }
    };

    // Add this for the force navigate option

    const handleForceNavigate = () => {
      setShowForceNavigateModal(false);
      addNotification({
        type: 'warning',
        title: 'Navigating to Dashboard',
        message: 'Returning to dashboard. Match data may not be saved.',
        duration: 3000
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    };


    const resetMatch = async () => {

      try {
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
        const userToken = userData.token;
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/matches/reset/${id}`, {}, {
          headers: {
            Authorization: `Bearer ${userToken}`  // Replace with your actual token
          }
        });
        // Reset all states to initial values
        setCurrentInnings(1);
        setCurrentBall(1);
        setCurrentOver(1);
        setCurrentRuns(0);
        setCurrentWickets(0);
        setOverBalls([]);
        setBallHistory([]);
        setStriker('');
        setNonStriker('');
        setCurrentBowler('');
        setFirstInningsScore(0);
        setFirstInningsWickets(0);
        setFirstInningsOvers(0);
        setTarget(0);
        setExtras({ wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 });
        setOverHistory([]);
        setCurrentOverRuns(0);
        setMatchResult(null);
        setShowResultModal(false);
        // Reset new states
        setNextBatsmanIndex(2);
        setOutPlayers([]);
        setShowBowlerModal(false);

        // Show lineup modal to restart match
        setModalType('lineup');
        setShowLineupModal(true);
      } catch (err) {
        console.error('Failed to reset match:', err);
      }
    };


    // Render ball bubble for over tracker
    const renderBallBubble = (ball, index) => {
      const isWicket = ball === 'W';
      const isExtra = ['Wide', 'No Ball', 'Bye', 'Leg Bye'].includes(ball);
      const isBoundary = ball === 4 || ball === 6;

      let bubbleClass = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ";

      if (isWicket) {
        bubbleClass += "bg-red-500 text-white border-red-600";
      } else if (isBoundary) {
        bubbleClass += ball === 6 ? "bg-green-500 text-white border-green-600" : "bg-blue-500 text-white border-blue-600";
      } else if (isExtra) {
        bubbleClass += "bg-purple-500 text-white border-purple-600";
      } else if (ball === 0) {
        bubbleClass += "bg-gray-400 text-white border-gray-500";
      } else {
        bubbleClass += "bg-yellow-400 text-gray-800 border-yellow-500";
      }

      return (
        <div key={index} className={bubbleClass}>
          {isExtra ? ball.charAt(0) : ball === 'W' ? '●' : ball}
        </div>
      );
    };

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
    if (error) {
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

    if (!match) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">No match data found</p>
          </div>
        </div>
      );
    }

    const LineupModal = ({
      isOpen,
      onClose,
      battingPlayers,
      bowlingPlayers,
      onConfirm,
      currentInnings,
      battingTeam,
      bowlingTeam
    }) => {
      const [selectedStriker, setSelectedStriker] = useState('');
      const [selectedNonStriker, setSelectedNonStriker] = useState('');
      const [selectedBowler, setSelectedBowler] = useState('');

      const handleConfirm = () => {
        if (selectedStriker && selectedNonStriker && selectedBowler) {
          onConfirm(selectedStriker, selectedNonStriker, selectedBowler);
        }
      };

      if (!isOpen) return null;

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
              Setup Lineup - Innings {currentInnings}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Batting Team */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-green-700 mb-3">
                  {battingTeam} (Batting)
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Striker</label>
                  <select
                    value={selectedStriker}
                    onChange={(e) => setSelectedStriker(e.target.value)}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                  >
                    <option value="">Select Striker</option>
                    {battingPlayers.map((player) => (
                      <option key={player._id} value={player.name}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Non-Striker</label>
                  <select
                    value={selectedNonStriker}
                    onChange={(e) => setSelectedNonStriker(e.target.value)}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                  >
                    <option value="">Select Non-Striker</option>
                    {battingPlayers.filter(player => player.name !== selectedStriker).map((player) => (
                      <option key={player._id} value={player.name}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bowling Team */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-blue-700 mb-3">
                  {bowlingTeam} (Bowling)
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Opening Bowler</label>
                  <select
                    value={selectedBowler}
                    onChange={(e) => setSelectedBowler(e.target.value)}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="">Select Bowler</option>
                    {bowlingPlayers.map((player) => (
                      <option key={player._id} value={player.name}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={handleConfirm}
                disabled={!selectedStriker || !selectedNonStriker || !selectedBowler}
                className="w-full sm:flex-1 px-4 py-2 sm:py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Start{currentInnings === 1 ? 'Match' : 'Second Innings'}
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 sm:py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    };



    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-800">
                    {getTeamName(match?.teamA)} vs {getTeamName(match?.teamB)}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">{match?.format} Match - {match?.overs} Overs</p>
                </div>
              </div>
              <div className="flex space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex-1 sm:flex-none text-sm sm:text-base"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="xs:inline">Back</span>
                </button>
                <button
                  onClick={handleUndo}
                  disabled={ballHistory.length === 0}
                  className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex-1 sm:flex-none text-sm sm:text-base"
                >
                  <Undo className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Undo</span>
                </button>
                <button
                  onClick={resetMatch}
                  className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex-1 sm:flex-none text-sm sm:text-base"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Reset</span>
                </button>
              </div>
            </div>

            {/* Current Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-green-100 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-green-800 font-medium">Batting Team</p>
                    <p className="text-sm sm:text-lg font-bold text-green-900">{getBattingTeam()}</p>
                  </div>
                  <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-blue-100 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-blue-800 font-medium">Bowling Team</p>
                    <p className="text-sm sm:text-lg font-bold text-blue-900">{getBowlingTeam()}</p>
                  </div>
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-purple-100 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-purple-800 font-medium">Innings</p>
                    <p className="text-sm sm:text-lg font-bold text-purple-900">{currentInnings}/2</p>
                  </div>
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Scoring Area */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Score Display */}
            <div className="xl:col-span-1 order-1 xl:order-1">
              {/* Current Score */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Current Score</h2>
                <div className="text-center">
                  <div className="text-3xl sm:text-5xl font-bold text-green-600 mb-2">
                    {currentRuns}/{currentWickets}
                  </div>
                  <div className="text-lg sm:text-xl text-gray-600">
                    {currentOver - 1}.{currentBall - 1} overs
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-2">
                    Run Rate: {getCurrentRunRate()}
                  </div>
                </div>
              </div>

              {/* Target Info (Second Innings) */}
              {currentInnings === 2 && target > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Target Chase</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-bold text-red-600">{target}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Need:</span>
                      <span className="font-bold text-blue-600">{target - currentRuns} runs</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Required RR:</span>
                      <span className="font-bold text-purple-600">{getRequiredRunRate()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* First Innings Summary */}
              {currentInnings === 2 && (
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">First Innings</h2>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-700">
                      {firstInningsScore}/{firstInningsWickets}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {firstInningsOvers.toFixed(1)} overs
                    </div>
                  </div>
                </div>
              )}
              {/* Extras */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Extras ({extras.total})</h2>
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Wides:</span>
                    <span className="font-bold">{extras.wides}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>No Balls:</span>
                    <span className="font-bold">{extras.noBalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Byes:</span>
                    <span className="font-bold">{extras.byes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Leg Byes:</span>
                    <span className="font-bold">{extras.legByes}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column - Current Over & Players */}
            <div className="xl:col-span-1 order-3 xl:order-2">
              {/* Current Over */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
                  Over {currentOver} ({currentOverRuns} runs)
                </h2>
                <div className="flex flex-wrap gap-2 justify-center min-h-[60px] items-center">
                  {overBalls.map((ball, index) => renderBallBubble(ball, index))}
                  {/* Empty slots for remaining balls */}
                  {Array.from({ length: 6 - overBalls.length }, (_, index) => (
                    <div key={`empty-${index}`} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">{overBalls.length + index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Players */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Current Players</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-green-800 font-medium">Striker</p>
                      <p className="font-bold text-green-900 text-sm sm:text-base truncate">{striker || 'Not Selected'}</p>
                    </div>
                    <button
                      onClick={() => {
                        setModalType('striker');
                        setShowPlayerModal(true);
                      }}
                      className="px-2 sm:px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs sm:text-sm whitespace-nowrap ml-2"
                    >
                      Change
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-blue-800 font-medium">Non-Striker</p>
                      <p className="font-bold text-blue-900 text-sm sm:text-base truncate">{nonStriker || 'Not Selected'}</p>
                    </div>
                    <button
                      onClick={() => {
                        setModalType('nonStriker');
                        setShowPlayerModal(true);
                      }}
                      className="px-2 sm:px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm whitespace-nowrap ml-2"
                    >
                      Change
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-purple-800 font-medium">Bowler</p>
                      <p className="font-bold text-purple-900 text-sm sm:text-base truncate">{getPlayerNameById(getBowlingTeamPlayers(), currentBowler) || 'Not Selected'}</p>
                    </div>
                    <button
                      onClick={() => {
                        setModalType('bowler');
                        setShowPlayerModal(true);
                      }}
                      className="px-2 sm:px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs sm:text-sm whitespace-nowrap ml-2"
                    >
                      Change
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={swapStrikers}
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm sm:text-base"
                  >
                    Swap Strike
                  </button>
                </div>
              </div>

              {/* Over History */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-base sm:text-lg font-semibold mb-3 text-gray-800">
                  Current Over {currentOver - 1}.{currentBall - 1}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3 justify-center sm:justify-start">
                  {overBalls.map((ball, index) => renderBallBubble(ball, index))}
                  {/* Add empty circles for remaining balls in current over */}
                  {Array.from({ length: 6 - overBalls.length }, (_, index) => (
                    <div key={`empty-${index}`} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-gray-300 border-dashed"></div>
                  ))}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Over Runs: <span className="font-bold">{currentOverRuns}</span>
                </div>
              </div>

            </div>

            {/* Right Column - Scoring Buttons */}
            <div className="xl:col-span-1 order-2 xl:order-3">
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Scoring</h2>

                {/* Run Buttons */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3">Runs</h3>
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
                      <button
                        key={runs}
                        onClick={() => handleScoring(runs)}
                        className={`h-10 sm:h-12 rounded-lg font-bold text-sm sm:text-lg transition-colors ${runs === 0 ? 'bg-gray-400 hover:bg-gray-500 text-white' :
                          runs === 4 ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                            runs === 6 ? 'bg-green-500 hover:bg-green-600 text-white' :
                              'bg-yellow-400 hover:bg-yellow-500 text-gray-800'
                          }`}
                      >
                        {runs}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wicket Button */}
                <div className="mb-4 sm:mb-6">
                  <button
                    onClick={handleWicket}
                    className="w-full h-10 sm:h-12 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm sm:text-lg"
                  >
                    WICKET
                  </button>
                </div>

                {/* Extras */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3">Extras</h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      onClick={() => handleExtra('Wide')}
                      className="h-8 sm:h-10 bg-purple-400 hover:bg-purple-500 text-white rounded-lg font-medium text-xs sm:text-sm"
                    >
                      Wide
                    </button>
                    <button
                      onClick={() => handleExtra('No Ball')}
                      className="h-8 sm:h-10 bg-purple-400 hover:bg-purple-500 text-white rounded-lg font-medium text-xs sm:text-sm"
                    >
                      No Ball
                    </button>
                    <button
                      onClick={() => handleExtra('Bye')}
                      className="h-8 sm:h-10 bg-purple-400 hover:bg-purple-500 text-white rounded-lg font-medium text-xs sm:text-sm"
                    >
                      Bye
                    </button>
                    <button
                      onClick={() => handleExtra('Leg Bye')}
                      className="h-8 sm:h-10 bg-purple-400 hover:bg-purple-500 text-white rounded-lg font-medium text-xs sm:text-sm"
                    >
                      Leg Bye
                    </button>
                  </div>
                </div>
                {/* Over Management */}
                <div className="space-y-3">
                  <button
                    onClick={handleEndInnings}
                    className="w-full h-8 sm:h-10 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-xs sm:text-sm"
                  >
                    End Innings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Selection Modal */}
        {showPlayerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md lg:max-w-lg">
              <h2 className="text-lg sm:text-xl font-bold mb-4">
                Select {modalType === 'striker' ? 'New Batsman' : modalType === 'nonStriker' ? 'Non-Striker' : 'Bowler'}
              </h2>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {modalType === 'striker' ? (
                  getAvailableBatsmen().length > 0 ? (
                    getAvailableBatsmen().map((player, index) => (
                      <button
                        key={player._id || index}
                        onClick={() => handlePlayerSelection(player._id, player.name)}
                        className="w-full p-2 sm:p-3 text-left border rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-sm sm:text-base">{player.name}</div>
                        <div className="text-xs sm:text-sm text-gray-600">{player.role}</div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-600 text-sm sm:text-base">No more batsmen available - All Out!</div>
                  )
                ) : modalType === 'bowler' ? (
                  getAvailableBowlers().map((player, index) => (
                    <button
                      key={player._id || index}
                      onClick={() => handlePlayerSelection(player._id, player.name)}
                      className="w-full p-2 sm:p-3 text-left border rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-sm sm:text-base">{player.name}</div>
                      <div className="text-xs sm:text-sm text-gray-600">{player.role}</div>
                    </button>
                  ))
                ) : (
                  getBattingTeamPlayers().map((player, index) => (
                    <button
                      key={player._id || index}
                      onClick={() => handlePlayerSelection(player._id, player.name)}
                      className="w-full p-2 sm:p-3 text-left border rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-sm sm:text-base">{player.name}</div>
                      <div className="text-xs sm:text-sm text-gray-600">{player.role}</div>
                    </button>
                  ))
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setShowPlayerModal(false);
                    setShowBowlerModal(false);
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {overHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mt-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3 text-gray-800">Recent Overs</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {overHistory.slice(-5).reverse().map((over) => (
                <div key={over.over} className="border-b pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm sm:text-base">Over {over.over}</span>
                    <span className="font-bold text-sm sm:text-base">{over.runs} runs</span>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                    {over.balls.map((ball, ballIndex) => (
                      <div key={ballIndex} className="text-xs">
                        {renderBallBubble(ball, ballIndex)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bowler Selection Modal */}
        {showBowlerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md lg:max-w-lg">
              <h2 className="text-lg sm:text-xl font-bold mb-4">Select New Bowler</h2>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {getAvailableBowlers().map((player, index) => (
                  <button
                    key={player._id || index}
                    onClick={() => handlePlayerSelection(player._id, player.name)}
                    className="w-full p-2 sm:p-3 text-left border rounded hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm sm:text-base">{player.name}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{player.role}</div>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowBowlerModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Updated Lineup Modal */}
        {showLineupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                Set Lineup - {currentInnings === 1 ? 'First' : 'Second'} Innings
              </h3>

              {/* Debug info - remove after fixing */}
              <div className="mb-4 p-2 bg-gray-100 rounded text-xs sm:text-sm">
                <p>Batting Team: {getBattingTeam()}</p>
                <p>Bowling Team: {getBowlingTeam()}</p>
                <p>Batting Players: {getBattingTeamPlayers().length}</p>
                <p>Bowling Players: {getBowlingTeamPlayers().length}</p>
              </div>

              {/* Striker Selection */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium mb-2">Select Striker:</label>
                <select
                  value={striker}
                  onChange={(e) => setStriker(e.target.value)}
                  className="w-full p-2 border rounded text-sm sm:text-base"
                >
                  <option value="">Choose Striker</option>
                  {getBattingTeamPlayers().map((player, index) => (
                    <option key={`striker-${index}`} value={player.name || player}>
                      {player.name || player}
                    </option>
                  ))}
                </select>
              </div>

              {/* Non-Striker Selection */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium mb-2">Select Non-Striker:</label>
                <select
                  value={nonStriker}
                  onChange={(e) => setNonStriker(e.target.value)}
                  className="w-full p-2 border rounded text-sm sm:text-base"
                >
                  <option value="">Choose Non-Striker</option>
                  {getBattingTeamPlayers()
                    .filter(player => (player.name || player) !== striker)
                    .map((player, index) => (
                      <option key={`nonstriker-${index}`} value={player.name || player}>
                        {player.name || player}
                      </option>
                    ))}
                </select>
              </div>

              {/* Bowler Selection */}
              <div className="mb-6">
                <label className="block text-xs sm:text-sm font-medium mb-2">Select Bowler:</label>
                <select
                  value={currentBowler}
                  onChange={(e) => setCurrentBowler(e.target.value)}
                  className="w-full p-2 border rounded text-sm sm:text-base"
                >
                  <option value="">Choose Bowler</option>
                  {getBowlingTeamPlayers().map((player, index) => (
                    <option key={`bowler-${index}`} value={player._id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Validation Messages */}
              {(!striker || !nonStriker || !currentBowler) && (
                <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 rounded text-xs sm:text-sm text-yellow-700">
                  Please select all players before starting the match.
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleLineupSetup(striker, nonStriker, currentBowler);
                  }}
                  disabled={!striker || !nonStriker || !currentBowler}
                  className="flex-1 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 transition-colors text-sm sm:text-base"
                >
                  Start Match
                </button>
                <button
                  onClick={() => setShowLineupModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Notification Container */}
        <div className="fixed top-4 right-4 w-96 z-40">
          {notifications.map((notification) => (
            <Notification
              key={notification.id}
              notification={notification}
              onClose={removeNotification}
            />
          ))}
        </div>

        {/* Confirmation Modals */}
        <ConfirmationModal
          isOpen={showResetConfirmModal}
          onClose={() => setShowResetConfirmModal(false)}
          onConfirm={handleConfirmReset}
          title="Complete Match"
          message="Are you sure you want to complete this match and return to dashboard? This action cannot be undone."
          confirmText="Complete Match"
          cancelText="Cancel"
          type="warning"
        />

        <ConfirmationModal
          isOpen={showForceNavigateModal}
          onClose={() => setShowForceNavigateModal(false)}
          onConfirm={handleForceNavigate}
          title="Navigation Failed"
          message="Match completion failed. Do you want to return to dashboard anyway? (Match data may not be saved)"
          confirmText="Go to Dashboard"
          cancelText="Stay Here"
          type="error"
        />
        {/* Match Result Modal */}
        {showResultModal && matchResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md">
              <div className="text-center">
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Match Complete!</h2>
                <p className="text-base sm:text-lg text-gray-600 mb-4">{matchResult.result}</p>
                <p className="text-lg sm:text-xl font-bold text-green-600 mb-6">
                  🏆 {matchResult.winner} Wins!
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowResultModal(false)}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleResetClick}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm sm:text-base"
                  >
                    Start New Match
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    );
  };

  export default ScoringComponent;