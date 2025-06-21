import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ViewerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('live');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchMatches();
        // Set up interval to refresh live matches every 30 seconds
        const interval = setInterval(fetchMatches, 30000);
        return () => clearInterval(interval);
    }, [user, navigate]);

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
            throw new Error('Server returned an invalid response.');
        }
    };

    const fetchMatches = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(`${API_URL}/api/matches`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                await handleApiError(response);
                return;
            }

            const data = await response.json();
            console.log('Fetched matches data:', data);

            // Handle different response structures
            if (Array.isArray(data)) {
                setMatches(data);
            } else if (data.matches && Array.isArray(data.matches)) {
                setMatches(data.matches);
            } else {
                console.warn('Unexpected data structure:', data);
                setMatches([]);
            }
        } catch (err) {
            console.error('Error fetching matches:', err);
            setError(err.message || 'Failed to fetch matches');
            setMatches([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMatchClick = (matchId) => {
        navigate(`/match-summary/${matchId}`);
    };

    const getTeamName = (team) => {
        if (typeof team === 'string') return team;
        if (team?.name?.name) return team.name.name;
        if (team?.name) return team.name;
        return 'Unknown Team';
    };

    const getMatchStatusColor = (status) => {
        switch (status) {
            case 'ongoing': return '#28a745';
            case 'upcoming': return '#007bff';
            case 'completed': return '#6c757d';
            case 'cancelled': return '#dc3545';
            default: return '#007bff';
        }
    };

    const getMatchStatusText = (status) => {
        switch (status) {
            case 'ongoing': return 'LIVE';
            case 'upcoming': return 'Upcoming';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short'
            });
        }
    };

    const formatOvers = (totalBalls) => {
        if (!totalBalls) return '0.0';
        const overs = Math.floor(totalBalls / 6);
        const balls = totalBalls % 6;
        return `${overs}.${balls}`;
    };

    if (!user) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                padding: '20px',
                textAlign: 'center'
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
                fontSize: '18px',
                padding: '20px',
                textAlign: 'center'
            }}>
                Loading matches...
            </div>
        );
    }

    const liveMatches = matches.filter(m => m.status === 'ongoing');
    const upcomingMatches = matches.filter(m => m.status === 'upcoming');
    const completedMatches = matches.filter(m => m.status === 'completed');

    const getActiveMatches = () => {
        switch (activeTab) {
            case 'live': return liveMatches;
            case 'upcoming': return upcomingMatches;
            case 'completed': return completedMatches;
            default: return liveMatches;
        }
    };

    const renderMatchCard = (match) => (
        <div
            key={match._id}
            onClick={() => handleMatchClick(match._id)}
            style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: window.innerWidth < 768 ? '16px' : '20px',
                margin: window.innerWidth < 768 ? '8px 0' : '10px 0',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                if (window.innerWidth >= 768) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                }
            }}
            onMouseLeave={(e) => {
                if (window.innerWidth >= 768) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                }
            }}
        >
            {/* Background pattern */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: window.innerWidth < 768 ? '60px' : '100px',
                height: window.innerWidth < 768 ? '60px' : '100px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                transform: window.innerWidth < 768 ? 'translate(20px, -20px)' : 'translate(30px, -30px)'
            }}></div>

            {/* Match date and time */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px',
                flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                gap: window.innerWidth < 480 ? '10px' : '0'
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: window.innerWidth < 768 ? '14px' : '16px',
                        fontWeight: 'bold',
                        marginBottom: '2px'
                    }}>
                        {formatDate(match.date)}
                    </div>
                    <div style={{
                        fontSize: window.innerWidth < 768 ? '12px' : '14px',
                        opacity: 0.9,
                        wordBreak: 'break-word'
                    }}>
                        {formatTime(match.date)} • {match.location || 'TBD'}
                    </div>
                    <div style={{
                        fontSize: window.innerWidth < 768 ? '11px' : '12px',
                        color: '#ff6b6b',
                        fontWeight: 'bold',
                        marginTop: '4px'
                    }}>
                        {match.matchType || 'T20'} • {match.overs} overs
                    </div>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleMatchClick(match._id);
                    }}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: 'white',
                        padding: window.innerWidth < 768 ? '6px 12px' : '8px 16px',
                        borderRadius: '20px',
                        fontSize: window.innerWidth < 768 ? '11px' : '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        alignSelf: window.innerWidth < 480 ? 'flex-start' : 'auto'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.2)';
                    }}
                >
                    VIEW DETAIL
                </button>
            </div>

            {/* Teams and flags */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                gap: window.innerWidth < 480 ? '15px' : '0'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: window.innerWidth < 480 ? 'none' : 1,
                    width: window.innerWidth < 480 ? '100%' : 'auto',
                    justifyContent: window.innerWidth < 480 ? 'center' : 'flex-start'
                }}>
                    <div style={{
                        width: window.innerWidth < 768 ? '32px' : '40px',
                        height: window.innerWidth < 768 ? '32px' : '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #ff6b6b, #ffa500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px',
                        fontSize: window.innerWidth < 768 ? '14px' : '18px'
                    }}>
                        🏏
                    </div>
                    <div>
                        <div style={{
                            fontSize: window.innerWidth < 768 ? '14px' : '16px',
                            fontWeight: 'bold',
                            textAlign: window.innerWidth < 480 ? 'center' : 'left'
                        }}>
                            {getTeamName(match.teamA)}
                        </div>
                    </div>
                </div>

                <div style={{
                    fontSize: window.innerWidth < 768 ? '14px' : '18px',
                    fontWeight: 'bold',
                    margin: window.innerWidth < 480 ? '0' : '0 20px',
                    opacity: 0.8
                }}>
                    VS
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: window.innerWidth < 480 ? 'none' : 1,
                    width: window.innerWidth < 480 ? '100%' : 'auto',
                    justifyContent: window.innerWidth < 480 ? 'center' : 'flex-end'
                }}>
                    <div style={{
                        textAlign: window.innerWidth < 480 ? 'center' : 'right',
                        order: window.innerWidth < 480 ? 2 : 1
                    }}>
                        <div style={{
                            fontSize: window.innerWidth < 768 ? '14px' : '16px',
                            fontWeight: 'bold'
                        }}>
                            {getTeamName(match.teamB)}
                        </div>
                    </div>
                    <div style={{
                        width: window.innerWidth < 768 ? '32px' : '40px',
                        height: window.innerWidth < 768 ? '32px' : '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #4ecdc4, #44a08d)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: '12px',
                        fontSize: window.innerWidth < 768 ? '14px' : '18px',
                        order: window.innerWidth < 480 ? 1 : 2
                    }}>
                        🏏
                    </div>
                </div>
            </div>

            {/* Match info and scores */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: window.innerWidth < 480 ? 'flex-start' : 'center',
                flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                gap: window.innerWidth < 480 ? '10px' : '0'
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: window.innerWidth < 768 ? '12px' : '14px',
                        opacity: 0.9,
                        marginBottom: '4px',
                        wordBreak: 'break-word'
                    }}>
                        {match.matchName}
                    </div>
                    {match.status === 'ongoing' && match.innings && match.innings.length > 0 && (
                        <div style={{
                            fontSize: window.innerWidth < 768 ? '11px' : '12px',
                            opacity: 0.8,
                            wordBreak: 'break-word'
                        }}>
                            {match.innings.map((inning, index) => (
                                <span key={index}>
                                    {inning.battingTeam === match.teamA._id ?
                                        getTeamName(match.teamA) : getTeamName(match.teamB)}: {' '}
                                    {inning.totalRuns}/{inning.totalWickets} ({formatOvers(inning.totalBalls)})
                                    {index < match.innings.length - 1 ? ' • ' : ''}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{
                    background: getMatchStatusColor(match.status),
                    padding: window.innerWidth < 768 ? '4px 8px' : '6px 12px',
                    borderRadius: '20px',
                    fontSize: window.innerWidth < 768 ? '10px' : '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    alignSelf: window.innerWidth < 480 ? 'flex-start' : 'auto',
                    whiteSpace: 'nowrap'
                }}>
                    {match.status === 'ongoing' && (
                        <span style={{ marginRight: '6px' }}>🔴</span>
                    )}
                    {getMatchStatusText(match.status)}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: window.innerWidth < 768 ? '10px' : '20px',
            fontFamily: 'Arial, sans-serif',
            background: '#f5f7fa',
            minHeight: '100vh'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: window.innerWidth < 480 ? 'flex-start' : 'center',
                marginBottom: window.innerWidth < 768 ? '20px' : '30px',
                background: 'white',
                padding: window.innerWidth < 768 ? '16px' : '20px',
                borderRadius: '16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                flexDirection: window.innerWidth < 480 ? 'column' : 'row',
                gap: window.innerWidth < 480 ? '15px' : '0'
            }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{
                        margin: '0 0 5px 0',
                        color: '#333',
                        fontSize: window.innerWidth < 768 ? '20px' : '24px'
                    }}>
                        Cricket Dashboard
                    </h1>
                    <p style={{
                        margin: '0',
                        color: '#666',
                        fontSize: window.innerWidth < 768 ? '12px' : '14px',
                        wordBreak: 'break-word'
                    }}>
                        Welcome, {user?.name}!
                    </p>
                </div>
                <button
                    onClick={logout}
                    style={{
                        padding: window.innerWidth < 768 ? '8px 16px' : '10px 20px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: window.innerWidth < 768 ? '12px' : '14px',
                        fontWeight: '500',
                        alignSelf: window.innerWidth < 480 ? 'flex-start' : 'auto'
                    }}
                >
                    Logout
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    color: '#721c24',
                    backgroundColor: '#f8d7da',
                    padding: window.innerWidth < 768 ? '12px' : '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #f5c6cb',
                    fontSize: window.innerWidth < 768 ? '12px' : '14px',
                    wordBreak: 'break-word'
                }}>
                    {error}
                    <button
                        onClick={() => setError('')}
                        style={{
                            float: 'right',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '16px',
                            cursor: 'pointer',
                            color: '#721c24'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Navigation Tabs */}
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: window.innerWidth < 768 ? '6px' : '8px',
                marginBottom: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    gap: window.innerWidth < 768 ? '2px' : '4px',
                    flexDirection: window.innerWidth < 480 ? 'column' : 'row'
                }}>
                    {[
                        { key: 'live', label: `Live (${liveMatches.length})`, color: '#28a745' },
                        { key: 'upcoming', label: `Upcoming (${upcomingMatches.length})`, color: '#007bff' },
                        { key: 'completed', label: `Completed (${completedMatches.length})`, color: '#6c757d' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1,
                                padding: window.innerWidth < 768 ? '10px 12px' : '12px 16px',
                                border: 'none',
                                borderRadius: '12px',
                                backgroundColor: activeTab === tab.key ? tab.color : 'transparent',
                                color: activeTab === tab.key ? 'white' : '#666',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Matches List */}
            <div>
                {getActiveMatches().length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: window.innerWidth < 768 ? '40px 20px' : '60px 20px',
                        background: 'white',
                        borderRadius: '16px',
                        color: '#666',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            fontSize: window.innerWidth < 768 ? '32px' : '48px',
                            marginBottom: '16px'
                        }}>
                            🏏
                        </div>
                        <h3 style={{
                            margin: '0 0 10px 0',
                            color: '#333',
                            fontSize: window.innerWidth < 768 ? '18px' : '20px'
                        }}>
                            No {activeTab === 'live' ? 'Live' : activeTab === 'upcoming' ? 'Upcoming' : 'Completed'} Matches
                        </h3>
                        <p style={{
                            margin: '0',
                            fontSize: window.innerWidth < 768 ? '12px' : '14px'
                        }}>
                            {activeTab === 'live' ? 'Check back later for live matches!' :
                                activeTab === 'upcoming' ? 'No matches scheduled at the moment.' :
                                    'No completed matches found.'}
                        </p>
                    </div>
                ) : (
                    <div>
                        {getActiveMatches().map(match => renderMatchCard(match))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewerDashboard;