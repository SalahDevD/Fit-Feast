import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiLoader, FiLock, FiMail, FiPhone, FiUser } from 'react-icons/fi';
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

const Register = () => {
  const { register, startSocialLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = useMemo(
    () => normalizeNextPath(new URLSearchParams(location.search).get('next') || '/'),
    [location.search]
  );

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [socialProvider, setSocialProvider] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name] && !current.form) {
        return current;
      }
      const next = { ...current };
      delete next[name];
      delete next.form;
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!formData.email) {
      nextErrors.email = 'Email is required.';
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    }
    if (!formData.password2) {
      nextErrors.password2 = 'Please confirm your password.';
    }
    if (formData.password && formData.password2 && formData.password !== formData.password2) {
      nextErrors.password2 = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    const success = await register(formData);
    setLoading(false);

    if (success) {
      navigate(`/login?next=${encodeURIComponent(nextPath)}`, { replace: true });
    } else {
      setErrors({
        form: 'We could not create your account. Please check your information and try again.',
      });
    }
  };

  const handleSocialLogin = async (provider) => {
    setSocialProvider(provider);
    const started = await startSocialLogin(provider, nextPath);
    if (!started) {
      setSocialProvider('');
    }
  };

  const renderInput = ({
    name,
    label,
    icon: Icon,
    type = 'text',
    placeholder,
    autoComplete,
    rightAction,
  }) => (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[color:var(--ff-text)]">{label}</span>
      <div className="flex items-center gap-3 rounded-[20px] border border-[color:var(--ff-border)] bg-[color:var(--ff-surface)] px-4 py-3 backdrop-blur-md">
        <Icon className="text-primary/70" />
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          className="w-full bg-transparent text-sm text-[color:var(--ff-text)] outline-none placeholder-[color:var(--ff-soft)]"
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={name === 'email' || name === 'password' || name === 'password2'}
        />
        {rightAction}
      </div>
      {errors[name] ? <p className="mt-2 text-xs text-red-200">{errors[name]}</p> : null}
    </label>
  );

  return (
    <motion.div
      className="ff-auth-shell flex min-h-[760px] w-full flex-col gap-4 p-4 lg:h-[720px] lg:flex-row"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="relative min-h-[300px] w-full overflow-hidden rounded-[28px] lg:h-full lg:w-[52%]">
        <VideoSection
          videoSrc="/Auth_Vid/Register.mp4"
          titleLead="Join"
          titleHighlight="FitFeast"
          subtitle="Create your account to unlock meal plans, nutrition tracking, and wellness challenges tailored to you."
        />
      </div>

      <div className="ff-auth-form flex h-full w-full flex-col justify-center rounded-[28px] px-5 py-8 sm:px-8 lg:w-[48%]">
        <span className="inline-flex w-fit rounded-full border border-[color:var(--ff-border)] bg-[color:var(--ff-surface)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[color:var(--ff-text)]">
          New member setup
        </span>
        <h1 className="mt-5 text-3xl font-bold text-[color:var(--ff-text)] md:text-4xl">
          Create Account
        </h1>
        <p className="mt-2 text-sm leading-7 text-[color:var(--ff-muted)]">
          Build your profile and unlock a more premium Fit Feast experience.
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

        {errors.form ? (
          <div className="mb-4 rounded-[20px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {errors.form}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {renderInput({
              name: 'first_name',
              label: 'First name',
              icon: FiUser,
              placeholder: 'Your first name',
              autoComplete: 'given-name',
            })}

            {renderInput({
              name: 'last_name',
              label: 'Last name',
              icon: FiUser,
              placeholder: 'Your last name',
              autoComplete: 'family-name',
            })}

            {renderInput({
              name: 'email',
              label: 'Email address',
              icon: FiMail,
              type: 'email',
              placeholder: 'you@example.com',
              autoComplete: 'email',
            })}

            {renderInput({
              name: 'phone',
              label: 'Phone number',
              icon: FiPhone,
              type: 'tel',
              placeholder: '+212 ...',
              autoComplete: 'tel',
            })}

            {renderInput({
              name: 'password',
              label: 'Password',
              icon: FiLock,
              type: showPassword ? 'text' : 'password',
              placeholder: 'Create a password',
              autoComplete: 'new-password',
              rightAction: (
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-primary/70 transition hover:text-primary"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              ),
            })}

            {renderInput({
              name: 'password2',
              label: 'Confirm password',
              icon: FiLock,
              type: showConfirmPassword ? 'text' : 'password',
              placeholder: 'Repeat your password',
              autoComplete: 'new-password',
              rightAction: (
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="text-primary/70 transition hover:text-primary"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              ),
            })}
          </div>

          <button
            type="submit"
            disabled={loading || Boolean(socialProvider)}
            className="ff-button-primary w-full justify-center py-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="pt-6 text-center text-xs text-[color:var(--ff-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary transition hover:text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default Register;
