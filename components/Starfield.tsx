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
    const numParticles = 200;
    const colors = ['#06b6d4', '#3b82f6', '#ffffff']; // Cyan, Blue, White

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
      // Dark Deep Space Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#020617'); // Slate 950
      gradient.addColorStop(1, '#0f172a'); // Slate 900
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw Sci-Fi Grid lines (Retro-future style)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)'; // Cyan very transparent
      ctx.lineWidth = 1;
      const gridSize = 60;
      
      // Moving grid effect
      const time = Date.now() / 40;
      const xOffset = time % gridSize;
      const yOffset = time % gridSize;

      // Vertical lines
      for (let x = xOffset; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
      }
      
      // Horizontal lines (perspective-ish limit)
      for (let y = yOffset; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
      }

      particles.forEach((p) => {
        p.z -= 1.5; // Speed
        if (p.z <= 0) {
          p.z = canvas.width;
          p.x = (Math.random() - 0.5) * canvas.width;
          p.y = (Math.random() - 0.5) * canvas.height;
        }

        const x = (p.x / p.z) * 100 + cx;
        const y = (p.y / p.z) * 100 + cy;
        const size = (1 - p.z / canvas.width) * 3;
        const alpha = (1 - p.z / canvas.width); 

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        
        ctx.beginPath();
        // Draw circles (stars)
        ctx.arc(x, y, size > 0 ? size : 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        if (size > 2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
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