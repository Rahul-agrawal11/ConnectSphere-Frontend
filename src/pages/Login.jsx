import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { login } from '../api/authApi';
import { useToast } from '../components/common/Toast';
import OAuthButtons from './OAuthButtons';
import './Login.css';

const Login = () => {
  const { loginUser }    = useAuth();
  const { addToast }     = useToast();
  const navigate         = useNavigate();

  const [form, setForm]         = useState({ emailOrUsername: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!form.emailOrUsername.trim()) e.emailOrUsername = 'Email or username is required';
    if (!form.password)               e.password         = 'Password is required';
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
      const res  = await login(form);
      const data = res.data.data;
      loginUser(data);
      addToast(`Welcome back, ${data.username}!`, 'success');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__split">
        {/* Brand panel */}
        <div className="auth-page__brand">
          <div className="auth-page__brand-inner">
            <span className="auth-page__brand-icon">◈</span>
            <h1 className="auth-page__brand-name">ConnectSphere</h1>
            <p className="auth-page__brand-tagline">
              Share Moments. Build Connections. Inspire Communities.
            </p>
            <ul className="auth-page__features">
              <li>📸 Share posts, photos & stories</li>
              <li>💬 Comment & react with friends</li>
              <li>🔔 Real-time notifications</li>
              <li>#️⃣ Discover trending hashtags</li>
            </ul>
          </div>
        </div>

        {/* Form panel */}
        <div className="auth-page__form-panel">
          <div className="auth-card card animate-fade-in">
            <div className="auth-card__header">
              <h2 className="auth-card__title">Sign In</h2>
              <p className="auth-card__subtitle">Welcome back! Sign in to continue.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="auth-card__fields">
                <div className="form-group">
                  <label className="form-label" htmlFor="emailOrUsername">
                    Email or Username
                  </label>
                  <input
                    id="emailOrUsername"
                    name="emailOrUsername"
                    type="text"
                    className={`form-input ${errors.emailOrUsername ? 'form-input--error' : ''}`}
                    placeholder="you@example.com or @username"
                    value={form.emailOrUsername}
                    onChange={handleChange}
                    autoComplete="username"
                    autoFocus
                  />
                  {errors.emailOrUsername && (
                    <span className="form-error">{errors.emailOrUsername}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="password">Password</label>
                  <div className="auth-card__pass-wrap">
                    <input
                      id="password"
                      name="password"
                      type={showPass ? 'text' : 'password'}
                      className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="auth-card__pass-toggle"
                      onClick={() => setShowPass((p) => !p)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="form-error">{errors.password}</span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
              >
                {loading
                  ? <><Loader2 size={18} className="spinner-icon" /> Signing in…</>
                  : 'Sign In'}
              </button>
            </form>

            <div className="auth-divider">
              <span className="auth-divider__text">or continue with</span>
            </div>

            <OAuthButtons />

            <p className="auth-card__switch">
              Don't have an account?{' '}
              <Link to="/register" className="auth-card__link">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;