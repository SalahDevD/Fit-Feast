import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';

const normalizeNextPath = (value) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
};

const SocialAuthCallback = () => {
  const { completeOAuthLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const hasStartedRef = useRef(false);

  const parsed = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.startsWith('#') ? location.hash.slice(1) : '');

    return {
      error: searchParams.get('error') || hashParams.get('error') || '',
      accessToken: hashParams.get('access_token') || '',
      refreshToken: hashParams.get('refresh_token') || '',
      nextPath: normalizeNextPath(hashParams.get('next') || '/'),
    };
  }, [location.hash, location.search]);

  useEffect(() => {
    let isMounted = true;

    const finishOAuth = async () => {
      if (hasStartedRef.current) {
        return;
      }
      hasStartedRef.current = true;

      if (parsed.error) {
        if (isMounted) {
          setError(parsed.error);
        }
        toast.error(parsed.error);
        return;
      }

      if (!parsed.accessToken || !parsed.refreshToken) {
        const message = 'The social sign-in response was incomplete.';
        if (isMounted) {
          setError(message);
        }
        toast.error(message);
        return;
      }

      const success = await completeOAuthLogin(parsed.accessToken, parsed.refreshToken);
      if (success) {
        navigate(parsed.nextPath, { replace: true });
      } else if (isMounted) {
        setError('The social sign-in could not be completed.');
      }
    };

    finishOAuth();

    return () => {
      isMounted = false;
    };
  }, [completeOAuthLogin, navigate, parsed]);

  return (
    <div className="ff-panel ff-panel--strong mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center rounded-[32px] px-8 py-12 text-center">
      {error ? (
        <>
          <h1 className="text-3xl font-bold text-[color:var(--ff-text)]">Social sign-in failed</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[color:var(--ff-muted)]">{error}</p>
          <Link to="/login" className="ff-button-primary mt-8">
            Back to login
          </Link>
        </>
      ) : (
        <>
          <FiLoader className="text-4xl text-primary animate-spin" />
          <h1 className="mt-6 text-3xl font-bold text-[color:var(--ff-text)]">Completing sign-in</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[color:var(--ff-muted)]">
            We are finalizing your secure session and loading your Fit Feast account.
          </p>
        </>
      )}
    </div>
  );
};

export default SocialAuthCallback;
