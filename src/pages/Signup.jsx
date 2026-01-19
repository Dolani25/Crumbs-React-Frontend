
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api';
import './Auth.css';

const Signup = ({ setAuth }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    const { username, email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            await signup(username, email, password);
            setAuth(true);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || 'Signup Failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Join Crumbs</h1>
                <p className="auth-subtitle">Start eating the elephant today.</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={username}
                            onChange={onChange}
                            required
                            placeholder="StudentName"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            required
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            required
                            placeholder="••••••••"
                            minLength="6"
                        />
                    </div>
                    <button type="submit" className="auth-btn">Create Account</button>
                </form>
                <div className="auth-footer">
                    Already have an account? <span onClick={() => navigate('/login')}>Log In</span>
                </div>
            </div>
        </div>
    );
};

export default Signup;
