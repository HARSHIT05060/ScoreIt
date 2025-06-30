import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const MatchSummary = () => {
    const { matchId } = useParams();
    const { user, logout } = useAuth();
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('scorecard');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        let interval;

        const initialize = async () => {
            await fetchMatchSummary(true); // Initial load with loader

            // After first fetch, setup interval only if match is not completed
            if (match?.status !== 'completed') {
                interval = setInterval(() => {
                    fetchMatchSummary(false); // Background silent fetch
                }, 5000);
            }
        };

        initialize();

        return () => clearInterval(interval);
    }, [matchId, user, navigate]);


    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const TabButton = ({ label, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`tab-button ${isActive ? 'active' : ''}`}
            style={{
                flex: 1,
                padding: '14px 20px',
                border: 'none',
                borderBottom: isActive ? '3px solid #007bff' : '3px solid transparent',
                background: isActive ? 'rgba(0, 123, 255, 0.08)' : 'transparent',
                color: isActive ? '#007bff' : '#6c757d',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.target.style.background = 'rgba(0, 123, 255, 0.04)';
                    e.target.style.color = '#495057';
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#6c757d';
                }
            }}
        >
            {label}
        </button>
    );

    const ScoreCard = ({ team, score, color, isReverse = false }) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
            flexDirection: isReverse ? 'row-reverse' : 'row',
            textAlign: isReverse ? 'right' : 'left',
            padding: isMobile ? '12px' : '16px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
            <div style={{
                width: isMobile ? '40px' : '50px',
                height: isMobile ? '40px' : '50px',
                background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 'bold',
                color: 'white',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}>
                {getTeamShortName && getTeamShortName(team).charAt(0)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: '#fff',
                    marginBottom: '2px'
                }}>
                    {getTeamShortName && getTeamShortName(team)}
                </div>
                <div style={{
                    fontSize: isMobile ? '18px' : '22px',
                    fontWeight: 'bold',
                    color: '#fff',
                    lineHeight: 1
                }}>
                    {score.runs}-{score.wickets}
                </div>
                <div style={{
                    fontSize: isMobile ? '12px' : '14px',
                    opacity: '0.9',
                    color: '#fff',
                    marginTop: '2px'
                }}>
                    {formatOvers && formatOvers(score.balls)}
                </div>
            </div>
        </div>
    );

    const BattingTable = ({ stats }) => (
        <div style={{
            background: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{
                    width: '100%',
                    minWidth: isMobile ? '500px' : '600px',
                    borderCollapse: 'collapse'
                }}>
                    <thead>
                        <tr style={{
                            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                            borderBottom: '2px solid #dee2e6'
                        }}>
                            {['Batter', 'R', 'B', '4s', '6s', 'SR'].map((header, index) => (
                                <th key={header} style={{
                                    textAlign: index === 0 ? 'left' : 'center',
                                    padding: isMobile ? '10px 6px' : '14px 8px',
                                    fontWeight: '600',
                                    color: '#495057',
                                    fontSize: isMobile ? '12px' : '14px',
                                    width: index === 0 ? 'auto' : isMobile ? '40px' : '50px',
                                    letterSpacing: '0.5px'
                                }}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {stats && stats.length > 0 ? (
                            stats.map((batsman, index) => (
                                <tr key={index} style={{
                                    borderBottom: '1px solid #f1f3f4',
                                    transition: 'background-color 0.2s ease',
                                    ':hover': { background: '#f8f9fa' }
                                }}
                                    onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                    <td style={{
                                        padding: isMobile ? '10px 6px' : '14px 8px',
                                        fontSize: isMobile ? '12px' : '14px',
                                        fontWeight: '500'
                                    }}>
                                        <div style={{ fontWeight: '600', color: '#333' }}>{batsman.name}</div>
                                        {batsman.isOut && (
                                            <div style={{
                                                fontSize: isMobile ? '10px' : '12px',
                                                color: '#6c757d',
                                                marginTop: '2px',
                                                fontStyle: 'italic'
                                            }}>
                                                {batsman.dismissal}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{
                                        padding: isMobile ? '10px 6px' : '14px 8px',
                                        textAlign: 'center',
                                        fontSize: isMobile ? '14px' : '16px',
                                        fontWeight: 'bold',
                                        color: '#007bff'
                                    }}>
                                        {batsman.runs}
                                    </td>
                                    <td style={{
                                        padding: isMobile ? '10px 6px' : '14px 8px',
                                        textAlign: 'center',
                                        fontSize: isMobile ? '12px' : '14px'
                                    }}>
                                        {batsman.ballsFaced}
                                    </td>
                                    <td style={{
                                        padding: isMobile ? '10px 6px' : '14px 8px',
                                        textAlign: 'center',
                                        fontSize: isMobile ? '12px' : '14px',
                                        color: '#28a745',
                                        fontWeight: '500'
                                    }}>
                                        {batsman.fours}
                                    </td>
                                    <td style={{
                                        padding: isMobile ? '10px 6px' : '14px 8px',
                                        textAlign: 'center',
                                        fontSize: isMobile ? '12px' : '14px',
                                        color: '#dc3545',
                                        fontWeight: '500'
                                    }}>
                                        {batsman.sixes}
                                    </td>
                                    <td style={{
                                        padding: isMobile ? '10px 6px' : '14px 8px',
                                        textAlign: 'center',
                                        fontSize: isMobile ? '12px' : '14px',
                                        fontWeight: '500'
                                    }}>
                                        {batsman.ballsFaced > 0 ?
                                            ((batsman.runs / batsman.ballsFaced) * 100).toFixed(2) :
                                            '0.00'
                                        }
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{
                                    padding: '24px',
                                    textAlign: 'center',
                                    color: '#6c757d',
                                    fontSize: '16px'
                                }}>
                                    No batting data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const BowlingTable = ({ stats }) => (
        <div style={{
            background: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{
                    width: '100%',
                    minWidth: isMobile ? '500px' : '600px',
                    borderCollapse: 'collapse'
                }}>
                    <thead>
                        <tr style={{
                            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                            borderBottom: '2px solid #dee2e6'
                        }}>
                            {['Bowler', 'O', 'M', 'R', 'W', 'ER'].map((header, index) => (
                                <th key={header} style={{
                                    textAlign: index === 0 ? 'left' : 'center',
                                    padding: isMobile ? '10px 6px' : '14px 8px',
                                    fontWeight: '600',
                                    color: '#495057',
                                    fontSize: isMobile ? '12px' : '14px',
                                    width: index === 0 ? 'auto' : isMobile ? '40px' : '50px',
                                    letterSpacing: '0.5px'
                                }}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {stats && stats.length > 0 ? (
                            stats.map((bowler, index) => (
                                <tr key={index} style={{
                                    borderBottom: '1px solid #f1f3f4',
                                    transition: 'background-color 0.2s ease'
                                }}
                                    onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                >
                                    <td style={{
                                        padding: isMobile ? '10px 6px' : '14px 8px',
                                        fontSize: isMobile ? '12px' : '14px',
                                        fontWeight: '600',
                                        color: '#333'
                                    }}>
                                        {getBowlerNameFromStats && getBowlerNameFromStats(bowler, match)}
                                    </td>
                                    <td style={{
                                        padding: isMobile ? '10px 6px' : '14px 8px',
                                        textAlign: 'center',
                                        fontSize: isMobile ? '12px' : '14px'
                                    }}>
                                        {formatOvers && formatOvers(bowler.ballsBowled)}
                                    </td>
                                    <td style={{
                                        padding: isMobile ? '10px 6px' : '14px 8px',
                                        textAlign: 'center',
                                        fontSize: isMobile ? '12px' : '14px'
                                    }}>
                                        {bowler.maidens}
                                    </td>
                                    <td style={{
                                        padding: isMobile ? '10px 6px' : '14px 8px',
                                        textAlign: 'center',
                                        fontSize: isMobile ? '12px' : '14px'
                                    }}>
                                        {bowler.runsConceded}
                                    </td>
                                    <td style={{
                                        padding: isMobile ? '10px 6px' : '14px 8px',
                                        textAlign: 'center',
                                        fontSize: isMobile ? '14px' : '16px',
                                        fontWeight: 'bold',
                                        color: '#007bff'
                                    }}>
                                        {bowler.wickets}
                                    </td>
                                    <td style={{
                                        padding: isMobile ? '10px 6px' : '14px 8px',
                                        textAlign: 'center',
                                        fontSize: isMobile ? '12px' : '14px',
                                        fontWeight: '500'
                                    }}>
                                        {bowler.ballsBowled > 0 ?
                                            ((bowler.runsConceded / (bowler.ballsBowled / 6)) || 0).toFixed(2) :
                                            '0.00'
                                        }
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{
                                    padding: '24px',
                                    textAlign: 'center',
                                    color: '#6c757d',
                                    fontSize: '16px'
                                }}>
                                    No bowling data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
    const getAuthHeaders = () => {
        const token = user?.token || sessionStorage.getItem('token') || localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const handleApiError = async (response) => {
        if (response.status === 401) {
            logout();
            navigate('/login');
            return;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API request failed');
        } else {
            throw new Error('Server returned an invalid response. Please check your authentication.');
        }
    };


    const fetchMatchSummary = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {

            const response = await fetch(`${API_URL}/api/matches/${matchId}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                await handleApiError(response);
                return;
            }

            const data = await response.json();
            // Handle both direct match data and nested match data
            const matchData = data.match || data;
            setMatch(matchData);
        } catch (err) {
            setError(err.message);
            console.error('Fetch match summary error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getTeamName = (team) => {
        if (!team) return 'Unknown Team';

        // Handle different possible structures
        if (typeof team === 'string') return team;
        if (team.name?.name) return team.name.name;
        if (team.name) return team.name;
        return 'Unknown Team';
    };

    const getTeamShortName = (team) => {
        if (!team) return 'UNKN';

        const teamName = getTeamName(team);
        if (teamName === 'Unknown Team') return 'UNKN';

        // Create abbreviation from team name
        return teamName.substring(0, 4).toUpperCase();
    };

    const getTeamId = (team) => {
        if (!team) return null;
        if (typeof team === 'string') return team;
        if (team._id) return team._id;
        if (team.name?._id) return team.name._id;
        return null;
    };

    const getInningByTeamId = (teamId) => {
        if (!match?.innings || !teamId) return null;
        return match.innings.find(inning =>
            inning.battingTeam === teamId ||
            inning.battingTeam === teamId.toString()
        );
    };

    const getMatchResult = () => {
        if (match?.status !== 'completed') {
            return match?.status === 'upcoming' ? 'Upcoming Match' : 'Match In Progress';
        }

        // Check if match result is already provided
        if (match.result) {
            return match.result;
        }

        // Check for winner
        if (match.winner) {
            const winnerName = getTeamName(match.winner);
            const margin = match.winMargin || '';
            return `${winnerName} won${margin ? ` ${margin}` : ''}`;
        }

        return 'Match Completed';
    };


    const getBowlerNameFromStats = (bowler, match) => {
        console.log('Bowler object:', bowler);
        if (!match || !match.teamA || !match.teamB) return 'Unknown Bowler';

        const bowlerId = bowler.name; // This is something like "68539df516a745a71e7f91a4_0"

        // Check if bowlerId is a composite ID (teamId_playerIndex)
        if (bowlerId && bowlerId.includes('_')) {
            const [teamId, playerIndex] = bowlerId.split('_');
            const playerIdx = parseInt(playerIndex);

            // Check if it's from teamA
            if (match.teamA.name && match.teamA.name._id === teamId) {
                // Try to get from the detailed players array first
                if (match.teamA.name.players && match.teamA.name.players[playerIdx]) {
                    return match.teamA.name.players[playerIdx].name;
                }
                // Fallback to simple players array
                if (match.teamA.players && match.teamA.players[playerIdx]) {
                    return match.teamA.players[playerIdx];
                }
            }

            // Check if it's from teamB
            if (match.teamB.name && match.teamB.name._id === teamId) {
                // Try to get from the detailed players array first
                if (match.teamB.name.players && match.teamB.name.players[playerIdx]) {
                    return match.teamB.name.players[playerIdx].name;
                }
                // Fallback to simple players array
                if (match.teamB.players && match.teamB.players[playerIdx]) {
                    return match.teamB.players[playerIdx];
                }
            }
        }

        // Fallback: try to match bowlerId directly with player IDs or names
        const teamADetailedPlayers = match.teamA.name?.players || [];
        const teamBDetailedPlayers = match.teamB.name?.players || [];
        const teamAPlayers = match.teamA.players || [];
        const teamBPlayers = match.teamB.players || [];

        // Check in detailed teamA players
        const teamAPlayer = teamADetailedPlayers.find(p => p._id === bowlerId || p.name === bowlerId);
        if (teamAPlayer) return teamAPlayer.name;

        // Check in detailed teamB players
        const teamBPlayer = teamBDetailedPlayers.find(p => p._id === bowlerId || p.name === bowlerId);
        if (teamBPlayer) return teamBPlayer.name;

        // Check in simple teamA players array
        if (teamAPlayers.includes(bowlerId)) return bowlerId;

        // Check in simple teamB players array
        if (teamBPlayers.includes(bowlerId)) return bowlerId;

        return bowlerId || 'Unknown Bowler';
    };

    const formatOvers = (balls) => {
        if (!balls && balls !== 0) return '0.0';
        const overs = Math.floor(balls / 6);
        const remainingBalls = balls % 6;
        return `${overs}.${remainingBalls}`;
    };

    const getTeamScore = (team) => {
        if (!team) return { runs: 0, wickets: 0, balls: 0 };

        const teamId = getTeamId(team);
        const inning = getInningByTeamId(teamId);

        if (inning) {
            return {
                runs: inning.totalRuns || 0,
                wickets: inning.totalWickets || 0,
                balls: inning.totalBalls || 0
            };
        }

        return { runs: 0, wickets: 0, balls: 0 };
    };

    // Calculate batting statistics from balls data
    const calculateBattingStats = (inning) => {
        if (!inning?.balls || !Array.isArray(inning.balls)) return [];

        const batsmenStats = {};

        // Start from second ball
        const balls = inning.balls.slice(1);

        balls.forEach(ball => {
            const batsman = ball.batsman;
            if (!batsman || batsman === '') return;

            if (!batsmenStats[batsman]) {
                batsmenStats[batsman] = {
                    name: batsman,
                    runs: 0,
                    ballsFaced: 0,
                    fours: 0,
                    sixes: 0,
                    isOut: false,
                    dismissal: null
                };
            }

            if (!ball.isExtra) {
                batsmenStats[batsman].ballsFaced++;
            }

            if (!ball.isExtra || ball.runs > 0) {
                batsmenStats[batsman].runs += ball.runs || 0;
            }

            if (ball.runs === 4) batsmenStats[batsman].fours++;
            if (ball.runs === 6) batsmenStats[batsman].sixes++;

            if (ball.isWicket) {
                batsmenStats[batsman].isOut = true;
                batsmenStats[batsman].dismissal = 'out';
            }
        });

        return Object.values(batsmenStats).filter(batsman =>
            batsman.ballsFaced > 0 || batsman.runs > 0
        );
    };


    // Calculate bowling statistics from balls data
    const calculateBowlingStats = (inning) => {
        if (!inning?.balls || !Array.isArray(inning.balls)) return [];

        const bowlerStats = {};

        // Start from second ball
        const balls = inning.balls.slice(1);

        balls.forEach(ball => {
            const bowlerId = ball.bowler || 'Unknown Bowler';

            if (!bowlerStats[bowlerId]) {
                bowlerStats[bowlerId] = {
                    name: bowlerId,
                    ballsBowled: 0,
                    runsConceded: 0,
                    wickets: 0,
                    maidens: 0
                };
            }

            bowlerStats[bowlerId].ballsBowled++;
            bowlerStats[bowlerId].runsConceded += ball.runs || 0;

            if (ball.isWicket) {
                bowlerStats[bowlerId].wickets++;
            }
        });

        return Object.values(bowlerStats).filter(bowler => bowler.ballsBowled > 0);
    };


    if (!user) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px'
            }}>
                Redirecting to login...
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px'
            }}>
                Loading match summary...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '20px',
                textAlign: 'center'
            }}>
                <div style={{
                    background: '#f8d7da',
                    color: '#721c24',
                    padding: '20px',
                    borderRadius: '5px',
                    marginBottom: '20px'
                }}>
                    Error: {error}
                </div>
                <button
                    onClick={() => navigate('/manage-matches')}
                    style={{
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Back to Matches
                </button>
            </div>
        );
    }

    if (!match) {
        return (
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '20px',
                textAlign: 'center'
            }}>
                <p>Match not found</p>
                <button
                    onClick={() => navigate('/manage-matches')}
                    style={{
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Back to Matches
                </button>
            </div>
        );
    }

    const teamAScore = getTeamScore(match.teamA);
    const teamBScore = getTeamScore(match.teamB);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            {/* Header Section */}
            <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                padding: isMobile ? '12px 0' : '20px 0',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '0 16px',
                    position: 'relative'
                }}>
                    <button
                        onClick={() => navigate && navigate('/manage-matches')}
                        style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            padding: isMobile ? '6px 12px' : '10px 18px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: isMobile ? '12px' : '14px',
                            backdropFilter: 'blur(10px)',
                            fontWeight: '500',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                            e.target.style.transform = 'translateY(-50%) translateX(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.target.style.transform = 'translateY(-50%) translateX(0)';
                        }}
                    >
                        ← Back
                    </button>

                    <div style={{ textAlign: 'center', margin: isMobile ? '0 60px' : '0 100px' }}>
                        <h2 style={{
                            margin: '0 0 20px 0',
                            fontSize: isMobile ? '16px' : '20px',
                            opacity: '0.95',
                            fontWeight: '600',
                            letterSpacing: '0.5px'
                        }}>
                            {match && (match.matchName || `${getTeamShortName && getTeamShortName(match.teamA)} vs ${getTeamShortName && getTeamShortName(match.teamB)}`)}
                        </h2>

                        {/* Score Display */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            maxWidth: '800px',
                            margin: '0 auto',
                            width: '100%'
                        }}>
                            {/* Match Result/Status - Always at top on mobile */}
                            <div style={{
                                textAlign: 'center',
                                background: 'rgba(255, 255, 255, 0.2)',
                                padding: isMobile ? '12px 16px' : '16px 24px',
                                borderRadius: '16px',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Subtle background pattern */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%)',
                                    pointerEvents: 'none'
                                }} />

                                <div style={{
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <div style={{
                                        fontSize: isMobile ? '14px' : '18px',
                                        fontWeight: '700',
                                        color: '#ffd700',
                                        letterSpacing: '0.8px',
                                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                                        marginBottom: match && match.status === 'completed' ? '8px' : '0'
                                    }}>
                                        {getMatchResult && getMatchResult()}
                                    </div>
                                    {match && match.status === 'completed' && (
                                        <div style={{
                                            fontSize: isMobile ? '20px' : '28px',
                                            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                        }}>
                                            🏆
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Teams Score Display */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                gap: isMobile ? '12px' : '16px',
                                width: '100%'
                            }}>
                                {match && teamAScore && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.95), rgba(255, 107, 53, 0.85))',
                                        padding: isMobile ? '16px' : '20px',
                                        borderRadius: '16px',
                                        backdropFilter: 'blur(15px)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        boxShadow: '0 8px 32px rgba(255, 107, 53, 0.3)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 107, 53, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 107, 53, 0.3)';
                                        }}
                                    >
                                        {/* Subtle shine effect */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: '-100%',
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                                            animation: 'shine 3s infinite',
                                            pointerEvents: 'none'
                                        }} />

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: isMobile ? '12px' : '16px',
                                            position: 'relative',
                                            zIndex: 1
                                        }}>
                                            <div style={{
                                                width: isMobile ? '48px' : '60px',
                                                height: isMobile ? '48px' : '60px',
                                                background: 'rgba(255, 255, 255, 0.25)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: isMobile ? '18px' : '24px',
                                                fontWeight: 'bold',
                                                color: 'white',
                                                flexShrink: 0,
                                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                                            }}>
                                                {getTeamShortName && getTeamShortName(match.teamA).charAt(0)}
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{
                                                    fontSize: isMobile ? '16px' : '20px',
                                                    fontWeight: '700',
                                                    color: 'white',
                                                    marginBottom: '4px',
                                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {getTeamShortName && getTeamShortName(match.teamA)}
                                                </div>
                                                <div style={{
                                                    fontSize: isMobile ? '24px' : '32px',
                                                    fontWeight: '900',
                                                    color: 'white',
                                                    lineHeight: 1,
                                                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                                                }}>
                                                    {teamAScore.runs}/{teamAScore.wickets}
                                                </div>
                                                <div style={{
                                                    fontSize: isMobile ? '13px' : '16px',
                                                    color: 'rgba(255, 255, 255, 0.9)',
                                                    marginTop: '4px',
                                                    fontWeight: '500',
                                                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                                }}>
                                                    ({formatOvers && formatOvers(teamAScore.balls)} ov)
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {match && teamBScore && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.95), rgba(220, 53, 69, 0.85))',
                                        padding: isMobile ? '16px' : '20px',
                                        borderRadius: '16px',
                                        backdropFilter: 'blur(15px)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        boxShadow: '0 8px 32px rgba(220, 53, 69, 0.3)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(220, 53, 69, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(220, 53, 69, 0.3)';
                                        }}
                                    >
                                        {/* Subtle shine effect */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: '-100%',
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                                            animation: 'shine 3s infinite 1.5s',
                                            pointerEvents: 'none'
                                        }} />

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: isMobile ? '12px' : '16px',
                                            position: 'relative',
                                            zIndex: 1,
                                            flexDirection: isMobile ? 'row' : 'row-reverse',
                                            textAlign: isMobile ? 'left' : 'right'
                                        }}>
                                            <div style={{
                                                width: isMobile ? '48px' : '60px',
                                                height: isMobile ? '48px' : '60px',
                                                background: 'rgba(255, 255, 255, 0.25)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: isMobile ? '18px' : '24px',
                                                fontWeight: 'bold',
                                                color: 'white',
                                                flexShrink: 0,
                                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                                            }}>
                                                {getTeamShortName && getTeamShortName(match.teamB).charAt(0)}
                                            </div>
                                            <div style={{
                                                minWidth: 0,
                                                flex: 1,
                                                textAlign: isMobile ? 'left' : 'right'
                                            }}>
                                                <div style={{
                                                    fontSize: isMobile ? '16px' : '20px',
                                                    fontWeight: '700',
                                                    color: 'white',
                                                    marginBottom: '4px',
                                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {getTeamShortName && getTeamShortName(match.teamB)}
                                                </div>
                                                <div style={{
                                                    fontSize: isMobile ? '24px' : '32px',
                                                    fontWeight: '900',
                                                    color: 'white',
                                                    lineHeight: 1,
                                                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                                                }}>
                                                    {teamBScore.runs}/{teamBScore.wickets}
                                                </div>
                                                <div style={{
                                                    fontSize: isMobile ? '13px' : '16px',
                                                    color: 'rgba(255, 255, 255, 0.9)',
                                                    marginTop: '4px',
                                                    fontWeight: '500',
                                                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                                }}>
                                                    ({formatOvers && formatOvers(teamBScore.balls)} ov)
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                background: '#f8f9fa',
                minHeight: 'calc(100vh - 250px)'
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    {/* Tab Navigation */}
                    <div style={{
                        background: 'white',
                        borderBottom: '1px solid #e9ecef',
                        display: 'flex',
                        overflowX: 'auto',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                        <TabButton
                            label="Scorecard"
                            isActive={activeTab === 'scorecard'}
                            onClick={() => setActiveTab('scorecard')}
                        />
                        <TabButton
                            label="Match Info"
                            isActive={activeTab === 'match-info'}
                            onClick={() => setActiveTab('match-info')}
                        />
                    </div>

                    {/* Tab Content */}
                    <div style={{ padding: isMobile ? '16px 12px' : '24px 20px' }}>
                        {activeTab === 'scorecard' && (
                            <div>
                                {/* Quick Scores */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
                                    gap: '16px',
                                    marginBottom: '32px'
                                }}>
                                    {match && teamAScore && (
                                        <div style={{
                                            background: 'white',
                                            border: '1px solid #e9ecef',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                                            }}
                                        >
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                color: 'white'
                                            }}>
                                                {getTeamShortName && getTeamShortName(match.teamA).charAt(0)}
                                            </div>
                                            <div style={{ fontWeight: '600', fontSize: isMobile ? '14px' : '16px', flex: 1 }}>
                                                {getTeamShortName && getTeamShortName(match.teamA)} {teamAScore.runs}-{teamAScore.wickets} ({formatOvers && formatOvers(teamAScore.balls)})
                                            </div>
                                        </div>
                                    )}

                                    {match && teamBScore && (
                                        <div style={{
                                            background: 'white',
                                            border: '1px solid #e9ecef',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                                            }}
                                        >
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                background: 'linear-gradient(135deg, #dc3545, #c82333)',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                color: 'white'
                                            }}>
                                                {getTeamShortName && getTeamShortName(match.teamB).charAt(0)}
                                            </div>
                                            <div style={{ fontWeight: '600', fontSize: isMobile ? '14px' : '16px', flex: 1 }}>
                                                {getTeamShortName && getTeamShortName(match.teamB)} {teamBScore.runs}-{teamBScore.wickets} ({formatOvers && formatOvers(teamBScore.balls)})
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Innings Details */}
                                {match && match.innings && match.innings.length > 0 ? (
                                    match.innings.map((inning, inningIndex) => {
                                        const battingStats = calculateBattingStats && calculateBattingStats(inning);
                                        const bowlingStats = calculateBowlingStats && calculateBowlingStats(inning);
                                        const battingTeamName = inning.battingTeam === getTeamId(match.teamA) ?
                                            getTeamName(match.teamA) : getTeamName(match.teamB);

                                        return (
                                            <div key={inningIndex} style={{
                                                background: 'white',
                                                borderRadius: '16px',
                                                padding: isMobile ? '16px' : '24px',
                                                marginBottom: '32px',
                                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                                                border: '1px solid rgba(0, 0, 0, 0.05)'
                                            }}>
                                                <h3 style={{
                                                    fontSize: isMobile ? '18px' : '22px',
                                                    fontWeight: '700',
                                                    marginBottom: '20px',
                                                    color: '#1a1a1a',
                                                    borderBottom: '3px solid #007bff',
                                                    paddingBottom: '12px',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {battingTeamName} BATTING - {inning.totalRuns}/{inning.totalWickets} ({formatOvers && formatOvers(inning.totalBalls)})
                                                </h3>

                                                {battingStats && <BattingTable stats={battingStats} />}

                                                {/* Extras */}
                                                {inning.extras && (
                                                    <div style={{
                                                        marginBottom: '24px',
                                                        padding: '16px 20px',
                                                        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                                        borderRadius: '12px',
                                                        border: '1px solid #dee2e6'
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            fontSize: isMobile ? '12px' : '14px',
                                                            flexWrap: 'wrap',
                                                            gap: '8px'
                                                        }}>
                                                            <span style={{ fontWeight: '600', color: '#495057' }}>Extras:</span>
                                                            <span style={{ fontWeight: '600', color: '#333' }}>
                                                                {inning.extras.total || 0} (b {inning.extras.byes || 0}, lb {inning.extras.legByes || 0}, w {inning.extras.wides || 0}, nb {inning.extras.noBalls || 0}, p {inning.extras.penalties || 0})
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                <h4 style={{
                                                    fontSize: isMobile ? '18px' : '22px',
                                                    fontWeight: '700',
                                                    marginBottom: '20px',
                                                    color: '#1a1a1a',
                                                    borderBottom: '3px solid #28a745',
                                                    paddingBottom: '12px',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    BOWLING
                                                </h4>

                                                {bowlingStats && <BowlingTable stats={bowlingStats} />}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        padding: '48px',
                                        textAlign: 'center',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                                        border: '1px solid rgba(0, 0, 0, 0.05)'
                                    }}>
                                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏏</div>
                                        <h3 style={{ color: '#6c757d', marginBottom: '8px' }}>No match data available</h3>
                                        <p style={{ color: '#6c757d', fontSize: '14px' }}>The scorecard will appear here once the match begins.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'match-info' && (
                            <div>
                                <div style={{
                                    background: 'white',
                                    borderRadius: '16px',
                                    padding: isMobile ? '20px' : '32px',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                                    border: '1px solid rgba(0, 0, 0, 0.05)'
                                }}>
                                    <h3 style={{
                                        fontSize: isMobile ? '20px' : '24px',
                                        fontWeight: '700',
                                        marginBottom: '24px',
                                        color: '#1a1a1a',
                                        borderBottom: '3px solid #6f42c1',
                                        paddingBottom: '12px'
                                    }}>
                                        Match Information
                                    </h3>

                                    {match ? (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
                                            gap: '20px'
                                        }}>
                                            <div style={{
                                                padding: '20px',
                                                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                                borderRadius: '12px',
                                                border: '1px solid #dee2e6'
                                            }}>
                                                <h4 style={{
                                                    marginBottom: '16px',
                                                    color: '#495057',
                                                    fontSize: isMobile ? '16px' : '18px',
                                                    fontWeight: '600'
                                                }}>
                                                    Teams
                                                </h4>
                                                <div style={{ marginBottom: '12px' }}>
                                                    <strong style={{ color: '#007bff' }}>
                                                        {getTeamName && getTeamName(match.teamA)}
                                                    </strong>
                                                    <span style={{ color: '#6c757d', margin: '0 8px' }}>vs</span>
                                                    <strong style={{ color: '#dc3545' }}>
                                                        {getTeamName && getTeamName(match.teamB)}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div style={{
                                                padding: '20px',
                                                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                                borderRadius: '12px',
                                                border: '1px solid #dee2e6'
                                            }}>
                                                <h4 style={{
                                                    marginBottom: '16px',
                                                    color: '#495057',
                                                    fontSize: isMobile ? '16px' : '18px',
                                                    fontWeight: '600'
                                                }}>
                                                    Match Details
                                                </h4>
                                                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                                                    <div style={{ marginBottom: '8px' }}>
                                                        <strong>Match Type:</strong>
                                                        <span style={{ marginLeft: '8px', color: '#6c757d' }}>
                                                            {match.matchType || 'T20'}
                                                        </span>
                                                    </div>
                                                    <div style={{ marginBottom: '8px' }}>
                                                        <strong>Overs:</strong>
                                                        <span style={{ marginLeft: '8px', color: '#6c757d' }}>
                                                            {match.overs || 20} per side
                                                        </span>
                                                    </div>
                                                    <div style={{ marginBottom: '8px' }}>
                                                        <strong>Status:</strong>
                                                        <span style={{
                                                            marginLeft: '8px',
                                                            color: match.status === 'completed' ? '#28a745' :
                                                                match.status === 'in-progress' ? '#ffc107' : '#6c757d',
                                                            fontWeight: '500',
                                                            textTransform: 'capitalize'
                                                        }}>
                                                            {match.status || 'Not Started'}
                                                        </span>
                                                    </div>
                                                    {match.venue && (
                                                        <div style={{ marginBottom: '8px' }}>
                                                            <strong>Venue:</strong>
                                                            <span style={{ marginLeft: '8px', color: '#6c757d' }}>
                                                                {match.venue}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {match.date && (
                                                        <div>
                                                            <strong>Date:</strong>
                                                            <span style={{ marginLeft: '8px', color: '#6c757d' }}>
                                                                {new Date(match.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {match.tossWinner && (
                                                <div style={{
                                                    padding: '20px',
                                                    background: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
                                                    borderRadius: '12px',
                                                    border: '1px solid #ffeaa7'
                                                }}>
                                                    <h4 style={{
                                                        marginBottom: '16px',
                                                        color: '#856404',
                                                        fontSize: isMobile ? '16px' : '18px',
                                                        fontWeight: '600'
                                                    }}>
                                                        🪙 Toss Information
                                                    </h4>
                                                    <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#856404' }}>
                                                        <div style={{ marginBottom: '8px' }}>
                                                            <strong>Winner:</strong>
                                                            <span style={{ marginLeft: '8px' }}>
                                                                {getTeamName && getTeamName(match.tossWinner)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <strong>Decision:</strong>
                                                            <span style={{ marginLeft: '8px', textTransform: 'capitalize' }}>
                                                                {match.tossDecision || 'Bat'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '48px',
                                            color: '#6c757d'
                                        }}>
                                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                                            <h4 style={{ marginBottom: '8px' }}>No match information available</h4>
                                            <p style={{ fontSize: '14px' }}>Match details will be displayed here.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default MatchSummary;