import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/logo.png';

const RegisterForm = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Viewer' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await api.post('/auth/register', form);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 to-green-600">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center animate-fade-in-up">
                    <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-green-600 mb-2">Registration Successful!</h2>
                    <p className="text-gray-600 mb-2">Your account has been created as a Viewer.</p>
                    <p className="text-sm text-gray-500">Redirecting to login page...</p>
                    <div className="mt-4">
                        <div className="animate-pulse bg-green-200 h-1 rounded-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 to-blue-600">
            <div className="flex flex-col md:flex-row bg-white rounded-xl overflow-hidden shadow-lg max-w-4xl w-full animate-fade-in-up">
                {/* Left Cricket Side */}
                <div className="md:w-1/2 bg-blue-900 flex flex-col justify-center items-center p-6 text-white relative">
                    <div className="text-center space-y-4">
                        <div className="bg-white p-4 rounded-full w-28 h-28 mx-auto flex items-center justify-center">
                            <img src={logo} alt="Cricket Helmet" className="w-full" />
                        </div>
                        <h2 className="text-2xl font-bold">Join Cricket Score Portal</h2>
                        <p className="text-sm opacity-80">Create your account to start tracking matches and stats</p>
                        <div className="mt-6 bg-blue-800 bg-opacity-50 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                </svg>
                                <span className="text-sm font-medium">New User Info</span>
                            </div>
                            <p className="text-xs opacity-90">
                                All new accounts are created as <strong>Viewers</strong>. Contact an admin to upgrade your role to Scorer or Admin.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Registration Form */}
                <div className="md:w-1/2 p-8">
                    <h2 className="text-2xl font-semibold text-center mb-2 text-blue-800">Create Your Account</h2>
                    <p className="text-center text-gray-600 text-sm mb-6">Join the cricket scoring community</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Role Display (Read-only) */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Account Type</label>
                            <div className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 flex items-center justify-between">
                                <span>Viewer</span>
                                <div className="flex items-center">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">Default</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">All new accounts start as Viewers</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 text-white rounded-lg font-medium transition duration-300 flex items-center justify-center ${isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                                    </svg>
                                    Register as Viewer
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                                </svg>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 hover:underline font-medium transition duration-200">
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;