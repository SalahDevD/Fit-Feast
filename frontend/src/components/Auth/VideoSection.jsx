import React from 'react';
import { motion } from 'framer-motion';

export const VideoSection = ({
  videoSrc = '/Auth_Vid/Login.mp4',
  titleLead = 'Welcome to',
  titleHighlight = 'FitFeast',
  subtitle = 'Transform your nutrition journey with AI-powered meal planning and personalized health insights.',
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
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

  return (
    <motion.div
      className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10"
      animate={{
        y: [0, 10, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={videoSrc}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/45 to-emerald-950/80" />

      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.34),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.28),_transparent_28%)]"
        animate={{
          opacity: [0.38, 0.52, 0.38],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute inset-0 flex flex-col justify-between p-7 md:p-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div>
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-100 backdrop-blur">
            Smart nutrition studio
          </motion.div>

          <motion.div variants={itemVariants} className="mt-8 max-w-xl">
            <h1 className="text-4xl font-bold leading-[0.98] text-white md:text-5xl lg:text-6xl">
              {titleLead}{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-white to-cyan-200 bg-clip-text text-transparent">
                {titleHighlight}
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/76 md:text-lg">
              {subtitle}
            </p>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Meal plans', value: 'AI-first' },
            { label: 'Wellness flow', value: '24/7' },
            { label: 'Progress feel', value: 'Premium' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-md"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute right-20 top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl"
        animate={{
          opacity: [0.1, 0.3, 0.1],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
};
