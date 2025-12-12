import React, { useState, useEffect, useRef } from 'react';
import { 
  Map, MousePointer2, Eraser, Play, Save, 
  Layers, Scan, RefreshCw, ZoomIn, ZoomOut,
  Navigation, Grid
} from 'lucide-react';

// Types
interface Point { x: number; y: number; }
interface Waypoint extends Point { id: number; }

const PathPlanning: React.FC = () => {
  // --- STATE ---
  const [activeTool, setActiveTool] = useState<'DRAW' | 'ERASE'>('DRAW');
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [zoom, setZoom] = useState(1);
  const [isScanning, setIsScanning] = useState(true);
  
  // Simulation State
  const [robotPos, setRobotPos] = useState<Point>({ x: 50, y: 50 });
  const [coatedPath, setCoatedPath] = useState<Point[]>([]);

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- EDITOR LOGIC ---
  const handleEditorClick = (e: React.MouseEvent) => {
    if (!editorRef.current) return;
    const rect = editorRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeTool === 'DRAW') {
      setWaypoints([...waypoints, { id: Date.now(), x, y }]);
    } else {
      // Simple eraser: remove nearest point within range
      setWaypoints(prev => prev.filter(p => Math.hypot(p.x - x, p.y - y) > 5));
    }
  };

  const clearPath = () => setWaypoints([]);

  // --- RADAR/LIDAR SIMULATION LOOP ---
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let animationFrameId: number;
    
    // Resize canvas
    const resize = () => {
        const parent = canvas.parentElement;
        if(parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    };
    resize();
    window.addEventListener('resize', resize);

    // Mock Obstacles
    const obstacles: Point[] = Array.from({ length: 15 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height
    }));

    const render = () => {
        // 1. Clear & Background
        ctx.fillStyle = '#020617'; // Slate 950
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Draw Grid
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)'; // Cyan low opacity
        ctx.lineWidth = 1;
        const gridSize = 40;
        for(let x=0; x<canvas.width; x+=gridSize) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
        for(let y=0; y<canvas.height; y+=gridSize) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }

        // 3. Draw Coated Area (Simulation)
        // In a real app, this would be a complex polygon or grid map
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 20; // Coating width
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; // Emerald transparent
        
        if (coatedPath.length > 1) {
            ctx.beginPath();
            ctx.moveTo(coatedPath[0].x, coatedPath[0].y);
            for(let i=1; i<coatedPath.length; i++) {
                ctx.lineTo(coatedPath[i].x, coatedPath[i].y);
            }
            ctx.stroke();
        }

        // 4. Draw Planned Path (Scaled from 0-100 to canvas size)
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#3b82f6'; // Blue
        ctx.setLineDash([5, 5]);
        if (waypoints.length > 0) {
            ctx.beginPath();
            waypoints.forEach((wp, idx) => {
                const wx = (wp.x / 100) * canvas.width;
                const wy = (wp.y / 100) * canvas.height;
                if (idx === 0) ctx.moveTo(wx, wy);
                else ctx.lineTo(wx, wy);
                
                // Draw Waypoint Dot
                ctx.fillStyle = '#60a5fa';
                ctx.fillRect(wx-2, wy-2, 4, 4);
            });
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // 5. Update Robot Position (Mock Movement along path or random)
        // Here we just orbit center for demo if no path, or follow path
        const rx = (robotPos.x / 100) * canvas.width;
        const ry = (robotPos.y / 100) * canvas.height;

        // 6. Draw Robot
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(angle * 0.5); // Mock rotation
        // Robot Body
        ctx.fillStyle = '#06b6d4'; // Cyan
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, 5);
        ctx.lineTo(-5, -5);
        ctx.fill();
        // Lidar Cone
        if (isScanning) {
            ctx.rotate(angle * 2);
            ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 100, -0.2, 0.2);
            ctx.fill();
        }
        ctx.restore();

        // 7. Draw Obstacles (Lidar Returns)
        ctx.fillStyle = '#ef4444'; // Red
        obstacles.forEach(obs => {
            // Draw only if "scanned" (distance check for effect)
            const dist = Math.hypot(obs.x - rx, obs.y - ry);
            if (dist < 120) {
                ctx.globalAlpha = 1 - (dist / 120);
                ctx.beginPath();
                ctx.arc(obs.x, obs.y, 3, 0, Math.PI*2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });

        // Animation Updates
        angle += 0.02;
        
        // Simulating coating trail
        if (Math.random() > 0.9) {
             setCoatedPath(prev => {
                 const newP = [...prev, { x: rx, y: ry }];
                 if (newP.length > 50) newP.shift(); // Keep trail limited for performance demo
                 return newP;
             });
        }
        
        // Simulating Robot movement
        setRobotPos(prev => ({
            x: 50 + Math.cos(Date.now() / 2000) * 30,
            y: 50 + Math.sin(Date.now() / 2000) * 30
        }));

        animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, [waypoints, robotPos, isScanning, coatedPath]);

  return (
    <div className="flex flex-col h-full w-full gap-2">
        {/* Header */}
        <div className="flex justify-between items-center px-2">
            <h2 className="text-sci-cyan font-bold text-sm tracking-wider flex items-center gap-2">
                <Map size={16} /> 智能路径规划 (SLAM)
            </h2>
            <div className="flex gap-2">
                 <button onClick={() => setIsScanning(!isScanning)} className={`px-3 py-1 rounded text-[10px] font-bold border ${isScanning ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                    LIDAR: {isScanning ? 'ON' : 'OFF'}
                 </button>
            </div>
        </div>

        {/* Main Split View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
            
            {/* LEFT: Manual Planner (Vector Editor) */}
            <div className="glass-panel rounded-2xl p-1 flex flex-col relative overflow-hidden group">
                <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-1 flex flex-col gap-1 shadow-lg">
                    <button 
                        onClick={() => setActiveTool('DRAW')}
                        className={`p-2 rounded transition-colors ${activeTool === 'DRAW' ? 'bg-sci-blue text-white' : 'text-slate-400 hover:text-white'}`}
                        title="添加路点"
                    >
                        <MousePointer2 size={16} />
                    </button>
                    <button 
                        onClick={() => setActiveTool('ERASE')}
                        className={`p-2 rounded transition-colors ${activeTool === 'ERASE' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="擦除路点"
                    >
                        <Eraser size={16} />
                    </button>
                    <div className="h-px bg-slate-700 my-0.5"></div>
                    <button onClick={clearPath} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded">
                        <RefreshCw size={16} />
                    </button>
                </div>

                {/* Grid Editor Area */}
                <div 
                    ref={editorRef}
                    className="flex-1 bg-slate-900/50 relative cursor-crosshair m-1 rounded-xl border border-slate-800/50 overflow-hidden"
                    onClick={handleEditorClick}
                    style={{
                        backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                >
                    <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-500 select-none pointer-events-none">MANUAL_OVERRIDE_LAYER</div>
                    
                    {/* Render Waypoints & Lines */}
                    <svg className="w-full h-full pointer-events-none">
                        <polyline 
                            points={waypoints.map(p => `${p.x}%,${p.y}%`).join(' ')}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeDasharray="4"
                        />
                        {waypoints.map((p, i) => (
                            <g key={p.id}>
                                <circle cx={`${p.x}%`} cy={`${p.y}%`} r="3" fill="#60a5fa" />
                                <text x={`${p.x + 1}%`} y={`${p.y - 1}%`} fill="#94a3b8" fontSize="10" fontFamily="monospace">P{i+1}</text>
                            </g>
                        ))}
                    </svg>
                </div>

                {/* Bottom Controls */}
                <div className="h-12 bg-slate-900/80 border-t border-slate-800 flex items-center px-4 justify-between">
                    <span className="text-xs text-slate-400 font-mono">POINTS: {waypoints.length}</span>
                    <button className="flex items-center gap-2 bg-sci-blue hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                        <Save size={14} /> 上传路径
                    </button>
                </div>
            </div>

            {/* RIGHT: Lidar/Radar Map (Visualization) */}
            <div className="glass-panel rounded-2xl p-1 flex flex-col relative overflow-hidden">
                <div className="absolute top-3 right-3 z-10 flex gap-2">
                    <div className="bg-slate-900/80 px-2 py-1 rounded border border-sci-cyan/30 text-[10px] font-bold text-sci-cyan flex items-center gap-1 neon-text">
                        <Scan size={12} /> REAL-TIME
                    </div>
                </div>

                {/* Legend Overlay */}
                <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 p-2 rounded border border-slate-800 text-[10px] space-y-1 pointer-events-none">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500/50 border border-emerald-500"></div>
                        <span className="text-emerald-400">已涂敷 (Coated)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-slate-900 border border-slate-600 border-dashed"></div>
                        <span className="text-slate-400">未作业 (Raw)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-red-400">障碍物 (Obstacle)</span>
                    </div>
                </div>

                <div className="flex-1 bg-black relative rounded-xl overflow-hidden border border-slate-800">
                    <canvas ref={radarCanvasRef} className="w-full h-full block" />
                    
                    {/* Holographic Overlay Lines */}
                    <div className="absolute inset-0 pointer-events-none opacity-20" 
                         style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #06b6d4 1px, transparent 2px) 0 0/100% 4px' }}>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};

export default PathPlanning;