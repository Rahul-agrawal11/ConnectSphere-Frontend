import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { sendOtp } from '../api/authApi';
import { useToast } from '../components/common/Toast';
import OAuthButtons from './OAuthButtons';
import './Login.css';
import './Register.css';

const Register = () => {
  const { addToast } = useToast();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email:    '',
    password: '',
    fullName: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!form.username.trim())       e.username = 'Username is required';
    else if (form.username.length < 3) e.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username))
      e.username = 'Only letters, numbers and underscores allowed';

    if (!form.email.trim())          e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';

    if (!form.password)              e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'At least 8 characters required';
    else if (!/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$/.test(form.password))
      e.password = 'Must include uppercase, lowercase, number & special character';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await sendOtp(form);
      addToast('OTP sent to your email!', 'success');
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__split">
        {/* Brand */}
        <div className="auth-page__brand">
          <div className="auth-page__brand-inner">
            <span className="auth-page__brand-icon">◈</span>
            <h1 className="auth-page__brand-name">ConnectSphere</h1>
            <p className="auth-page__brand-tagline">
              Join millions of people sharing moments and building connections.
            </p>
            <ul className="auth-page__features">
              <li>🌍 Connect with people worldwide</li>
              <li>📣 Share your voice and creativity</li>
              <li>📊 Discover trending topics</li>
              <li>🔒 Your privacy, your control</li>
            </ul>
          </div>
        </div>

        {/* Form */}
        <div className="auth-page__form-panel">
          <div className="auth-card card animate-fade-in">
            <div className="auth-card__header">
              <h2 className="auth-card__title">Create Account</h2>
              <p className="auth-card__subtitle">
                Fill in your details — we'll send an OTP to confirm your email.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="auth-card__fields">
                <div className="register-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      className="form-input"
                      placeholder="Rahul Agrawal"
                      value={form.fullName}
                      onChange={handleChange}
                      autoComplete="name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="username">Username *</label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      className={`form-input ${errors.username ? 'form-input--error' : ''}`}
                      placeholder="rahul_agrawal"
                      value={form.username}
                      onChange={handleChange}
                      autoComplete="username"
                      autoFocus
                    />
                    {errors.username && (
                      <span className="form-error">{errors.username}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">Email *</label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                    placeholder="rahul@example.com"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">Password *</label>
                  <div className="auth-card__pass-wrap">
                    <input
                      id="reg-password"
                      name="password"
                      type={showPass ? 'text' : 'password'}
                      className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                      placeholder="Min. 8 chars, include A-Z, 0-9, @#$"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="auth-card__pass-toggle"
                      onClick={() => setShowPass((p) => !p)}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="form-error">{errors.password}</span>
                  )}
                  <span className="form-hint">
                    At least 8 characters with uppercase, lowercase, number & special char
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
              >
                {loading
                  ? <><Loader2 size={18} className="spinner-icon" /> Sending OTP…</>
                  : 'Continue →'}
              </button>
            </form>

            <div className="auth-divider">
              <span className="auth-divider__text">or sign up with</span>
            </div>

            <OAuthButtons />

            <p className="auth-card__switch">
              Already have an account?{' '}
              <Link to="/login" className="auth-card__link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;