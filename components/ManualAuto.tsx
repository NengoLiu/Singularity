import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useROS2 } from '../libs/useROS2';
import { safeLocalStorage } from '../libs/rosStore';
import {
    Power, RotateCcw, RotateCw, Activity, Droplets, Move, GitCommit,
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
    Play, RefreshCw, Axis3d, Ruler,
    AlertCircle, CheckCircle2, Info, Navigation, Minus, Plus, 
    Octagon, Rotate3d, CornerUpLeft, CornerUpRight, Layers
} from 'lucide-react';

const PARAMS_STORAGE_KEY = 'singularity_manual_params_v3';

/**
 * --- ROBOT ARM VISUALIZER (3D DIGITAL TWIN) ---
 */
const RobotArmViz: React.FC<{ yaw: number; roll: number; height: number; enabled: boolean }> = ({ yaw, roll, height, enabled }) => {
    const heightOffset = -(height / 8) * 40;
    return (
        <div className={`w-full h-full bg-slate-900/50 relative overflow-hidden flex items-center justify-center transition-all duration-700 ${!enabled ? 'grayscale opacity-20 scale-95 blur-[1px]' : 'animate-in fade-in'}`}>
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
                <div className="flex items-center gap-2 text-sci-cyan font-black text-[10px] tracking-widest neon-text">
                    <Axis3d size={14} />
                    <span>DIGITAL_TWIN_SIMULATION</span>
                </div>
            </div>
            <div className="relative w-full h-full perspective-container" style={{ perspective: '1000px' }}>
                <div className="absolute top-[55%] left-1/2 w-0 h-0" style={{ transformStyle: 'preserve-3d', transform: 'translateZ(-100px) rotateX(65deg) rotateZ(0deg) scale(0.9)' }}>
                    <div className="absolute -top-[200px] -left-[200px] w-[400px] h-[400px] border border-sci-cyan/10 opacity-30" style={{ backgroundImage: `linear-gradient(rgba(6,182,212,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.4) 1px, transparent 1px)`, backgroundSize: '40px 40px', transform: 'translateZ(-30px)', maskImage: 'radial-gradient(circle, white, transparent 75%)' }} />
                    <div className="w-0 h-0 relative transition-transform duration-500 ease-out" style={{ transformStyle: 'preserve-3d', transform: `rotateZ(${yaw + 180}deg)` }}>
                        <div className="absolute -top-7 -left-7 w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-600 shadow-2xl" />
                        <div className="absolute top-0 left-[-10px] w-[20px] h-[150px] origin-top" style={{ transformStyle: 'preserve-3d', transform: 'translateZ(20px)' }}>
                            <div className="w-full h-full bg-gradient-to-r from-slate-700 to-slate-700 border border-slate-500 relative" />
                            <div className="absolute bottom-0 left-1/2 w-0 h-0" style={{ transformStyle: 'preserve-3d' }}>
                                <div className="absolute w-0 h-0 transition-transform duration-500 ease-linear" style={{ transformStyle: 'preserve-3d', transform: `translateZ(${heightOffset}px)` }}>
                                    <div className="absolute w-0 h-0" style={{ transformStyle: 'preserve-3d', transform: `translateZ(-50px) rotateZ(${roll}deg)` }}>
                                        <div className="absolute -left-[52px] -top-[10px] w-[104px] h-[20px] rounded-full" style={{ transform: 'translateZ(-28px)', background: 'repeating-linear-gradient(90deg, #475569, #334155 8px, #475569 16px)', border: '1px solid #64748b' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ManualAuto: React.FC = () => {
  const {
    isConnected, sendMachineMode, sendChassisEnable, sendArmEnable, publishPumpControl,
    publishChassisControl, publishArmControl, sendSemiMode, sendStop
  } = useROS2();

  const getSaved = useCallback((key: string, def: any) => {
    try {
      const saved = safeLocalStorage.getItem(PARAMS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed[key] !== undefined ? parsed[key] : def;
      }
    } catch(e) {}
    return def;
  }, []);

  const [activeTab, setActiveTab] = useState<'MANUAL' | 'SEMI'>(() => getSaved('activeTab', 'MANUAL'));
  const [chassisEnabled, setChassisEnabled] = useState(() => getSaved('chassisEnabled', false));
  const [armEnabled, setArmEnabled] = useState(() => getSaved('armEnabled', false));
  const [pumpOn, setPumpOn] = useState(false);
  const [pumpSpeed, setPumpSpeed] = useState(() => getSaved('pumpSpeed', [0]));
  const [pumpFlud, setPumpFlud] = useState(() => getSaved('pumpFlud', [0]));
  const [speed, setSpeed] = useState(() => getSaved('speed', 0.5));
  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const [yawAngle, setYawAngle] = useState(() => getSaved('yawAngle', [0]));
  const [rollAngle, setRollAngle] = useState(() => getSaved('rollAngle', [0]));
  const [updownAngle, setUpdownAngle] = useState(() => getSaved('updownAngle', [0]));
  const [bladeRoller, setBladeRoller] = useState<"0" | "1">(() => getSaved('bladeRoller', "0"));
  const [direction, setDirection] = useState<"0" | "1">(() => getSaved('direction', "0"));
  const [width, setWidth] = useState<number>(() => getSaved('width', 1.6));
  const [length, setLength] = useState<number>(() => getSaved('length', 10));
  const [thickness, setThickness] = useState<number>(() => getSaved('thickness', 5));
  const [isConfigured, setIsConfigured] = useState<boolean>(() => getSaved('isConfigured', false));
  const [isStopped, setIsStopped] = useState<boolean>(() => getSaved('isStopped', false));
  const [lastConfig, setLastConfig] = useState<any>(() => getSaved('lastConfig', null));

  useEffect(() => {
    const snapshot = {
        activeTab, pumpSpeed, pumpFlud, speed, yawAngle, rollAngle, updownAngle,
        bladeRoller, direction, width, length, thickness, isConfigured, isStopped, lastConfig,
        chassisEnabled, armEnabled
    };
    safeLocalStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(snapshot));
  }, [activeTab, pumpSpeed, pumpFlud, speed, yawAngle, rollAngle, updownAngle, bladeRoller, direction, width, length, thickness, isConfigured, isStopped, lastConfig, chassisEnabled, armEnabled]);

  const adjustValue = useCallback((value: number, delta: number, min: number, max: number, setter: (v: number) => void) => {
    const newValue = Math.min(Math.max(value + delta, min), max);
    setter(parseFloat(newValue.toFixed(1)));
  }, []);

  const sendChassisControl = useCallback((x: number, y: number, z: number) => {
    publishChassisControl({ x_speed: x, y_speed: y, z_speed: z });
  }, [publishChassisControl]);

  const handleDirStart = (dir: 'f' | 'b' | 'l' | 'r' | 'ccw' | 'cw') => {
    if (!chassisEnabled) return;
    setActiveDirection(dir);
    const s = speed;
    if (dir === 'f') sendChassisControl(s, 0, 0);
    else if (dir === 'b') sendChassisControl(-s, 0, 0);
    else if (dir === 'l') sendChassisControl(0, s, 0);
    else if (dir === 'r') sendChassisControl(0, -s, 0);
    else if (dir === 'ccw') sendChassisControl(0, 0, -s * 30);
    else if (dir === 'cw') sendChassisControl(0, 0, s * 30);
  };

  const handleDirEnd = () => {
    if (activeDirection) {
        setActiveDirection(null);
        sendChassisControl(0, 0, 0);
    }
  };

  const handleTabChange = async (tab: 'MANUAL' | 'SEMI') => {
    setActiveTab(tab);
    if (isConnected) await sendMachineMode(tab === 'MANUAL' ? 1 : 2);
  };

  const onChassisToggle = async () => {
    const nextState = !chassisEnabled ? 1 : 0;
    const ack = isConnected ? await sendChassisEnable(nextState) : 1;
    if (ack === 1) setChassisEnabled(!chassisEnabled);
  };

  const onArmToggle = async () => {
    const nextState = !armEnabled ? 1 : 0;
    const ack = isConnected ? await sendArmEnable(nextState) : 1;
    if (ack === 1) setArmEnabled(!armEnabled);
  };

  const handlePumpToggle = () => {
    const nextState = !pumpOn;
    setPumpOn(nextState);
    publishPumpControl({ pump_switch: nextState ? 1 : 0, pump_speed: pumpSpeed[0], pump_flud: pumpFlud[0] });
  };

  const handlePumpParamsChange = (type: 'speed' | 'fluid', val: number[]) => {
    if (type === 'speed') setPumpSpeed(val); else setPumpFlud(val);
    publishPumpControl({ pump_switch: pumpOn ? 1 : 0, pump_speed: type === 'speed' ? val[0] : pumpSpeed[0], pump_flud: type === 'fluid' ? val[0] : pumpFlud[0] });
  };

  const handleYawChange = (val: number[]) => { setYawAngle(val); publishArmControl({ yaw_angle: val[0], roll_angle: rollAngle[0], updown_angle: updownAngle[0], arm_reset: 0 }); };
  const handleRollChange = (val: number[]) => { setRollAngle(val); publishArmControl({ yaw_angle: yawAngle[0], roll_angle: val[0], updown_angle: updownAngle[0], arm_reset: 0 }); };
  const handleUpdownChange = (val: number[]) => { setUpdownAngle(val); publishArmControl({ yaw_angle: yawAngle[0], roll_angle: rollAngle[0], updown_angle: val[0], arm_reset: 0 }); };

  const handleSemiSubmit = async () => {
    const config = { blade_roller: parseInt(bladeRoller), direction: parseInt(direction), width, length, thickness };
    const ack = isConnected ? await sendSemiMode(config) : 1;
    if (ack === 1) { setIsConfigured(true); setIsStopped(false); setLastConfig(config); }
  };

  const handleHaltAction = async () => {
      if (isStopped) { await sendStop(2); setIsStopped(false); } else { const ack = isConnected ? await sendStop(1) : 1; if (ack === 1) setIsStopped(true); }
  };

  const handleSemiContinue = async () => { const ack = isConnected ? await sendStop(0) : 1; if (ack === 1) setIsStopped(false); };

  return (
    <div className="flex flex-col h-full w-full select-none relative animate-in fade-in duration-700 overflow-y-auto custom-scrollbar" onMouseUp={handleDirEnd} onTouchEnd={handleDirEnd}>
      {/* 顶部导航 */}
      <div className="flex justify-center mb-6 shrink-0 px-4 mt-2">
          <div className="bg-slate-900/80 p-1 rounded-full border border-slate-700 flex gap-1 backdrop-blur-3xl shadow-2xl">
            <button onClick={() => handleTabChange('MANUAL')} className={`px-8 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all ${activeTab === 'MANUAL' ? 'bg-sci-blue text-white shadow-lg' : 'text-slate-500 hover:text-sci-blue'}`}>MANUAL_DRIVE</button>
            <button onClick={() => handleTabChange('SEMI')} className={`px-8 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all ${activeTab === 'SEMI' ? 'bg-sci-purple text-white shadow-lg' : 'text-slate-500 hover:text-sci-purple'}`}>AUTO_PROC_SEMI</button>
          </div>
      </div>

      {activeTab === 'MANUAL' ? (
        <div className="flex-1 flex flex-col gap-6 px-4 pb-12 md:px-8">
            {/* 第一行：状态切换 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-panel rounded-3xl p-5 flex flex-col justify-center relative shadow-xl">
                    <div className="flex items-center gap-2 mb-4 text-sci-cyan text-[10px] font-black uppercase tracking-widest neon-text"><Power size={14} /> Power Matrix</div>
                    <div className="flex gap-4">
                        <button onClick={onChassisToggle} className={`flex-1 py-4 rounded-2xl font-black text-[10px] flex flex-col items-center justify-center gap-2 transition-all border-2 ${chassisEnabled ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-800/40 border-slate-700 text-slate-600'}`}>
                            <Move size={18} /> {chassisEnabled ? 'DRIVE_ON' : 'DRIVE_LOCK'}
                        </button>
                        <button onClick={onArmToggle} className={`flex-1 py-4 rounded-2xl font-black text-[10px] flex flex-col items-center justify-center gap-2 transition-all border-2 ${armEnabled ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-800/40 border-slate-700 text-slate-600'}`}>
                            <GitCommit size={18} /> {armEnabled ? 'ARM_ACTIVE' : 'ARM_IDLE'}
                        </button>
                    </div>
                </div>

                <div className="glass-panel rounded-3xl p-5 flex flex-col justify-center relative shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sci-cyan text-[10px] font-black uppercase tracking-widest neon-text"><Droplets size={14} /> Fluid Inject</div>
                        <button onClick={handlePumpToggle} className={`w-14 h-7 rounded-full transition-all relative ${pumpOn ? 'bg-sci-cyan shadow-lg' : 'bg-slate-800'}`}><div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${pumpOn ? 'left-7.5' : 'left-0.5'}`} /></button>
                    </div>
                    <div className="flex gap-4">
                        <input type="range" min="0" max="200" value={pumpSpeed[0]} onChange={(e) => handlePumpParamsChange('speed', [parseInt(e.target.value)])} className="flex-1 accent-sci-cyan h-2 rounded-full appearance-none bg-slate-800" disabled={!pumpOn} />
                        <input type="range" min="0" max="12" step="0.1" value={pumpFlud[0]} onChange={(e) => handlePumpParamsChange('fluid', [parseFloat(e.target.value)])} className="flex-1 accent-sci-cyan h-2 rounded-full appearance-none bg-slate-800" disabled={!pumpOn} />
                    </div>
                </div>
            </div>

            {/* 第二行：核心底盘控制 (响应式堆叠) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左侧：D-Pad 导航控制 */}
                <div className={`glass-panel rounded-[3rem] p-8 flex flex-col items-center transition-all min-h-[400px] ${!chassisEnabled ? 'opacity-20 pointer-events-none grayscale' : 'shadow-2xl'}`}>
                    <div className="w-full text-left mb-8 flex items-center gap-3">
                        <div className="w-1 h-4 bg-sci-blue rounded-full"></div>
                        <span className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase">Kinetic_Nav_Matrix</span>
                    </div>

                    {/* D-Pad 容器：使用布局而非绝对定位避免重叠 */}
                    <div className="relative flex flex-col items-center gap-4 py-4">
                        {/* Up */}
                        <button 
                            onMouseDown={() => handleDirStart('f')} onTouchStart={() => handleDirStart('f')}
                            className={`w-20 h-20 rounded-2xl bg-slate-800 border-2 flex items-center justify-center transition-all ${activeDirection === 'f' ? 'bg-sci-blue border-sci-blue text-white shadow-blue-500/50 shadow-xl scale-110' : 'border-slate-700 text-slate-500'}`}
                        >
                            <ChevronUp size={40} />
                        </button>
                        
                        <div className="flex items-center gap-4">
                            {/* CCW 侧翼 */}
                            <button 
                                onMouseDown={() => handleDirStart('ccw')} onTouchStart={() => handleDirStart('ccw')}
                                className={`w-16 h-16 rounded-full bg-slate-900 border-2 flex flex-col items-center justify-center transition-all ${activeDirection === 'ccw' ? 'bg-sci-cyan border-sci-cyan text-white shadow-cyan-500/50 shadow-lg' : 'border-slate-800 text-slate-600'}`}
                            >
                                <RotateCcw size={24} />
                                <span className="text-[7px] font-black mt-1">CCW</span>
                            </button>

                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4">
                                    {/* Left */}
                                    <button 
                                        onMouseDown={() => handleDirStart('l')} onTouchStart={() => handleDirStart('l')}
                                        className={`w-20 h-20 rounded-2xl bg-slate-800 border-2 flex items-center justify-center transition-all ${activeDirection === 'l' ? 'bg-sci-blue border-sci-blue text-white shadow-blue-500/50 shadow-xl scale-110' : 'border-slate-700 text-slate-500'}`}
                                    >
                                        <ChevronLeft size={40} />
                                    </button>
                                    {/* Center Dot */}
                                    <div className="w-20 h-20 rounded-2xl bg-slate-950/50 flex items-center justify-center border border-slate-800">
                                        <div className={`w-3 h-3 rounded-full ${activeDirection ? 'bg-sci-blue animate-ping' : 'bg-slate-800'}`} />
                                    </div>
                                    {/* Right */}
                                    <button 
                                        onMouseDown={() => handleDirStart('r')} onTouchStart={() => handleDirStart('r')}
                                        className={`w-20 h-20 rounded-2xl bg-slate-800 border-2 flex items-center justify-center transition-all ${activeDirection === 'r' ? 'bg-sci-blue border-sci-blue text-white shadow-blue-500/50 shadow-xl scale-110' : 'border-slate-700 text-slate-500'}`}
                                    >
                                        <ChevronRight size={40} />
                                    </button>
                                </div>
                                {/* Down */}
                                <div className="flex justify-center">
                                    <button 
                                        onMouseDown={() => handleDirStart('b')} onTouchStart={() => handleDirStart('b')}
                                        className={`w-20 h-20 rounded-2xl bg-slate-800 border-2 flex items-center justify-center transition-all ${activeDirection === 'b' ? 'bg-sci-blue border-sci-blue text-white shadow-blue-500/50 shadow-xl scale-110' : 'border-slate-700 text-slate-500'}`}
                                    >
                                        <ChevronDown size={40} />
                                    </button>
                                </div>
                            </div>

                            {/* CW 侧翼 */}
                            <button 
                                onMouseDown={() => handleDirStart('cw')} onTouchStart={() => handleDirStart('cw')}
                                className={`w-16 h-16 rounded-full bg-slate-900 border-2 flex flex-col items-center justify-center transition-all ${activeDirection === 'cw' ? 'bg-sci-cyan border-sci-cyan text-white shadow-cyan-500/50 shadow-lg' : 'border-slate-800 text-slate-600'}`}
                            >
                                <RotateCw size={24} />
                                <span className="text-[7px] font-black mt-1">CW</span>
                            </button>
                        </div>
                    </div>

                    {/* 速度控制条：底部独立区域 */}
                    <div className="w-full mt-12 bg-slate-950/60 p-5 rounded-3xl border border-white/5 flex flex-col items-center gap-4">
                        <span className="text-[9px] text-slate-500 font-black tracking-widest uppercase">Kinetic_Speed_Setpoint (mm/s)</span>
                        <div className="w-full flex items-center gap-6">
                            <button onClick={() => adjustValue(speed, -0.1, 0, 4, setSpeed)} className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 active:scale-90"><Minus size={20}/></button>
                            <span className="flex-1 text-center text-4xl font-black text-sci-blue font-mono drop-shadow-lg">{(speed * 1000).toFixed(0)}</span>
                            <button onClick={() => adjustValue(speed, 0.1, 0, 4, setSpeed)} className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 active:scale-90"><Plus size={20}/></button>
                        </div>
                    </div>
                </div>

                {/* 右侧：3D 孪生可视化 */}
                <div className={`glass-panel rounded-[3rem] overflow-hidden flex flex-col min-h-[450px] transition-all duration-500 ${!armEnabled ? 'opacity-20 pointer-events-none grayscale' : 'shadow-2xl'}`}>
                    <div className="flex-1 relative z-0">
                         <RobotArmViz yaw={yawAngle[0]} roll={rollAngle[0]} height={updownAngle[0]} enabled={armEnabled} />
                    </div>
                    
                    {/* 控制面板固定在视觉反馈下方 */}
                    <div className="p-6 bg-slate-900/95 backdrop-blur-3xl border-t border-slate-800/50 flex flex-col gap-6 z-10">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col items-center bg-slate-950/80 p-3 rounded-2xl border border-white/5">
                                <span className="text-[8px] font-black text-slate-500 mb-1 uppercase tracking-tighter">Yaw Angle</span>
                                <span className="text-sm font-black text-sci-purple font-mono">{yawAngle[0]}°</span>
                            </div>
                            <div className="flex flex-col items-center bg-slate-950/80 p-3 rounded-2xl border border-white/5">
                                <span className="text-[8px] font-black text-slate-500 mb-1 uppercase tracking-tighter">Roll Angle</span>
                                <span className="text-sm font-black text-sci-purple font-mono">{rollAngle[0]}°</span>
                            </div>
                            <div className="flex flex-col items-center bg-slate-950/80 p-3 rounded-2xl border border-white/5">
                                <span className="text-[8px] font-black text-slate-500 mb-1 uppercase tracking-tighter">Vertical Lift</span>
                                <span className="text-sm font-black text-sci-purple font-mono">{updownAngle[0]} cm</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 px-2 py-2">
                             <div className="space-y-2">
                                <input type="range" min="-90" max="90" value={yawAngle[0]} onChange={(e) => handleYawChange([parseInt(e.target.value)])} className="w-full h-2 accent-sci-purple bg-slate-800 rounded-full appearance-none" />
                                <div className="flex justify-between text-[8px] font-bold text-slate-600 px-1"><span>-90°</span><span>0°</span><span>+90°</span></div>
                             </div>
                             <div className="space-y-2">
                                <input type="range" min="-180" max="180" value={rollAngle[0]} onChange={(e) => handleRollChange([parseInt(e.target.value)])} className="w-full h-2 accent-sci-purple bg-slate-800 rounded-full appearance-none" />
                                <div className="flex justify-between text-[8px] font-bold text-slate-600 px-1"><span>-180°</span><span>0°</span><span>+180°</span></div>
                             </div>
                             <div className="space-y-2">
                                <input type="range" min="0" max="8" step="0.1" value={updownAngle[0]} onChange={(e) => handleUpdownChange([parseFloat(e.target.value)])} className="w-full h-2 accent-sci-purple bg-slate-800 rounded-full appearance-none" />
                                <div className="flex justify-between text-[8px] font-bold text-slate-600 px-1"><span>0 CM</span><span>4 CM</span><span>8 CM</span></div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 px-4 pb-12 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel rounded-3xl p-6 flex flex-col gap-6 shadow-xl relative overflow-hidden">
                    <div className="text-sci-purple text-[10px] font-black uppercase tracking-widest flex items-center gap-2 neon-text"><Activity size={16} /> Proc_Method</div>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => setBladeRoller("0")} className={`w-full py-4 rounded-2xl text-[10px] font-black border-2 transition-all ${bladeRoller === "0" ? 'bg-sci-purple/20 border-sci-purple text-sci-purple shadow-lg' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>刮涂 / Blade Coating</button>
                        <button onClick={() => setBladeRoller("1")} className={`w-full py-4 rounded-2xl text-[10px] font-black border-2 transition-all ${bladeRoller === "1" ? 'bg-sci-purple/20 border-sci-purple text-sci-purple shadow-lg' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>辊涂 / Roller Coating</button>
                    </div>
                </div>

                {/* 核心参数调节区：重构为 3 列响应式布局 */}
                <div className="md:col-span-2 glass-panel rounded-3xl p-8 flex flex-col justify-center gap-8 shadow-xl">
                     <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-l-4 border-slate-700 pl-4"><Ruler size={16} /> Process_Geometry_X_Y_Z</div>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {/* Length */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end"><span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Length (m)</span><span className="text-3xl font-black text-sci-blue font-mono">{length}</span></div>
                            <input type="range" min="0" max="20" step="0.1" value={length} onChange={(e) => setLength(parseFloat(e.target.value))} className="w-full accent-sci-blue h-2" disabled={isConfigured} />
                        </div>
                        {/* Width */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end"><span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Width (m)</span><span className="text-3xl font-black text-sci-blue font-mono">{width}</span></div>
                            <input type="range" min="0" max="2.6" step="0.1" value={width} onChange={(e) => setWidth(parseFloat(e.target.value))} className="w-full accent-sci-blue h-2" disabled={isConfigured} />
                        </div>
                        {/* Thickness - 补全缺失参数 */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end gap-2">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1"><Layers size={12} /> Thick (mm)</span>
                                <span className="text-3xl font-black text-sci-purple font-mono">{thickness}</span>
                            </div>
                            <input type="range" min="0" max="10" step="0.1" value={thickness} onChange={(e) => setThickness(parseFloat(e.target.value))} className="w-full accent-sci-purple h-2 shadow-[0_0_10px_rgba(168,85,247,0.2)]" disabled={isConfigured} />
                        </div>
                     </div>
                </div>
            </div>

            <div className="glass-panel rounded-[3rem] p-10 flex flex-col items-center justify-center gap-10 shadow-2xl relative overflow-hidden bg-slate-900/40">
                {!isConfigured ? (
                     <button onClick={handleSemiSubmit} className="w-full max-w-sm h-48 rounded-[3.5rem] font-black text-3xl flex flex-col items-center justify-center gap-6 transition-all bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-500/50 shadow-2xl hover:scale-105 active:scale-95">
                        <Play size={80} fill="currentColor" /><span className="tracking-widest">INIT_START</span>
                    </button>
                ) : (
                    <button 
                        onClick={handleHaltAction} 
                        className={`w-full max-w-sm h-48 rounded-[3.5rem] font-black text-3xl flex flex-col items-center justify-center gap-6 transition-all shadow-2xl active:scale-95 ${
                            isStopped 
                            ? 'bg-gradient-to-br from-sci-blue to-sci-cyan text-white shadow-sci-blue/50 shadow-2xl' 
                            : 'bg-gradient-to-br from-red-600 to-red-800 text-white shadow-red-500/50 shadow-2xl'
                        }`}
                    >
                        {isStopped ? <Rotate3d size={80} /> : <Octagon size={80} />}
                        <span className="tracking-widest font-black uppercase">
                            {isStopped ? 'RELOAD_PROC' : 'CORE_HALT'}
                        </span>
                    </button>
                )}
                
                {isStopped && (
                    <button onClick={handleSemiContinue} className="text-sci-cyan text-xs font-black underline animate-pulse uppercase tracking-[0.2em] hover:text-white transition-colors">Resume Autonomous Mission</button>
                )}

                <div className="flex items-start gap-4 p-6 bg-slate-950/80 rounded-[2.5rem] border border-white/5 w-full max-w-2xl shadow-inner">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 shrink-0 mt-1">
                        <Info size={20} className="text-sci-blue" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telemetry_Status</span>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight">
                            {isStopped ? "CORE HALTED. STANDBY FOR RELOAD OR RESUMPTION COMMANDS." : isConfigured ? "AUTONOMOUS PATHING ACTIVE. TELEMETRY SYNCHRONIZED WITH HUD." : "CONSTRUCT SEQUENCE PARAMETERS BEFORE INITIATING START COMMAND."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ManualAuto;