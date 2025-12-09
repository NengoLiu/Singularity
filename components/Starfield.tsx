import React, { useEffect, useRef } from 'react';

const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; z: number; color: string }[] = [];
    const numParticles = 150;
    const colors = ['#2563eb', '#9333ea', '#06b6d4']; // Blue, Purple, Cyan

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: (Math.random() - 0.5) * canvas.width,
          y: (Math.random() - 0.5) * canvas.height,
          z: Math.random() * canvas.width,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const draw = () => {
      // Light background for the "Bright Sci-Fi" look
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#eff6ff'); // Very subtle blue tint at bottom
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw faint grid lines for "blueprint" feel
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'; // Slate-400 very transparent
      ctx.lineWidth = 1;
      const gridSize = 100;
      
      // Moving grid effect
      const time = Date.now() / 50;
      const xOffset = time % gridSize;
      const yOffset = time % gridSize;

      // Only draw a few lines or it gets messy
      /* 
      // Optional: Grid lines logic here if desired, keeping it clean for now 
      */

      particles.forEach((p) => {
        p.z -= 2; // Speed
        if (p.z <= 0) {
          p.z = canvas.width;
          p.x = (Math.random() - 0.5) * canvas.width;
          p.y = (Math.random() - 0.5) * canvas.height;
        }

        const x = (p.x / p.z) * 100 + cx;
        const y = (p.y / p.z) * 100 + cy;
        const size = (1 - p.z / canvas.width) * 4;
        const alpha = (1 - p.z / canvas.width) * 0.6; // Max opacity 0.6

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        
        ctx.beginPath();
        // Draw circles (particles)
        ctx.arc(x, y, size > 0 ? size : 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Connect nearby particles with thin lines for "Neural" look
        // (Optimization: only check a few)
      });
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
    />
  );
};

export default Starfield;