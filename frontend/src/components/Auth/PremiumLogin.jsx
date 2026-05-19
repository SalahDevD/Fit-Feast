import React from 'react';
import { motion } from 'framer-motion';
import { FloatingParticles, GlowingBorder } from './BackgroundEffects';
import { VideoSection } from './VideoSection';
import { LoginForm } from './LoginForm';

const PremiumLogin = ({ showBackgroundEffects = false }) => {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="relative w-full min-h-screen bg-dark overflow-hidden">
      {/* Background effects */}
      {showBackgroundEffects && <FloatingParticles />}

      {/* Main container */}
      <motion.div
        className="relative w-full h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <GlowingBorder>
          {/* Glassmorphism container */}
          <div className="w-full max-w-6xl h-auto lg:h-[600px] rounded-3xl overflow-hidden flex flex-col lg:flex-row">
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl rounded-3xl border border-white/20 pointer-events-none" />

            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 rounded-3xl pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 w-full h-full flex flex-col lg:flex-row">
              {/* Video Section - Left */}
              <VideoSection />

              {/* Form Section - Right */}
              <LoginForm />
            </div>

            {/* Optional: Floating reflections - disabled for clean view */}
            {showBackgroundEffects && (
              <>
                <motion.div
                  className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl -z-0"
                  animate={{
                    opacity: [0.1, 0.2, 0.1],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <motion.div
                  className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-0"
                  animate={{
                    opacity: [0.1, 0.15, 0.1],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 2,
                  }}
                />
              </>
            )}
          </div>
        </GlowingBorder>
      </motion.div>

      {/* Optional: Scroll hint for mobile */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 md:hidden"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="text-white/40 text-sm">Scroll to see more</div>
      </motion.div>
    </div>
  );
};

export default PremiumLogin;
