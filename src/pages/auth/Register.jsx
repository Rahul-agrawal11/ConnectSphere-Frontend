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
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className={`w-full px-4 py-2.5 border rounded-xl text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-300 transition
          ${errors[key] ? 'border-red-300' : 'border-gray-200'}`}
            />
            {errors[key] && (
                <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="text-2xl font-bold text-blue-600">
                        ConnectSphere
                    </Link>
                    <p className="text-gray-500 text-sm mt-1">Create your account</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {field('fullName', 'Full Name (optional)', 'text', 'John Doe')}
                        {field('username', 'Username', 'text', 'johndoe')}
                        {field('email', 'Email', 'email', 'john@example.com')}
                        {field('password', 'Password', 'password', 'Min 8 characters')}

                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 text-red-700
                              rounded-xl p-3 text-sm">
                                {errors.general}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-xl
                         font-medium hover:bg-blue-700 transition
                         disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account…' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-5">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}