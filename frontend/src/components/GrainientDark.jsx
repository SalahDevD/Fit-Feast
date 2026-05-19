import Grainient from './Grainient';

/**
 * GrainientDark Component - Black Mode
 * Displays a black-to-green-to-black gradient with animated grain effect
 */
const GrainientDark = ({ className = '' }) => {
  return (
    <Grainient
      color1="#000000"
      color2="#22c55e"
      color3="#000000"
      timeSpeed={0.5}
      colorBalance={0.18}
      warpStrength={1.4}
      warpFrequency={4}
      warpSpeed={2}
      warpAmplitude={50}
      blendAngle={0}
      blendSoftness={0.05}
      rotationAmount={500}
      noiseScale={2}
      grainAmount={0.1}
      grainScale={2}
      grainAnimated={false}
      contrast={1.5}
      gamma={1}
      saturation={1}
      centerX={0}
      centerY={0}
      zoom={0.9}
      className={className}
    />
  );
};

export default GrainientDark;
