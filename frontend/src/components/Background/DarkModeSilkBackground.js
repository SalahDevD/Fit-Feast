import React, { useEffect, useState } from 'react';
import Silk from './Silk';

const DarkModeSilkBackground = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if dark mode is enabled
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Initial check
    checkDarkMode();

    // Watch for changes to the dark class
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Silk
        speed={5}
        scale={1}
        lightColor="#ffffff"
        darkColor="#22c55e"
        noiseIntensity={1.5}
        rotation={0}
      />
    </div>
  );
};

export default DarkModeSilkBackground;
