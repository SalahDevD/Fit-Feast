import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const FloatingParticles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => i);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-r from-primary/30 via-transparent to-accent/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '10%', left: '5%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-r from-accent/30 via-transparent to-primary/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          style={{ bottom: '10%', right: '5%' }}
        />
      </div>

      {/* Floating particles */}
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          animate={{
            y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
            x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(34, 197, 94, ${Math.random() * 0.8 + 0.2})`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* Ambient light orbs */}
      <motion.div
        className="absolute w-72 h-72 bg-gradient-radial from-primary/20 via-transparent to-transparent rounded-full blur-2xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '20%', right: '10%' }}
      />
      <motion.div
        className="absolute w-64 h-64 bg-gradient-radial from-accent/15 via-transparent to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{ bottom: '20%', left: '15%' }}
      />
    </div>
  );
};

export const GlowingBorder = ({ children }) => {
  const borderRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!borderRef.current) return;

      const rect = borderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      borderRef.current.style.setProperty('--x', x + 'px');
      borderRef.current.style.setProperty('--y', y + 'px');
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={borderRef}
      className="relative"
      style={{
        '--x': '0px',
        '--y': '0px',
      }}
    >
      {/* Animated glow around container */}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at var(--x) var(--y), rgba(34, 197, 94, 0.3) 0%, rgba(245, 158, 11, 0.2) 50%, transparent 100%)`,
          opacity: 0.5,
        }}
        animate={{
          boxShadow: [
            '0 0 30px rgba(34, 197, 94, 0.3), inset 0 0 30px rgba(34, 197, 94, 0.1)',
            '0 0 60px rgba(34, 197, 94, 0.4), inset 0 0 40px rgba(34, 197, 94, 0.15)',
            '0 0 30px rgba(34, 197, 94, 0.3), inset 0 0 30px rgba(34, 197, 94, 0.1)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {children}
    </div>
  );
};
