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
      className={`relative w-48 h-48 rounded-full border ${active ? 'border-sci-blue shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'border-slate-200'} bg-white/50 backdrop-blur-md flex items-center justify-center transition-all duration-200 select-none touch-none shadow-inner`}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
        {/* Decorative Grid - Light */}
        <div className="absolute inset-0 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #94a3b8 1px, transparent 1px) 0 0/12px 12px' }}></div>
        <div className="absolute inset-4 rounded-full border border-slate-200/50"></div>

      {/* Stick */}
      <div
        className="w-16 h-16 rounded-full bg-gradient-to-br from-white to-slate-100 border border-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.1)] z-10 flex items-center justify-center"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: active ? 'none' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy return
        }}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${active ? 'bg-gradient-to-br from-sci-blue to-sci-cyan' : 'bg-slate-200'}`}>
             <div className="w-4 h-4 rounded-full bg-white/80 shadow-sm" />
        </div>
      </div>
    </div>
  );
};

export default Joystick;