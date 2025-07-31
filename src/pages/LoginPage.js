// --- FILE: src/pages/LoginPage.js ---
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Hardcoded check for specific credentials
        if (email !== 'libraryadmin@wiras.in' || password !== 'admin@321') {
            return setError('Invalid email or password.');
        }

        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/admin');
        } catch (err) {
            setError('Failed to log in. Check Firebase credentials or network.');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="card-body">
                    <h2 className="card-title text-center mb-4">Admin Login</h2>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                className="form-control"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button disabled={loading} className="btn btn-primary btn-block" type="submit">
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
