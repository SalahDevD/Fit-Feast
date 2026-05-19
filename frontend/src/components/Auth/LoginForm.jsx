import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { SiGithub } from 'react-icons/si';

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  const inputVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <motion.div
      className="w-full md:w-1/2 h-full flex flex-col justify-center px-6 md:px-12 py-8 md:py-0 rounded-r-3xl md:rounded-r-3xl md:rounded-l-none rounded-l-3xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-white/60">Sign in to your account to continue</p>
      </motion.div>

      {/* Social Login Buttons */}
      <motion.div variants={itemVariants} className="flex gap-3 mb-8">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all duration-300 hover:bg-white/20 text-white"
        >
          <FcGoogle size={20} />
          <span className="hidden sm:inline text-sm font-medium">Google</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all duration-300 hover:bg-white/20 text-white"
        >
          <SiGithub size={20} />
          <span className="hidden sm:inline text-sm font-medium">GitHub</span>
        </motion.button>
      </motion.div>

      {/* Divider */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <span className="text-white/40 text-sm">or continue with email</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Input */}
        <motion.div
          variants={inputVariants}
          className="relative group"
          onMouseEnter={() => setFocusedField('email')}
          onMouseLeave={() => setFocusedField(null)}
        >
          <div
            className={`relative bg-white/10 backdrop-blur-md rounded-xl border transition-all duration-300 overflow-hidden ${
              focusedField === 'email' || email
                ? 'border-primary/60 bg-white/15'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            {/* Animated border glow */}
            {focusedField === 'email' && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{
                  boxShadow: [
                    '0 0 15px rgba(34, 197, 94, 0.3)',
                    '0 0 25px rgba(34, 197, 94, 0.5)',
                    '0 0 15px rgba(34, 197, 94, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            <div className="flex items-center px-4 py-3">
              <FiMail className="text-primary/70 mr-3" size={20} />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
                required
              />
            </div>
          </div>
        </motion.div>

        {/* Password Input */}
        <motion.div
          variants={inputVariants}
          className="relative group"
          onMouseEnter={() => setFocusedField('password')}
          onMouseLeave={() => setFocusedField(null)}
        >
          <div
            className={`relative bg-white/10 backdrop-blur-md rounded-xl border transition-all duration-300 overflow-hidden ${
              focusedField === 'password' || password
                ? 'border-primary/60 bg-white/15'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            {/* Animated border glow */}
            {focusedField === 'password' && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{
                  boxShadow: [
                    '0 0 15px rgba(34, 197, 94, 0.3)',
                    '0 0 25px rgba(34, 197, 94, 0.5)',
                    '0 0 15px rgba(34, 197, 94, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            <div className="flex items-center px-4 py-3">
              <FiLock className="text-primary/70 mr-3" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-primary/70 hover:text-primary transition-colors"
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Remember Me & Forgot Password */}
        <motion.div variants={itemVariants} className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border border-primary/50 bg-white/10 accent-primary cursor-pointer"
            />
            <span className="text-white/70 group-hover:text-white transition-colors">Remember me</span>
          </label>
          <motion.a
            href="#"
            className="text-primary/70 hover:text-primary transition-colors"
            whileHover={{ x: 2 }}
          >
            Forgot password?
          </motion.a>
        </motion.div>

        {/* Login Button */}
        <motion.button
          variants={itemVariants}
          type="submit"
          whileHover={{
            scale: 1.02,
            y: -2,
            boxShadow: '0 20px 40px rgba(34, 197, 94, 0.4)',
          }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 px-4 rounded-xl font-semibold text-white text-lg transition-all duration-300 relative overflow-hidden group mt-6"
        >
          {/* Button background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-accent opacity-100 group-hover:opacity-110 transition-opacity" />

          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />

          {/* Button text */}
          <span className="relative z-10 flex items-center justify-center gap-2">
            Sign In
            <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              →
            </motion.span>
          </span>
        </motion.button>

        {/* Sign up link */}
        <motion.div variants={itemVariants} className="text-center pt-4">
          <p className="text-white/60 text-sm">
            Don't have an account?{' '}
            <motion.a
              href="#"
              className="text-primary hover:text-accent transition-colors font-semibold"
              whileHover={{ scale: 1.05 }}
            >
              Sign up
            </motion.a>
          </p>
        </motion.div>
      </form>
    </motion.div>
  );
};
