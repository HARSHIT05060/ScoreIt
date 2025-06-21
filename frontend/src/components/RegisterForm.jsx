import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

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
            }, 2000); // Redirect to login after 2 seconds
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
                <h2 style={{ color: 'green' }}>Registration Successful!</h2>
                <p>Redirecting to login page...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <input 
                        name="name" 
                        placeholder="Full Name" 
                        value={form.name} 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '10px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <input 
                        name="email" 
                        type="email"
                        placeholder="Email" 
                        value={form.email} 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '10px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <input 
                        name="password" 
                        placeholder="Password" 
                        type="password" 
                        value={form.password} 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '10px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <select 
                        name="role" 
                        value={form.role} 
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px' }}
                    >
                        <option value="Viewer">Viewer</option>
                        <option value="Scorer">Scorer</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
                <button 
                    type="submit" 
                    disabled={isLoading}
                    style={{ 
                        width: '100%', 
                        padding: '12px', 
                        backgroundColor: '#28a745', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px',
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isLoading ? 'Registering...' : 'Register'}
                </button>
            </form>
            
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
                Already have an account? <Link to="/login" style={{ color: '#007bff' }}>Login here</Link>
            </p>
        </div>
    );
};

export default RegisterForm;