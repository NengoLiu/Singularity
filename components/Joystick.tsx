import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ros2Connection } from '../libs/ros2Connection';

interface JoystickProps {
  onMove?: (x: number, y: number) => void;
  onStop?: () => void;
  isEnabled: boolean;
  isConnected: boolean;
}

const Joystick: React.FC<JoystickProps> = ({
  onMove,
  onStop,
  isEnabled,
  isConnected
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [speed, setSpeed] = useState(0.5);
  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const maxRadius = 60;
  const hasSent = useRef(false);

  const sendControl = useCallback((x: number, y: number, z: number) => {
    if (!isConnected || !isEnabled) return;

    ros2Connection.publishChassisControl({
      x_speed: x,
      y_speed: y,
      z_speed: z,
    });
  }, [isConnected, isEnabled]);

  const handleDirectionPress = useCallback((direction: 'forward' | 'backward' | 'left' | 'right', e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setActiveDirection(direction);
    const currentSpeed = speed;

    switch (direction) {
      case 'forward':
        sendControl(currentSpeed, 0, 0);
        break;
      case 'backward':
        sendControl(-currentSpeed, 0, 0);
        break;
      case 'left':
        sendControl(0, currentSpeed, 0);
        break;
      case 'right':
        sendControl(0, -currentSpeed, 0);
        break;
    }
  }, [speed, sendControl]);

  const handleRotationPress = useCallback((direction: 'ccw' | 'cw', e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setActiveDirection(direction);
    const currentSpeed = speed;
    const zSpeed = currentSpeed * 1;

    sendControl(0, 0, direction === 'ccw' ? -zSpeed : zSpeed);
  }, [speed, sendControl]);

  // Use any to avoid type mismatch between native DOM events and React synthetic events
  const handleRelease = useCallback((e?: any) => {
    if (e) e.preventDefault();
    setActiveDirection(null);
    sendControl(0, 0, 0);
    onStop?.();
  }, [sendControl, onStop]);

  const handleStart = () => {
    setActive(true);
    hasSent.current = false;
  };

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!active || !containerRef.current || hasSent.current) return;

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

      const normalizedX = x / maxRadius;
      const normalizedY = y / maxRadius;

      // 同时支持原有回调和新的控制逻辑
      onMove?.(normalizedX, normalizedY);
      sendControl(normalizedY * speed, -normalizedX * speed, 0);

      hasSent.current = true;
    },
    [active, maxRadius, onMove, speed, sendControl]
  );

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (active) e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    if (active) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleRelease);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleRelease);
    }

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleRelease);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleRelease);
    };
  }, [active, handleMove, handleRelease]);

  // Keyboard control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEnabled || !isConnected) return;

      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd'].includes(key) && activeDirection === null) {
        e.preventDefault();
        switch (key) {
          case 'w':
            handleDirectionPress('forward');
            break;
          case 's':
            handleDirectionPress('backward');
            break;
          case 'a':
            handleDirectionPress('left');
            break;
          case 'd':
            handleDirectionPress('right');
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd'].includes(key)) {
        e.preventDefault();
        handleRelease();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isEnabled, isConnected, activeDirection, handleDirectionPress, handleRelease]);

  const adjustSpeed = (delta: number) => {
    setSpeed(prev => Math.min(Math.max(prev + delta, 0), 4));
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-48 h-48 rounded-full border ${active ? 'border-sci-blue shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'border-slate-700'} bg-slate-900/50 backdrop-blur-md flex items-center justify-center transition-all duration-200 select-none touch-none shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]`}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      <div className="absolute inset-0 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #06b6d4 1px, transparent 1px) 0 0/12px 12px' }}></div>
      <div className="absolute inset-4 rounded-full border border-slate-700/50"></div>

      <div
        className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 shadow-[0_4px_10px_rgba(0,0,0,0.8)] z-10 flex items-center justify-center"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: active ? 'none' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-inner ${active ? 'bg-gradient-to-br from-sci-blue to-sci-cyan shadow-[0_0_15px_rgba(6,182,212,0.6)]' : 'bg-slate-800'}`}>
          <div className={`w-4 h-4 rounded-full bg-white/80 shadow-sm ${active ? 'animate-pulse' : 'opacity-20'}`} />
        </div>
      </div>
    </div>
  );
};

export default Joystick;