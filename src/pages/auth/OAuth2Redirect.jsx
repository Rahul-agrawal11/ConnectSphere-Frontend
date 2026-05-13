import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';

export default function OAuth2Redirect() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const processed = useRef(false);
  const { handleOAuthSuccess } = useAuth();

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = params.get('token');
    const userId = params.get('userId');

    if (!token || !userId) {
      navigate('/login?error=oauth2', { replace: true });
      return;
    }

    localStorage.setItem('cs_token', token);
    localStorage.removeItem('cs_refresh');

    const basicUser = {
      userId: Number(userId),
      username: null,
      email: null,
      role: 'USER',
      profilePicUrl: null,
      fullName: null,
    };

    localStorage.setItem('cs_user', JSON.stringify(basicUser));
    handleOAuthSuccess(token, basicUser);

    navigate('/feed', { replace: true });
  }, [params, navigate, handleOAuthSuccess]);

  return (
    <div className="oauth-redirect-page">
      <Spinner size="lg" />
      <p className="muted-text">Completing sign-in…</p>
    </div>
  );
}
