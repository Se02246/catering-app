import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/admin');
        }
    }, [navigate]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'admin' && password === '160902Se!') {
            localStorage.setItem('token', 'admin-token');
            navigate('/admin');
        } else {
            alert('Credenziali non valide');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '4rem', position: 'relative' }}>
            <button
                onClick={() => navigate('/')}
                className="btn btn-outline"
                style={{ position: 'absolute', top: '-3rem', left: '0', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', color: 'var(--color-primary-dark)' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Torna alla Home
            </button>
            <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Admin Login</h1>
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem' }}
                        />
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Accedi</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
