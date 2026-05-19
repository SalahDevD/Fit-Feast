import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheckCircle, FiLoader, FiMail, FiRefreshCw } from 'react-icons/fi';

import { VideoSection } from '../../components/Auth/VideoSection';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const canSubmit = useMemo(
    () => Boolean(email.trim()) && !submitting,
    [email, submitting]
  );

  const sendResetEmail = async () => {
    if (!email.trim()) {
      return;
    }

    setSubmitting(true);
    const response = await forgotPassword(email.trim());
    if (response?.message) {
      setSentEmail(email.trim());
    }
    setSubmitting(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendResetEmail();
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
          titleLead="Reset"
          titleHighlight="Access"
          subtitle="Enter your account email and we will send a secure password reset link."
        />
      </div>

      <div className="ff-auth-form flex h-full w-full flex-col justify-center rounded-[28px] px-5 py-8 sm:px-8 lg:w-[48%]">
        <span className="inline-flex w-fit rounded-full border border-[color:var(--ff-border)] bg-[color:var(--ff-surface)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[color:var(--ff-text)]">
          Password recovery
        </span>
        <h1 className="mt-5 text-3xl font-bold text-[color:var(--ff-text)] md:text-4xl">
          Forgot your password?
        </h1>
        <p className="mt-2 text-sm leading-7 text-[color:var(--ff-muted)]">
          We&apos;ll email you a secure reset link so you can choose a new password without leaving
          the app flow.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[color:var(--ff-text)]">Email address</span>
            <div className="flex items-center gap-3 rounded-[20px] border border-[color:var(--ff-border)] bg-[color:var(--ff-surface)] px-4 py-3 backdrop-blur-md">
              <FiMail className="text-primary/70" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent text-sm text-[color:var(--ff-text)] outline-none placeholder-[color:var(--ff-soft)]"
                placeholder="you@example.com"
                required
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="ff-button-primary w-full justify-center py-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <FiLoader className="animate-spin" />
                Sending reset email...
              </>
            ) : (
              'Send reset email'
            )}
          </button>
        </form>

        {sentEmail ? (
          <div className="mt-6 rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-100">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-400/15 p-2 text-emerald-200">
                <FiCheckCircle />
              </div>
              <div>
                <p className="font-semibold">Reset email requested</p>
                <p className="mt-2 leading-6 text-emerald-50/90">
                  If an account exists for <span className="font-semibold">{sentEmail}</span>, the
                  reset link has been sent there.
                </p>
                <button
                  type="button"
                  onClick={sendResetEmail}
                  disabled={submitting}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition hover:text-white disabled:opacity-60"
                >
                  <FiRefreshCw />
                  Resend email
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-accent"
          >
            <FiArrowLeft />
            Back to sign in
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ForgotPassword;
