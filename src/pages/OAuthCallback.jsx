import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getMyProfile } from '../api/authApi';
import { useToast } from '../components/common/Toast';
import Spinner from '../components/common/Spinner';
import './OAuthCallback.css';

/**
 * Backend redirects to:
 *   http://localhost:5173/oauth2/callback?token=ACCESS_TOKEN&userId=123
 *
 * No refreshToken is sent by the backend — we just store the access token.
 */
const OAuthCallback = () => {
  const [searchParams]    = useSearchParams();
  const { loginUser }     = useAuth();
  const { addToast }      = useToast();
  const navigate          = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const token      = searchParams.get('token')
                    || searchParams.get('accessToken')
                    || searchParams.get('access_token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      const msg = decodeURIComponent(errorParam);
      setError(msg);
      addToast(`OAuth failed: ${msg}`, 'error');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!token) {
      setError('No token received from OAuth provider. Please try again.');
      addToast('OAuth login failed — no token received', 'error');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // FIX: Store token FIRST so getMyProfile() has Authorization header
    localStorage.setItem('accessToken', token);

    try {
      const res     = await getMyProfile();
      const profile = res.data.data;

      loginUser({
        accessToken:  token,
        refreshToken: '',
        userId:       profile.id,
        username:     profile.username,
        email:        profile.email,
        role:         profile.role,
      });

      addToast(`Welcome, ${profile.username}! 🎉`, 'success');
    } catch (err) {
      // Profile fetch failed — still log in with userId from URL
      const userId = searchParams.get('userId');
      loginUser({
        accessToken:  token,
        refreshToken: '',
        userId:       userId,
        username:     'User',
        email:        '',
        role:         'USER',
      });
      addToast('Logged in via OAuth!', 'success');
    }

    // FIX: flush React state from loginUser before ProtectedRoute checks auth
    setTimeout(() => navigate('/', { replace: true }), 0);
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
            <p className="oauth-callback__msg">
              Please wait while we complete your sign-in.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;