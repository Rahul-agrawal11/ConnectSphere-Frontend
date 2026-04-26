import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';

/**
 * OAuth2Redirect
 *
 * The backend (OAuth2AuthenticationSuccessHandler) redirects here after
 * a successful OAuth2 login with query params:
 *   ?token=<accessToken>&userId=<userId>
 *
 * We store the token, fetch the full profile, populate AuthContext, then
 * navigate to /feed.
 *
 * Note: No refresh token is issued for OAuth2 logins in the current backend
 * implementation. The access token is valid for 24 hours (configurable).
 */
export default function OAuth2Redirect() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  // Use a ref to prevent double-invocation in React StrictMode
  const processed = useRef(false);

  // We need setToken/setUser but AuthContext only exposes updateUser.
  // Use the login-like helper we added below.
  const { handleOAuthSuccess } = useAuth();

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = params.get('token');

    if (!token) {
      navigate('/login?error=oauth2', { replace: true });
      return;
    }

    // Store the token immediately so apiClient can use it for getProfile()
    localStorage.setItem('cs_token', token);
    // No refresh token from OAuth2 in current backend implementation
    localStorage.removeItem('cs_refresh');

    authApi
      .getProfile()
      .then(res => {
        const u = res.data.data; // ApiResponse<UserProfileResponse>.data
        const userObj = {
          userId:        u.id,
          username:      u.username,
          email:         u.email,
          role:          u.role,
          profilePicUrl: u.profilePicUrl,
          fullName:      u.fullName,
        };
        localStorage.setItem('cs_user', JSON.stringify(userObj));
        handleOAuthSuccess(token, userObj);
        navigate('/feed', { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('cs_token');
        localStorage.removeItem('cs_user');
        navigate('/login?error=oauth2', { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-gray-500 text-sm">Completing sign-in…</p>
    </div>
  );
}