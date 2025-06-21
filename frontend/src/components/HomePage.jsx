import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col justify-between items-center text-center bg-gradient-to-br from-blue-900 to-blue-600 text-white p-6 font-sans">
            <header className="mt-16 animate-fade-in-up">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <span className="text-5xl animate-bounce">🏏</span>
                    <h1 className="text-4xl font-bold">Gully Cricket Scoring App</h1>
                </div>
                <p className="text-lg text-white/80">Track Scores. Manage Players. Celebrate Victories.</p>
            </header>

            <main className="my-10 animate-fade-in-up delay-200">
                <button
                    onClick={handleGetStarted}
                    className="bg-yellow-400 text-black px-8 py-3 rounded-xl text-lg font-medium shadow-md hover:bg-yellow-300 transition duration-300"
                >
                    Get Started
                </button>
            </main>

            <footer className="mb-6 text-sm text-white/60 animate-fade-in-up delay-500">
                © 2025 GullyCricket. All rights reserved.
            </footer>
        </div>
    );
};

export default HomePage;
