import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiEye, FiEyeOff, FiLoader, FiLock } from 'react-icons/fi';

import { VideoSection } from '../../components/Auth/VideoSection';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const { resetPassword, validateResetToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const hasValidLinkShape = useMemo(() => Boolean(uid && token), [uid, token]);

  useEffect(() => {
    if (!hasValidLinkShape) {
      setTokenError('This reset link is incomplete or invalid. Request a fresh one from the forgot-password page.');
      return;
    }

    let isMounted = true;

    const runValidation = async () => {
      setValidatingToken(true);
      const result = await validateResetToken(uid, token);
      if (!isMounted) {
        return;
      }
      setTokenError(result.valid ? '' : result.message);
      setValidatingToken(false);
    };

    runValidation();

    return () => {
      isMounted = false;
    };
  }, [hasValidLinkShape, token, uid, validateResetToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (tokenError || validatingToken) {
      return;
    }
    setSubmitting(true);
    const success = await resetPassword(uid, token, newPassword, confirmPassword);
    setSubmitting(false);

    if (success) {
      navigate('/login', { replace: true });
    }
  };

  return (
    <motion.div
      className="ff-auth-shell flex min-h-[720px] w-full flex-col gap-4 p-4 lg:h-[700px] lg:flex-row"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[28px] lg:w-[52%]">
        <VideoSection
          titleLead="Choose"
          titleHighlight="Password"
          subtitle="Create a fresh password for your Fit Feast account and jump straight back into your dashboard."
        />
      </div>

      <div className="ff-auth-form flex h-full w-full flex-col justify-center rounded-[28px] px-5 py-8 sm:px-8 lg:w-[48%]">
        <span className="inline-flex w-fit rounded-full border border-[color:var(--ff-border)] bg-[color:var(--ff-surface)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[color:var(--ff-text)]">
          Secure reset
        </span>
        <h1 className="mt-5 text-3xl font-bold text-[color:var(--ff-text)] md:text-4xl">
          Set a new password
        </h1>
        <p className="mt-2 text-sm leading-7 text-[color:var(--ff-muted)]">
          Pick a strong password you have not used before.
        </p>

        {!hasValidLinkShape || tokenError ? (
          <div className="mt-8 rounded-[22px] border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            {tokenError || 'This reset link is incomplete or invalid. Request a fresh one from the forgot-password page.'}
          </div>
        ) : validatingToken ? (
          <div className="mt-8 rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <div className="flex items-center gap-2">
              <FiLoader className="animate-spin" />
              <span>Validating your reset link...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--ff-text)]">New password</span>
              <div className="flex items-center gap-3 rounded-[20px] border border-[color:var(--ff-border)] bg-[color:var(--ff-surface)] px-4 py-3 backdrop-blur-md">
                <FiLock className="text-primary/70" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full bg-transparent text-sm text-[color:var(--ff-text)] outline-none placeholder-[color:var(--ff-soft)]"
                  placeholder="Enter a new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((value) => !value)}
                  className="text-primary/70 transition hover:text-primary"
                >
                  {showNewPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[color:var(--ff-text)]">Confirm password</span>
              <div className="flex items-center gap-3 rounded-[20px] border border-[color:var(--ff-border)] bg-[color:var(--ff-surface)] px-4 py-3 backdrop-blur-md">
                <FiLock className="text-primary/70" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full bg-transparent text-sm text-[color:var(--ff-text)] outline-none placeholder-[color:var(--ff-soft)]"
                  placeholder="Re-enter the password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="text-primary/70 transition hover:text-primary"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="ff-button-primary w-full justify-center py-4 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <FiLoader className="animate-spin" />
                  Updating password...
                </>
              ) : (
                'Save new password'
              )}
            </button>
          </form>
        )}

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-accent"
          >
            <FiArrowLeft />
            Request another link
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ff-muted)] transition hover:text-[color:var(--ff-text)]"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ResetPassword;
