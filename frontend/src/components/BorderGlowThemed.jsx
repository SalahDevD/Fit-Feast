import BorderGlow from './BorderGlow';

/**
 * BorderGlowLight - Light mode with white → green → white gradient
 */
export const BorderGlowLight = ({ children, className = '' }) => {
  return (
    <BorderGlow
      colors={['#ffffff', '#22c55e', '#ffffff']}
      backgroundColor="#120F17"
      edgeSensitivity={30}
      glowColor="120 60 50"
      borderRadius={28}
      glowRadius={40}
      glowIntensity={1.0}
      coneSpread={25}
      animated={false}
      fillOpacity={0.5}
      className={className}
    >
      {children}
    </BorderGlow>
  );
};

/**
 * BorderGlowDark - Dark mode with black → green → black gradient
 */
export const BorderGlowDark = ({ children, className = '' }) => {
  return (
    <BorderGlow
      colors={['#000000', '#22c55e', '#000000']}
      backgroundColor="#120F17"
      edgeSensitivity={30}
      glowColor="120 60 50"
      borderRadius={28}
      glowRadius={40}
      glowIntensity={1.0}
      coneSpread={25}
      animated={false}
      fillOpacity={0.5}
      className={className}
    >
      {children}
    </BorderGlow>
  );
};

/**
 * BorderGlowThemed - Auto-switches between light and dark modes
 */
export const BorderGlowThemed = ({ children, className = '', theme = 'auto' }) => {
  const isDark = theme === 'auto' 
    ? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    : theme === 'dark';

  return isDark ? (
    <BorderGlowDark className={className}>{children}</BorderGlowDark>
  ) : (
    <BorderGlowLight className={className}>{children}</BorderGlowLight>
  );
};

export default BorderGlowThemed;
