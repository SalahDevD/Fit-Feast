import React, { useState, useEffect } from 'react';
import GrainientLight from './GrainientLight';
import GrainientDark from './GrainientDark';

/**
 * GrainientThemed Component - Auto-switches between light and dark modes
 * Respects system theme preference or custom theme prop
 */
const GrainientThemed = ({ theme = 'auto' }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (theme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);

      // Listen for changes
      const listener = (e) => setIsDark(e.matches);
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme]);

  return isDark ? <GrainientDark /> : <GrainientLight />;
};

export { GrainientLight, GrainientDark, GrainientThemed };
export default GrainientThemed;
