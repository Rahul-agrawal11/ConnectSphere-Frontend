import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { verifyOtp, sendOtp } from '../api/authApi';
import { useToast } from '../components/common/Toast';
import './Login.css';
import './VerifyOtp.css';

const VerifyOtp = () => {
  const { addToast } = useToast();
  const navigate     = useNavigate();
  const location     = useLocation();
  const email        = location.state?.email || '';

  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/register');
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (value, i) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[i] = value.slice(-1);
    setOtp(next);
    if (value && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      addToast('Please enter the complete 6-digit OTP', 'warning');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp({ email, otp: code });
      addToast('Account created successfully! Please log in.', 'success');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP';
      addToast(msg, 'error');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      // Re-send OTP requires the original registration data we don't have
      // So just inform user to go back and re-register
      addToast('Please go back to register again to resend OTP', 'info');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__split">
        <div className="auth-page__brand">
          <div className="auth-page__brand-inner">
            <span className="auth-page__brand-icon">◈</span>
            <h1 className="auth-page__brand-name">Verify Email</h1>
            <p className="auth-page__brand-tagline">
              We sent a 6-digit code to your email. Enter it to complete registration.
            </p>
          </div>
        </div>

        <div className="auth-page__form-panel">
          <div className="auth-card card animate-fade-in">
            <div className="auth-card__header">
              <h2 className="auth-card__title">Enter OTP</h2>
              <p className="auth-card__subtitle">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="otp-grid" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`otp-input ${digit ? 'otp-input--filled' : ''}`}
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    aria-label={`OTP digit ${i + 1}`}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading || otp.join('').length < 6}
                style={{ marginTop: 28 }}
              >
                {loading
                  ? <><Loader2 size={18} className="spinner-icon" /> Verifying…</>
                  : 'Verify & Create Account'}
              </button>
            </form>

            <div className="otp-footer">
              <p className="auth-card__switch">
                Didn't receive the code?{' '}
                <button
                  className="auth-card__link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending
                    ? <><RefreshCw size={12} /> Resending…</>
                    : 'Go back & resend'}
                </button>
              </p>
              <p className="auth-card__switch" style={{ marginTop: 8 }}>
                <Link to="/register" className="auth-card__link">← Back to Register</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;