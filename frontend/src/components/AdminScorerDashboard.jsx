import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminScorerDashboard.css';

const AdminScorerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('quick-actions');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleCreateTeam = () => {
        navigate('/create-team');
    };

    const handleManageMatches = () => {
        navigate('/manage-matches');
    };

    const handleViewScores = () => {
        navigate('/view-scores');
    };

    const dashboardItems = [
        {
            id: 'create-team',
            title: 'Create Team',
            description: 'Create and manage new teams',
            icon: '👥',
            action: handleCreateTeam,
            roles: ['Admin', 'Scorer']
        },
        {
            id: 'manage-matches',
            title: 'Manage Matches',
            description: 'Schedule and manage matches',
            icon: '⚽',
            action: handleManageMatches,
            roles: ['Admin', 'Scorer']
        },
        {
            id: 'view-scores',
            title: 'View Scores',
            description: 'View and update match scores',
            icon: '📊',
            action: handleViewScores,
            roles: ['Admin', 'Scorer']
        },
        {
            id: 'player-stats',
            title: 'Player Statistics',
            description: 'View player performance statistics',
            icon: '📈',
            action: () => console.log('Player Stats'),
            roles: ['Admin', 'Scorer']
        },
        {
            id: 'tournaments',
            title: 'Tournaments',
            description: 'Create and manage tournaments',
            icon: '🏆',
            action: () => console.log('Tournaments'),
            roles: ['Admin']
        },
        {
            id: 'user-management',
            title: 'User Management',
            description: 'Manage users and permissions',
            icon: '👤',
            action: () => console.log('User Management'),
            roles: ['Admin']
        },
        {
            id: 'reports',
            title: 'Reports',
            description: 'Generate and view reports',
            icon: '📋',
            action: () => console.log('Reports'),
            roles: ['Admin', 'Scorer']
        },
        {
            id: 'settings',
            title: 'Settings',
            description: 'Configure system settings',
            icon: '⚙️',
            action: () => console.log('Settings'),
            roles: ['Admin']
        }
    ];

    const filteredItems = dashboardItems.filter(item =>
        item.roles.includes(user?.role)
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 font-sans text-white">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-md border-b border-white/20 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">Dashboard</h1>
                        <div className="flex items-center gap-2 text-sm sm:text-base">
                            <span>Welcome, {user?.name}</span>
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                                {user?.role}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="flex flex-wrap gap-2 sm:gap-4">
                    {[
                        { id: 'quick-actions', label: 'Quick Actions' },
                        { id: 'recent', label: 'Recent Activity' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/40 ${activeTab === tab.id
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'bg-white/10 hover:bg-white/20'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Main Content */}
            < main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" >

                {
                    activeTab === 'quick-actions' && (
                        <div>
                            <h2 className="text-white text-xl sm:text-2xl mb-6">Quick Actions</h2>
                            <div className="space-y-3 sm:space-y-4">
                                {filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white bg-opacity-90 rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 shadow-lg hover:transform hover:translate-x-2 hover:shadow-xl"
                                        onClick={item.action}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-2xl sm:text-3xl bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
                                                {item.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">{item.title}</h3>
                                                <p className="text-gray-600 text-sm sm:text-base">{item.description}</p>
                                            </div>
                                            <div className="text-blue-600 text-xl sm:text-2xl font-bold hidden sm:block">→</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'recent' && (
                        <div>
                            <h2 className="text-white text-xl sm:text-2xl mb-6">Recent Activity</h2>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="bg-white bg-opacity-90 rounded-xl p-4 sm:p-6 shadow-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="text-2xl sm:text-3xl bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
                                            👥
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">New team created</h4>
                                            <p className="text-gray-600 text-sm sm:text-base">Team "Lightning Bolts" was created 2 hours ago</p>
                                        </div>
                                        <div className="text-gray-500 text-xs sm:text-sm font-medium flex-shrink-0">2h ago</div>
                                    </div>
                                </div>
                                <div className="bg-white bg-opacity-90 rounded-xl p-4 sm:p-6 shadow-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="text-2xl sm:text-3xl bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
                                            ⚽
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">Match completed</h4>
                                            <p className="text-gray-600 text-sm sm:text-base">Thunder vs Lightning - Final score: 3-2</p>
                                        </div>
                                        <div className="text-gray-500 text-xs sm:text-sm font-medium flex-shrink-0">4h ago</div>
                                    </div>
                                </div>
                                <div className="bg-white bg-opacity-90 rounded-xl p-4 sm:p-6 shadow-lg">
                                    <div className="flex items-start gap-4">
                                        <div className="text-2xl sm:text-3xl bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
                                            🏆
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">Tournament started</h4>
                                            <p className="text-gray-600 text-sm sm:text-base">Summer Championship 2024 has begun</p>
                                        </div>
                                        <div className="text-gray-500 text-xs sm:text-sm font-medium flex-shrink-0">1d ago</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
};

export default AdminScorerDashboard;