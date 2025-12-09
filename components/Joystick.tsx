import React, { useState, useRef, useEffect, useCallback } from 'react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  onStop: () => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove, onStop }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const maxRadius = 60; // Max distance from center

  const handleStart = () => {
    setActive(true);
  };

  const handleEnd = useCallback(() => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onStop();
  }, [onStop]);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!active || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = Math.atan2(deltaY, deltaX);

      const cappedDistance = Math.min(distance, maxRadius);
      const x = Math.cos(angle) * cappedDistance;
      const y = Math.sin(angle) * cappedDistance;

      setPosition({ x, y });
      
      // Normalize output -1 to 1
      onMove(x / maxRadius, y / maxRadius);
    },
    [active, maxRadius, onMove]
  );

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if(active) e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    if (active) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
    }

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [active, handleMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      className={`relative w-48 h-48 rounded-full border-2 ${active ? 'border-neon-blue shadow-[0_0_20px_rgba(0,243,255,0.5)]' : 'border-gray-700'} bg-black/40 backdrop-blur-md flex items-center justify-center transition-all duration-200 select-none touch-none`}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
        {/* Decorative Grid */}
        <div className="absolute inset-0 rounded-full border border-white/5" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px) 0 0/10px 10px' }}></div>

      {/* Stick */}
      <div
        className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-black border border-neon-blue shadow-lg z-10"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: active ? 'none' : 'transform 0.2s ease-out',
          boxShadow: active ? '0 0 15px rgba(0, 243, 255, 0.8)' : 'none'
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
            <div className={`w-2 h-2 rounded-full ${active ? 'bg-neon-blue' : 'bg-gray-500'}`}></div>
        </div>
      </div>
    </div>
  );
};

export default Joystick;