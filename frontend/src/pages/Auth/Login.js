import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiLoader, FiLock, FiMail } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { SiGithub } from 'react-icons/si';

import { VideoSection } from '../../components/Auth/VideoSection';
import { useAuth } from '../../context/AuthContext';

const normalizeNextPath = (value) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
};

const socialOptions = [
  { provider: 'google', label: 'Google', icon: FcGoogle },
  { provider: 'github', label: 'GitHub', icon: SiGithub },
];

const Login = () => {
  const { login, startSocialLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = useMemo(
    () => normalizeNextPath(new URLSearchParams(location.search).get('next') || '/'),
    [location.search]
  );

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [socialProvider, setSocialProvider] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const success = await login(formData.email, formData.password);
    setLoading(false);

    if (success) {
      navigate(nextPath, { replace: true });
    }
  };

  const handleSocialLogin = async (provider) => {
    setSocialProvider(provider);
    const started = await startSocialLogin(provider, nextPath);
    if (!started) {
      setSocialProvider('');
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
        <VideoSection />
      </div>

      <div className="ff-auth-form flex h-full w-full flex-col justify-center rounded-[28px] px-5 py-8 sm:px-8 lg:w-[48%]">
        <span className="inline-flex w-fit rounded-full border border-[color:var(--ff-border)] bg-[color:var(--ff-surface)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[color:var(--ff-text)]">
          Premium access
        </span>
        <h1 className="mt-5 text-3xl font-bold text-[color:var(--ff-text)] md:text-4xl">
          Welcome Back
        </h1>
        <p className="mt-2 text-sm leading-7 text-[color:var(--ff-muted)]">
          Sign in to continue your meal planning, checkout, and wellness flow.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {socialOptions.map(({ provider, label, icon: Icon }) => (
            <button
              key={provider}
              type="button"
              onClick={() => handleSocialLogin(provider)}
              disabled={Boolean(socialProvider)}
              className="btn-glass flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-[color:var(--ff-text)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {socialProvider === provider ? <FiLoader className="animate-spin" /> : <Icon size={18} />}
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span className="text-xs text-[color:var(--ff-soft)]">or continue with email</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[color:var(--ff-text)]">Email address</span>
            <div className="flex items-center gap-3 rounded-[20px] border border-[color:var(--ff-border)] bg-[color:var(--ff-surface)] px-4 py-3 backdrop-blur-md">
              <FiMail className="text-primary/70" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-transparent text-sm text-[color:var(--ff-text)] outline-none placeholder-[color:var(--ff-soft)]"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[color:var(--ff-text)]">Password</span>
            <div className="flex items-center gap-3 rounded-[20px] border border-[color:var(--ff-border)] bg-[color:var(--ff-surface)] px-4 py-3 backdrop-blur-md">
              <FiLock className="text-primary/70" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-transparent text-sm text-[color:var(--ff-text)] outline-none placeholder-[color:var(--ff-soft)]"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-primary/70 transition hover:text-primary"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-xs text-[color:var(--ff-muted)]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border border-primary/50 bg-[color:var(--ff-surface)] accent-primary"
              />
              Remember me
            </label>

            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-primary transition hover:text-accent"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || Boolean(socialProvider)}
            className="ff-button-primary w-full justify-center py-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="pt-6 text-center text-xs text-[color:var(--ff-muted)]">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary transition hover:text-accent">
            Sign up
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default Login;
