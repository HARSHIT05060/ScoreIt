import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ManageMatches = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('current');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchMatches();
    }, [filter, user, navigate]);

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

    const fetchMatches = async () => {
        try {
            setLoading(true);
            setError(null);

            const statusFilter = filter === 'current' ? 'ongoing' : '';
            const queryParams = statusFilter ? `?status=${statusFilter}` : '';

            const response = await fetch(`${API_URL}/api/matches${queryParams}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                await handleApiError(response);
                return;
            }

            const data = await response.json();
            setMatches(data.matches || []);
        } catch (err) {
            setError(err.message);
            console.error('Fetch matches error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMatchClick = (matchId) => {
        navigate(`/scoring/${matchId}`);
    };

    const handleStartMatch = async (matchId) => {
        try {
            const response = await fetch(`${API_URL}/api/matches/start/${matchId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                await handleApiError(response);
                return;
            }

            await fetchMatches();
        } catch (err) {
            console.error('Error starting match:', err);
            setError(err.message);
        }
    };

    const handleEndMatch = async (matchId) => {
        try {
            const response = await fetch(`${API_URL}/api/matches/${matchId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: 'completed' })
            });

            if (!response.ok) {
                await handleApiError(response);
                return;
            }

            await fetchMatches();
        } catch (err) {
            console.error('Error ending match:', err);
            setError(err.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming': return '#007bff';
            case 'ongoing': return '#28a745';
            case 'completed': return '#6c757d';
            case 'cancelled': return '#dc3545';
            default: return '#007bff';
        }
    };

    const getTeamName = (team) => {
        if (typeof team === 'string') return team;
        if (team?.name?.name) return team.name.name;
        if (team?.name) return team.name;
        return 'Unknown Team';
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

    function formatOvers(totalBalls) {
        const overs = Math.floor(totalBalls / 6);
        const balls = totalBalls % 6;
        return `${overs}.${balls}`;
    }

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: window.innerWidth <= 768 ? '10px' : '20px',
            fontFamily: 'Arial, sans-serif'
        }}>
            <header style={{
                marginBottom: window.innerWidth <= 768 ? '20px' : '30px',
                borderBottom: '2px solid #e0e0e0',
                paddingBottom: window.innerWidth <= 768 ? '15px' : '20px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: window.innerWidth <= 768 ? 'center' : 'space-between',
                    flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                    gap: window.innerWidth <= 768 ? '15px' : '0'
                }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: window.innerWidth <= 768 ? '12px 24px' : '10px 20px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            order: window.innerWidth <= 768 ? 2 : 1
                        }}
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 style={{
                        margin: 0,
                        color: '#333',
                        fontSize: window.innerWidth <= 768 ? '24px' : '28px',
                        textAlign: 'center',
                        order: window.innerWidth <= 768 ? 1 : 2
                    }}>
                        Manage Matches
                    </h1>
                    {window.innerWidth > 768 && <div style={{ width: '120px' }}></div>}
                </div>
            </header>

            {error && (
                <div style={{
                    background: '#f8d7da',
                    color: '#721c24',
                    padding: '15px',
                    borderRadius: '5px',
                    marginBottom: '20px',
                    border: '1px solid #f5c6cb',
                    position: 'relative'
                }}>
                    Error: {error}
                    <button
                        onClick={() => setError(null)}
                        style={{
                            position: 'absolute',
                            right: '15px',
                            top: '15px',
                            background: 'transparent',
                            border: 'none',
                            fontSize: '16px',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            <div style={{ marginBottom: window.innerWidth <= 768 ? '20px' : '30px' }}>
                <div style={{
                    display: 'flex',
                    gap: window.innerWidth <= 768 ? '5px' : '10px',
                    flexDirection: window.innerWidth <= 480 ? 'column' : 'row'
                }}>
                    <button
                        onClick={() => setFilter('current')}
                        style={{
                            padding: window.innerWidth <= 768 ? '10px 16px' : '12px 24px',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                            background: filter === 'current' ? '#007bff' : '#e9ecef',
                            color: filter === 'current' ? 'white' : '#333',
                            transition: 'all 0.3s ease',
                            flex: window.innerWidth <= 480 ? 'none' : 1
                        }}
                    >
                        Current Matches
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        style={{
                            padding: window.innerWidth <= 768 ? '10px 16px' : '12px 24px',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                            background: filter === 'all' ? '#007bff' : '#e9ecef',
                            color: filter === 'all' ? 'white' : '#333',
                            transition: 'all 0.3s ease',
                            flex: window.innerWidth <= 480 ? 'none' : 1
                        }}
                    >
                        All Matches
                    </button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))',
                gap: window.innerWidth <= 768 ? '15px' : '20px'
            }}>
                {matches.length === 0 ? (
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: window.innerWidth <= 768 ? '40px 15px' : '60px 20px',
                        background: '#f8f9fa',
                        borderRadius: '10px',
                        color: '#6c757d',
                        fontSize: window.innerWidth <= 768 ? '16px' : '18px'
                    }}>
                        <p>No matches found</p>
                        <p style={{ fontSize: window.innerWidth <= 768 ? '12px' : '14px', marginTop: '10px' }}>
                            {filter === 'current' ? 'No ongoing matches at the moment.' : 'No matches have been created yet.'}
                        </p>
                    </div>
                ) : (
                    matches.map((match) => (
                        <div key={match._id} style={{
                            background: 'white',
                            border: '1px solid #dee2e6',
                            borderRadius: '10px',
                            padding: window.innerWidth <= 768 ? '15px' : '20px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: window.innerWidth <= 480 ? 'flex-start' : 'center',
                                marginBottom: '15px',
                                flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
                                gap: window.innerWidth <= 480 ? '10px' : '0'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: window.innerWidth <= 480 ? '5px' : '10px',
                                    fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                                    fontWeight: 'bold',
                                    flexWrap: window.innerWidth <= 480 ? 'wrap' : 'nowrap',
                                    textAlign: window.innerWidth <= 480 ? 'center' : 'left'
                                }}>
                                    <span style={{ wordBreak: 'break-word' }}>{getTeamName(match.teamA)}</span>
                                    <span style={{ color: '#6c757d' }}>VS</span>
                                    <span style={{ wordBreak: 'break-word' }}>{getTeamName(match.teamB)}</span>
                                </div>
                                <div style={{
                                    background: getStatusColor(match.status),
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: window.innerWidth <= 768 ? '10px' : '12px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {match.status}
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <div style={{
                                    marginBottom: '8px',
                                    fontSize: window.innerWidth <= 768 ? '13px' : '14px',
                                    wordBreak: 'break-word'
                                }}>
                                    <strong>Match:</strong> {match.matchName}
                                </div>
                                <div style={{
                                    marginBottom: '8px',
                                    fontSize: window.innerWidth <= 768 ? '13px' : '14px'
                                }}>
                                    <strong>Type:</strong> {match.matchType}
                                </div>
                                <div style={{
                                    marginBottom: '8px',
                                    fontSize: window.innerWidth <= 768 ? '13px' : '14px'
                                }}>
                                    <strong>Date:</strong> {new Date(match.date).toLocaleDateString()}
                                </div>
                                <div style={{
                                    marginBottom: '8px',
                                    fontSize: window.innerWidth <= 768 ? '13px' : '14px'
                                }}>
                                    <strong>Overs:</strong> {match.overs}
                                </div>
                                {match.location && (
                                    <div style={{
                                        fontSize: window.innerWidth <= 768 ? '13px' : '14px',
                                        wordBreak: 'break-word'
                                    }}>
                                        <strong>Venue:</strong> {match.location}
                                    </div>
                                )}
                            </div>

                            {match.status === 'ongoing' && match.innings && match.innings.length > 0 && (
                                <div style={{
                                    background: '#f8f9fa',
                                    padding: window.innerWidth <= 768 ? '12px' : '15px',
                                    borderRadius: '8px',
                                    marginBottom: '15px'
                                }}>
                                    <div style={{
                                        fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                                        fontWeight: 'bold',
                                        marginBottom: '10px',
                                        color: '#28a745'
                                    }}>
                                        Current Score
                                    </div>
                                    {match.innings.map((inning, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '5px',
                                            fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                                            flexWrap: window.innerWidth <= 480 ? 'wrap' : 'nowrap',
                                            gap: window.innerWidth <= 480 ? '5px' : '0'
                                        }}>
                                            <span style={{
                                                fontWeight: 'bold',
                                                wordBreak: 'break-word',
                                                flex: window.innerWidth <= 480 ? '1 1 100%' : 'none'
                                            }}>
                                                {inning.battingTeam === match.teamA._id ?
                                                    getTeamName(match.teamA) : getTeamName(match.teamB)}
                                            </span>
                                            <span style={{
                                                textAlign: window.innerWidth <= 480 ? 'left' : 'right'
                                            }}>
                                                {inning.totalRuns}/{inning.totalWickets} ({formatOvers(inning.totalBalls)})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{
                                display: 'flex',
                                gap: window.innerWidth <= 480 ? '8px' : '10px',
                                flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
                                flexWrap: window.innerWidth > 480 && window.innerWidth <= 768 ? 'wrap' : 'nowrap'
                            }}>
                                <button
                                    onClick={() => handleMatchClick(match._id)}
                                    style={{
                                        flex: window.innerWidth <= 480 ? 'none' : 1,
                                        padding: window.innerWidth <= 768 ? '10px' : '12px',
                                        background: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                                        fontWeight: 'bold',
                                        minHeight: '40px'
                                    }}
                                >
                                    Match Details
                                </button>

                                {match.status === 'upcoming' && (
                                    <button
                                        onClick={() => handleStartMatch(match._id)}
                                        style={{
                                            flex: window.innerWidth <= 480 ? 'none' : 1,
                                            padding: window.innerWidth <= 768 ? '10px' : '12px',
                                            background: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                                            fontWeight: 'bold',
                                            minHeight: '40px'
                                        }}
                                    >
                                        Start Match
                                    </button>
                                )}

                                {match.status === 'ongoing' && (
                                    <button
                                        onClick={() => handleEndMatch(match._id)}
                                        style={{
                                            flex: window.innerWidth <= 480 ? 'none' : 1,
                                            padding: window.innerWidth <= 768 ? '10px' : '12px',
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                                            fontWeight: 'bold',
                                            minHeight: '40px'
                                        }}
                                    >
                                        End Match
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ManageMatches;