import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: '', email: '', password: '', fullName: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        if (!form.username.trim()) e.username = 'Username is required';
        else if (!/^[a-zA-Z0-9_]+$/.test(form.username))
            e.username = 'Only letters, numbers, underscores';
        if (!form.email.trim()) e.email = 'Email is required';
        if (!form.password) e.password = 'Password is required';
        else if (form.password.length < 8)
            e.password = 'Min 8 characters';
        else if (!/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$/.test(form.password))
            e.password = 'Must include uppercase, lowercase, number, and special character (@#$%^&+=!)';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        try {
            await register(form);
            toast.success('Account created! Please log in.');
            navigate('/login');
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed';
            setErrors({ general: msg });
        } finally {
            setLoading(false);
        }
    };

    const field = (key, label, type = 'text', placeholder = '') => (
        <div className="form-group">
            <label className="form-label">
                {label}
            </label>
            <input
                type={type}
                value={form[key]}
                onChange={e => {
                    setForm(p => ({ ...p, [key]: e.target.value }));
                    setErrors(p => ({ ...p, [key]: '' }));
                }}
                placeholder={placeholder}
                className={`form-input ${errors[key] ? 'form-input--error' : ''}`.trim()}
            />
            {errors[key] && (
                <p className="form-field-error">{errors[key]}</p>
            )}
        </div>
    );

    return (
        <div className="auth-page">
            <div className="auth-shell">
                <div className="auth-header">
                    <Link to="/" className="auth-brand">
                        ConnectSphere
                    </Link>
                    <p className="auth-subtitle">Create your account</p>
                </div>

                <div className="auth-card">
                    <form onSubmit={handleSubmit} className="auth-form">
                        {field('fullName', 'Full Name (optional)', 'text', 'John Doe')}
                        {field('username', 'Username', 'text', 'johndoe')}
                        {field('email', 'Email', 'email', 'john@example.com')}
                        {field('password', 'Password', 'password', 'Min 8 characters')}

                        {errors.general && (
                            <div className="form-error">
                                {errors.general}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="primary-button primary-button--full"
                        >
                            {loading ? 'Creating account…' : 'Create Account'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Already have an account?{' '}
                        <Link to="/login" className="link-button">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
