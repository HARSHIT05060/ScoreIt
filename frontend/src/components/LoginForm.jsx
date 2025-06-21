import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

const LoginForm = () => {
    const { user, login } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', form);
            login(res.data);
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            setError(error.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            switch (user.role) {
                case 'Admin':
                case 'Scorer':
                    navigate('/create-team');
                    break;
                case 'Viewer':
                    navigate('/viewer-dashboard');
                    break;
                default:
                    setError('Unknown user role');
            }
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 to-blue-600">
            <div className="flex flex-col md:flex-row bg-white rounded-xl overflow-hidden shadow-lg max-w-4xl w-full animate-fade-in-up">
                {/* Left Cricket Side */}
                <div className="md:w-1/2 bg-blue-900 flex flex-col justify-center items-center p-6 text-white relative">
                    <div className="text-center space-y-4">
                        <div className="bg-white p-4 rounded-full w-28 h-28 mx-auto flex items-center justify-center">
                            <img src={logo} alt="Cricket Helmet" className="w-full" />
                        </div>
                        <h2 className="text-2xl font-bold">Cricket Score Portal</h2>
                        <p className="text-sm opacity-80">Login to manage your matches, teams, and stats</p>
                    </div>
                </div>

                {/* Right Login Form */}
                <div className="md:w-1/2 p-8">
                    <h2 className="text-2xl font-semibold text-center mb-6 text-blue-800">Login to Your Account</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-2 text-white rounded-lg font-medium transition duration-300 ${
                                isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>

                        {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
                    </form>

                    <p className="text-center text-sm text-gray-600 mt-6">
                        New user?{' '}
                        <Link to="/register" className="text-blue-600 hover:underline">
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
