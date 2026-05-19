import React from 'react';
import { GrainientLight, GrainientDark, GrainientThemed } from './GrainientThemed';

/**
 * Example usage of Grainient components
 * Choose the implementation that best fits your needs
 */

// Example 1: Always light mode
export function LightModeExample() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <GrainientLight />
    </div>
  );
}

// Example 2: Always dark mode
export function DarkModeExample() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <GrainientDark />
    </div>
  );
}

// Example 3: Auto-switching based on system preference
export function AutoThemeExample() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <GrainientThemed />
    </div>
  );
}

// Example 4: Force specific theme
export function ForcedThemeExample() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <GrainientThemed theme="dark" />
    </div>
  );
}

// Example 5: Responsive container
export function ResponsiveExample() {
  const [theme, setTheme] = React.useState('light');

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="absolute top-4 right-4 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg z-10"
      >
        Toggle Theme
      </button>
      <GrainientThemed theme={theme} />
    </div>
  );
}
