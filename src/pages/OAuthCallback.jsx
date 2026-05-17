import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getMyProfile } from '../api/authApi';
import { useToast } from '../components/common/Toast';
import Spinner from '../components/common/Spinner';
import './OAuthCallback.css';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { loginUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return {};
    }
  };

  const handleCallback = async () => {
    const token =
      searchParams.get('token') ||
      searchParams.get('accessToken') ||
      searchParams.get('access_token');

    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      addToast(`OAuth failed: ${errorParam}`, 'error');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!token) {
      setError('No token received from OAuth provider.');
      addToast('OAuth login failed — no token received', 'error');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    localStorage.setItem('accessToken', token);
    localStorage.setItem('cs_token', token);

    const payload = decodeToken(token);
    const fallbackUser = {
      id: searchParams.get('userId') || payload.sub,
      username: payload.username || payload.email?.split('@')[0] || 'user',
      email: payload.email || '',
      role: payload.role || 'USER',
    };

    try {
      const res = await getMyProfile();
      const profile = res.data.data;

      const user = {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        role: profile.role,
      };

      localStorage.setItem('cs_user', JSON.stringify(user));

      loginUser({
        accessToken: token,
        refreshToken: '',
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } catch {
      localStorage.setItem('cs_user', JSON.stringify(fallbackUser));

      loginUser({
        accessToken: token,
        refreshToken: '',
        userId: fallbackUser.id,
        username: fallbackUser.username,
        email: fallbackUser.email,
        role: fallbackUser.role,
      });
    }

    addToast('Logged in successfully!', 'success');
    navigate('/feed', { replace: true });
  };

  return (
    <div className="oauth-callback">
      <div className="oauth-callback__card">
        {error ? (
          <>
            <div className="oauth-callback__icon oauth-callback__icon--error">✕</div>
            <h2 className="oauth-callback__title">OAuth Login Failed</h2>
            <p className="oauth-callback__msg">{error}</p>
            <p className="oauth-callback__redirect">Redirecting to login…</p>
          </>
        ) : (
          <>
            <Spinner size={44} />
            <h2 className="oauth-callback__title">Signing you in…</h2>
            <p className="oauth-callback__msg">Please wait while we complete your sign-in.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
