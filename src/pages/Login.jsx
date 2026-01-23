
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { login, googleLogin } from '../api';
import './Auth.css';

const Login = ({ setAuth }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    const { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const data = await login(email, password);
            // setAuth here propagates the user up to App.jsx
            // For now we assume setAuth triggers a re-loader or just sets true
            setAuth(true);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || 'Login Failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Continue your journey.</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={onSubmit}>
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
                        />
                    </div>
                    <button type="submit" className="auth-btn">Log In</button>
                </form>
                <div className="auth-footer">
                    Don't have an account? <span onClick={() => navigate('/signup')}>Sign Up</span>
                </div>

                <div className="google-auth-section" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <p style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>Or sign in with</p>
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            try {
                                await googleLogin(credentialResponse.credential);
                                setAuth(true);
                                navigate('/dashboard');
                            } catch (err) {
                                console.error("Google Login Failed", err);
                                setError("Google Login Failed");
                            }
                        }}
                        onError={() => {
                            console.log('Login Failed');
                            setError("Google Login Failed");
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
