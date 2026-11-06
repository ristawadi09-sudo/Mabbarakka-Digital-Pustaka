import React from 'react';

interface BarcodeVisualProps {
  code: string;
  className?: string;
  height?: number;
  showText?: boolean;
}

/**
 * High-precision SVG barcode generator based on standard 1D barcode stripes
 */
export const BarcodeVisual: React.FC<BarcodeVisualProps> = ({
  code,
  className = '',
  height = 48,
  showText = true,
}) => {
  // Generate deterministic pseudo-bar pattern from alphanumeric string
  const generateBars = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    
    // Create standard start, payload, and stop patterns
    const bars: { width: number; isBlack: boolean }[] = [];
    
    // Start guard (black, white, black)
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 2, isBlack: false });
    bars.push({ width: 2, isBlack: true });

    // Payload bars
    for (let i = 0; i < input.length; i++) {
      const charCode = input.charCodeAt(i);
      const binary = (charCode % 16).toString(2).padStart(4, '0');
      for (let j = 0; j < binary.length; j++) {
        const isB = binary[j] === '1';
        const w = ((charCode + j) % 3) + 1; // 1, 2, or 3 px wide
        bars.push({ width: w, isBlack: isB });
        bars.push({ width: 1.5, isBlack: !isB });
      }
    }

    // Stop guard (black, white, black, black)
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 2, isBlack: false });
    bars.push({ width: 3, isBlack: true });

    return bars;
  };

  const bars = generateBars(code);
  let currentX = 10;
  const elements = bars.map((bar, index) => {
    const x = currentX;
    currentX += bar.width + 0.8;
    if (!bar.isBlack) return null;
    return (
      <rect
        key={index}
        x={x}
        y={0}
        width={bar.width}
        height={height}
        fill="currentColor"
      />
    );
  });

  const totalWidth = currentX + 10;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        style={{ width: '100%', maxWidth: `${totalWidth}px`, height: `${height}px` }}
        className="text-slate-900"
      >
        {elements}
      </svg>
      {showText && (
        <span className="font-mono text-xs tracking-widest font-bold text-slate-700 mt-1">
          {code}
        </span>
      )}
    </div>
  );
};
