import React, { useState, useEffect, useRef } from 'react';
import { ros2Connection } from '../libs/ros2Connection';
import { 
    Power, RotateCcw, RotateCw, Activity, Droplets, Move, GitCommit, 
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
    PaintRoller, ArrowLeftRight, Ruler, Layers, Play, RefreshCw, Box, Axis3d
} from 'lucide-react';

// --- ROBOT ARM VISUALIZER COMPONENT (CUSTOM KINEMATICS) ---
const RobotArmViz: React.FC<{ yaw: number; roll: number; height: number; enabled: boolean }> = ({ yaw, roll, height, enabled }) => {
    // Height visual scale factor: 0-8cm maps to 0-40px movement visually
    const heightOffset = -(height / 8) * 40; 

    return (
        <div className={`w-full h-full bg-slate-50/50 relative overflow-hidden flex items-center justify-center transition-all duration-500 ${!enabled ? 'grayscale opacity-70' : ''}`}>
            
            {/* Info Overlay */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-0.5 pointer-events-none">
                <div className="flex items-center gap-1 text-sci-blue font-bold text-[10px] tracking-wider">
                    <Axis3d size={12} />
                    <span>TWIN</span>
                </div>
            </div>

            {/* 3D Scene Container */}
            <div className="relative w-full h-full perspective-container" style={{ perspective: '800px' }}>
                <div className="absolute top-[60%] left-1/2 w-0 h-0" 
                     style={{ 
                         transformStyle: 'preserve-3d', 
                         transform: 'translateZ(-100px) rotateX(60deg) rotateZ(0deg) scale(0.8)' 
                     }}>

                    {/* Ground Grid - Smaller for compact view */}
                    <div className="absolute -top-[150px] -left-[150px] w-[300px] h-[300px] border border-slate-300/30 opacity-30" 
                         style={{ 
                             backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', 
                             backgroundSize: '30px 30px',
                             transform: 'translateZ(-20px)' 
                         }} 
                    />

                    {/* KINEMATIC CHAIN */}
                    {/* 1. YAW GROUP */}
                    <div className="w-0 h-0 relative transition-transform duration-300 ease-out" 
                         style={{ transformStyle: 'preserve-3d', transform: `rotateZ(${yaw + 180}deg)` }}>
                        
                        {/* Base */}
                        <div className="absolute -top-5 -left-5 w-10 h-10 rounded-full bg-slate-700 shadow-xl border-4 border-slate-600" 
                             style={{ transform: 'translateZ(0px)' }}>
                        </div>

                        {/* 2. THE ARM */}
                        <div className="absolute top-0 left-[-8px] w-[16px] h-[140px] origin-top"
                             style={{ transformStyle: 'preserve-3d', transform: 'translateZ(15px)' }}>
                            <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-300 border border-slate-400 shadow-lg relative"></div>
                            
                            {/* 3. LIFT & ROLL GROUP */}
                            <div className="absolute bottom-0 left-1/2 w-0 h-0" style={{ transformStyle: 'preserve-3d' }}>
                                <div className="absolute -left-[12px] -top-[8px] w-[24px] h-[24px] bg-slate-800 rounded-sm border border-slate-600"
                                     style={{ transform: 'translateZ(8px)' }}></div>

                                {/* 4. LIFT PISTON */}
                                <div className="absolute w-0 h-0 transition-transform duration-300 ease-linear"
                                     style={{ transformStyle: 'preserve-3d', transform: `translateZ(${heightOffset}px)` }}>
                                    <div className="absolute -left-[3px] -top-[8px] w-[6px] h-[30px] bg-slate-300 border border-slate-400 origin-top"
                                         style={{ transform: 'rotateX(-90deg)' }}></div>

                                    {/* 5. ROLL GROUP */}
                                    <div className="absolute w-0 h-0"
                                         style={{ transformStyle: 'preserve-3d', transform: `translateZ(-40px) rotateZ(${roll}deg)` }}>
                                        <div className="absolute -left-[40px] -top-[1px] w-[80px] h-[3px] bg-slate-400" style={{ transform: 'translateZ(-8px)' }}>
                                            <div className="absolute left-0 top-0 w-[3px] h-[15px] bg-slate-400 origin-top" style={{ transform: 'rotateX(90deg)' }}></div>
                                            <div className="absolute right-0 top-0 w-[3px] h-[15px] bg-slate-400 origin-top" style={{ transform: 'rotateX(90deg)' }}></div>
                                        </div>
                                        {/* Roller */}
                                        <div className="absolute -left-[38px] -top-[6px] w-[76px] h-[12px] rounded-full"
                                             style={{ 
                                                 transform: 'translateZ(-20px)',
                                                 background: 'repeating-linear-gradient(90deg, #e2e8f0, #cbd5e1 4px)',
                                                 boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)'
                                             }}></div>
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
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'SEMI'>('MANUAL');
  
  // --- MANUAL MODE STATES ---
  const [chassisEnabled, setChassisEnabled] = useState(false);
  const [armEnabled, setArmEnabled] = useState(false);
  
  const [pumpOn, setPumpOn] = useState(false);
  const [pumpSpeed, setPumpSpeed] = useState(0);
  const [pumpFluid, setPumpFluid] = useState(0);

  const [chassisSpeedSetting, setChassisSpeedSetting] = useState(500); 
  const [zRotation, setZRotation] = useState(0);

  const [movementState, setMovementState] = useState({ up: false, down: false, left: false, right: false });
  const movementRef = useRef({ up: false, down: false, left: false, right: false });

  const [armYaw, setArmYaw] = useState(0);
  const [armRoll, setArmRoll] = useState(0);
  const [armHeight, setArmHeight] = useState(0);

  // --- SEMI-AUTO MODE STATES ---
  const [coatingType, setCoatingType] = useState<0 | 1>(0); // 0: 刮涂, 1: 辊涂
  const [direction, setDirection] = useState<0 | 1>(0); // 0: 向左, 1: 向右
  
  const [paramLength, setParamLength] = useState(0); // 0-40m
  const [paramWidth, setParamWidth] = useState(0);   // 0-2.4m
  const [paramThickness, setParamThickness] = useState(0); // 0-20mm
  
  const [isConstructing, setIsConstructing] = useState(false);
  const [semiAutoAck, setSemiAutoAck] = useState<string>('');

  // Switch Mode logic
  const handleTabChange = async (tab: 'MANUAL' | 'SEMI') => {
    setActiveTab(tab);
    try {
        await ros2Connection.sendMachineModeRequest(tab === 'MANUAL' ? 1 : 2);
    } catch (e) {
        console.error("Failed to switch mode", e);
    }
  };

  // --- MANUAL HANDLERS ---
  const toggleChassis = async () => {
    try {
        const cmd = chassisEnabled ? 0 : 1;
        const ack = await ros2Connection.sendChassisEnableRequest(cmd);
        if (ack === 1) setChassisEnabled(!chassisEnabled);
    } catch (e) {
        console.error("Chassis enable failed", e);
    }
  };

  const toggleArm = async () => {
    try {
        const cmd = armEnabled ? 0 : 1;
        const ack = await ros2Connection.sendArmEnableRequest(cmd);
        if (ack === 1) setArmEnabled(!armEnabled);
    } catch (e) {
        console.error("Arm enable failed", e);
    }
  };

  const togglePump = () => {
    const newState = !pumpOn;
    setPumpOn(newState);
    ros2Connection.publishPumpControl({
        pump_switch: newState ? 1 : 0,
        pump_speed: pumpSpeed,
        pump_flud: pumpFluid
    });
  };

  const handlePumpSliderChange = (type: 'speed' | 'fluid', val: number) => {
    if (type === 'speed') setPumpSpeed(val);
    else setPumpFluid(val);
    
    ros2Connection.publishPumpControl({
        pump_switch: pumpOn ? 1 : 0,
        pump_speed: type === 'speed' ? val : pumpSpeed,
        pump_flud: type === 'fluid' ? val : pumpFluid
    });
  };

  const handleArmChange = (type: 'yaw' | 'roll' | 'height', val: number) => {
    let newYaw = armYaw;
    let newRoll = armRoll;
    let newHeight = armHeight;

    if (type === 'yaw') { setArmYaw(val); newYaw = val; }
    if (type === 'roll') { setArmRoll(val); newRoll = val; }
    if (type === 'height') { setArmHeight(val); newHeight = val; }

    ros2Connection.publishArmControl({
        yaw_angle: newYaw,
        roll_angle: newRoll,
        updown_angle: newHeight,
        arm_reset: 0
    });
  };

  const resetArm = () => {
      setArmYaw(0);
      setArmRoll(0);
      setArmHeight(0);
      ros2Connection.publishArmControl({
          yaw_angle: 0,
          roll_angle: 0,
          updown_angle: 0,
          arm_reset: 1
      });
  };

  const handleDirectionStart = (dir: 'up' | 'down' | 'left' | 'right') => {
      movementRef.current[dir] = true;
      setMovementState(prev => ({ ...prev, [dir]: true }));
  };

  const handleDirectionEnd = (dir: 'up' | 'down' | 'left' | 'right') => {
      movementRef.current[dir] = false;
      setMovementState(prev => ({ ...prev, [dir]: false }));
  };

  const handleGlobalEnd = () => {
      movementRef.current = { up: false, down: false, left: false, right: false };
      setMovementState({ up: false, down: false, left: false, right: false });
  };

  // --- SEMI AUTO HANDLERS ---
  const updateFloatParam = (setter: React.Dispatch<React.SetStateAction<number>>, current: number, delta: number, min: number, max: number, precision: number = 1) => {
      const next = Math.min(max, Math.max(min, current + delta));
      setter(parseFloat(next.toFixed(precision)));
  };

  const handleStartConstruction = async () => {
      try {
          const ack = await ros2Connection.sendSemiModeRequest(coatingType, direction, paramWidth, paramLength, paramThickness);
          if (ack === 1) {
              setIsConstructing(true);
              setSemiAutoAck('指令已下发: 开始施工');
              setTimeout(() => setSemiAutoAck(''), 3000);
          } else {
              setSemiAutoAck('错误: 机器未响应');
          }
      } catch (e) {
          console.error("Start construction failed", e);
          setSemiAutoAck('通信错误');
      }
  };

  const handleChangeCartridge = async () => {
      try {
          const ack = await ros2Connection.sendStopRequest(2);
          if (ack === 1) {
              setIsConstructing(false);
              setSemiAutoAck('指令已下发: 更换料筒/停止');
              setTimeout(() => setSemiAutoAck(''), 3000);
          }
      } catch (e) {
          console.error("Stop/Change Cartridge failed", e);
      }
  };

  const isConfigValid = paramLength > 0 && paramWidth > 0 && paramThickness > 0;

  // Chassis Loop
  useEffect(() => {
    if (!chassisEnabled) return;
    const interval = setInterval(() => {
        const { up, down, left, right } = movementRef.current;
        const isMoving = up || down || left || right || zRotation !== 0;

        if (isMoving) {
            const scale = chassisSpeedSetting / 1000.0; 
            let x_speed = 0;
            let y_speed = 0;
            if (up) x_speed += scale;      
            if (down) x_speed -= scale;    
            if (left) y_speed += scale;    
            if (right) y_speed -= scale;   
            const z_speed = zRotation * 30; 
            ros2Connection.publishChassisControl({ x_speed, y_speed, z_speed });
        }
    }, 100);
    return () => clearInterval(interval);
  }, [chassisEnabled, zRotation, chassisSpeedSetting]);

  useEffect(() => {
      const { up, down, left, right } = movementState;
      if(chassisEnabled && !up && !down && !left && !right && zRotation === 0) {
          ros2Connection.publishChassisControl({ x_speed: 0, y_speed: 0, z_speed: 0 });
      }
  }, [movementState, zRotation, chassisEnabled]);


  return (
    <div className="flex flex-col h-full w-full select-none" onMouseUp={handleGlobalEnd} onTouchEnd={handleGlobalEnd}>
      
      {/* --- Compact Tab Switcher --- */}
      <div className="flex justify-center mb-1 shrink-0">
          <div className="bg-white/80 p-1 rounded-full border border-white shadow-sm flex gap-1 backdrop-blur-sm">
            <button
              onClick={() => handleTabChange('MANUAL')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'MANUAL' 
                  ? 'bg-sci-blue text-white shadow-sm' 
                  : 'text-slate-500 hover:text-sci-blue'
              }`}
            >
              手动控制
            </button>
            <button
              onClick={() => handleTabChange('SEMI')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'SEMI' 
                  ? 'bg-sci-purple text-white shadow-sm' 
                  : 'text-slate-500 hover:text-sci-purple'
              }`}
            >
              半自动施工
            </button>
          </div>
      </div>

      {activeTab === 'MANUAL' ? (
        // === MANUAL QUADRANT LAYOUT ===
        <div className="flex-1 grid grid-cols-2 grid-rows-[auto_1fr] gap-2 min-h-0 pb-1">
            
            {/* 1. TOP LEFT: Device Enable (Compact) */}
            <div className="glass-panel rounded-2xl p-3 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <Power size={12} /> 系统使能
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={toggleChassis}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                            chassisEnabled 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                    >
                        <Move size={16} />
                        {chassisEnabled ? '底盘 ON' : '底盘 OFF'}
                    </button>
                    <button 
                            onClick={toggleArm}
                            className={`flex-1 py-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                                armEnabled 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                    >
                        <GitCommit size={16} />
                        {armEnabled ? '机械臂 ON' : '机械臂 OFF'}
                    </button>
                </div>
            </div>

            {/* 2. TOP RIGHT: Pump Control (Compact) */}
            <div className="glass-panel rounded-2xl p-3 flex flex-col justify-center">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        <Droplets size={12} /> 水泵控制
                    </div>
                    <button 
                             onClick={togglePump}
                             className={`w-10 h-5 rounded-full transition-all relative shadow-inner ${pumpOn ? 'bg-sci-cyan' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${pumpOn ? 'left-5.5' : 'left-0.5'}`} />
                    </button>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                            <span>速度</span> <span>{pumpSpeed}</span>
                        </div>
                        <input type="range" min="0" max="200" value={pumpSpeed}
                            onChange={(e) => handlePumpSliderChange('speed', parseInt(e.target.value))}
                            className="w-full accent-sci-cyan h-1.5 bg-slate-200 rounded-lg appearance-none" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                            <span>容量</span> <span>{pumpFluid}</span>
                        </div>
                        <input type="range" min="0" max="12" value={pumpFluid}
                            onChange={(e) => handlePumpSliderChange('fluid', parseInt(e.target.value))}
                            className="w-full accent-sci-cyan h-1.5 bg-slate-200 rounded-lg appearance-none" />
                    </div>
                </div>
            </div>

            {/* 3. BOTTOM LEFT: Chassis Drive (Maximised Control Area) */}
            <div className={`glass-panel rounded-2xl p-2 relative flex flex-col items-center justify-center transition-opacity ${!chassisEnabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                 <div className="absolute top-2 left-3 text-slate-400 text-[10px] font-bold">DRIVE</div>
                 
                 <div className="flex items-center gap-6">
                    {/* Rotation Left */}
                    <button 
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${zRotation > 0 ? 'bg-sci-blue text-white border-transparent' : 'bg-white text-slate-400 border-slate-200'}`}
                        onMouseDown={() => setZRotation(1)} onMouseUp={() => setZRotation(0)} onMouseLeave={() => setZRotation(0)}
                        onTouchStart={(e) => { e.preventDefault(); setZRotation(1); }} onTouchEnd={(e) => { e.preventDefault(); setZRotation(0); }}
                    >
                        <RotateCcw size={20} />
                    </button>

                    {/* D-PAD */}
                    <div className="w-32 h-32 relative">
                         <div className="absolute inset-0 bg-slate-100/50 rounded-full border border-slate-200"></div>
                         {/* Up */}
                         <button className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 h-12 rounded-t-lg flex items-start justify-center pt-1 transition-colors ${movementState.up ? 'bg-sci-blue text-white' : 'bg-white text-sci-blue hover:bg-blue-50'}`}
                            onMouseDown={() => handleDirectionStart('up')} onMouseUp={() => handleDirectionEnd('up')} onMouseLeave={() => handleDirectionEnd('up')}
                            onTouchStart={(e) => { e.preventDefault(); handleDirectionStart('up'); }} onTouchEnd={(e) => { e.preventDefault(); handleDirectionEnd('up'); }}
                         ><ChevronUp size={24} /></button>
                         {/* Down */}
                         <button className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-12 rounded-b-lg flex items-end justify-center pb-1 transition-colors ${movementState.down ? 'bg-sci-blue text-white' : 'bg-white text-sci-blue hover:bg-blue-50'}`}
                            onMouseDown={() => handleDirectionStart('down')} onMouseUp={() => handleDirectionEnd('down')} onMouseLeave={() => handleDirectionEnd('down')}
                            onTouchStart={(e) => { e.preventDefault(); handleDirectionStart('down'); }} onTouchEnd={(e) => { e.preventDefault(); handleDirectionEnd('down'); }}
                         ><ChevronDown size={24} /></button>
                         {/* Left */}
                         <button className={`absolute left-0 top-1/2 -translate-y-1/2 w-12 h-10 rounded-l-lg flex items-center justify-start pl-1 transition-colors ${movementState.left ? 'bg-sci-blue text-white' : 'bg-white text-sci-blue hover:bg-blue-50'}`}
                            onMouseDown={() => handleDirectionStart('left')} onMouseUp={() => handleDirectionEnd('left')} onMouseLeave={() => handleDirectionEnd('left')}
                            onTouchStart={(e) => { e.preventDefault(); handleDirectionStart('left'); }} onTouchEnd={(e) => { e.preventDefault(); handleDirectionEnd('left'); }}
                         ><ChevronLeft size={24} /></button>
                         {/* Right */}
                         <button className={`absolute right-0 top-1/2 -translate-y-1/2 w-12 h-10 rounded-r-lg flex items-center justify-end pr-1 transition-colors ${movementState.right ? 'bg-sci-blue text-white' : 'bg-white text-sci-blue hover:bg-blue-50'}`}
                            onMouseDown={() => handleDirectionStart('right')} onMouseUp={() => handleDirectionEnd('right')} onMouseLeave={() => handleDirectionEnd('right')}
                            onTouchStart={(e) => { e.preventDefault(); handleDirectionStart('right'); }} onTouchEnd={(e) => { e.preventDefault(); handleDirectionEnd('right'); }}
                         ><ChevronRight size={24} /></button>
                    </div>

                    {/* Rotation Right */}
                    <button 
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${zRotation < 0 ? 'bg-sci-blue text-white border-transparent' : 'bg-white text-slate-400 border-slate-200'}`}
                        onMouseDown={() => setZRotation(-1)} onMouseUp={() => setZRotation(0)} onMouseLeave={() => setZRotation(0)}
                        onTouchStart={(e) => { e.preventDefault(); setZRotation(-1); }} onTouchEnd={(e) => { e.preventDefault(); setZRotation(0); }}
                    >
                        <RotateCw size={20} />
                    </button>
                 </div>

                 {/* Speed Slider */}
                 <div className="absolute bottom-3 left-6 right-6 flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 w-8">SPD</span>
                    <input type="range" min="0" max="1000" step="50" value={chassisSpeedSetting}
                        onChange={(e) => setChassisSpeedSetting(parseInt(e.target.value))}
                        className="flex-1 accent-sci-blue h-1.5 bg-slate-200 rounded-lg appearance-none" />
                    <span className="text-[10px] font-bold text-sci-blue w-8 text-right">{chassisSpeedSetting}</span>
                 </div>
            </div>

            {/* 4. BOTTOM RIGHT: Arm Control (Viz Background + Floating Controls) */}
            <div className={`glass-panel rounded-2xl relative overflow-hidden flex flex-col transition-opacity ${!armEnabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                 <div className="absolute inset-0 z-0">
                    <RobotArmViz yaw={armYaw} roll={armRoll} height={armHeight} enabled={armEnabled} />
                 </div>
                 
                 {/* Floating Overlay Controls */}
                 <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/80 backdrop-blur-md border-t border-white/50 z-10 flex flex-col gap-2">
                    <div className="flex gap-2 text-[10px] font-bold text-slate-500 mb-1">
                        <span className="flex-1 text-center">YAW ({armYaw}°)</span>
                        <span className="flex-1 text-center">ROLL ({armRoll}°)</span>
                        <span className="flex-1 text-center">LIFT ({armHeight}cm)</span>
                    </div>
                    <div className="flex gap-2">
                         <input type="range" min="-90" max="90" value={armYaw} onChange={(e) => handleArmChange('yaw', parseInt(e.target.value))}
                            className="flex-1 accent-sci-purple h-1.5 bg-slate-200 rounded-lg appearance-none" />
                         <input type="range" min="-180" max="180" value={armRoll} onChange={(e) => handleArmChange('roll', parseInt(e.target.value))}
                            className="flex-1 accent-sci-purple h-1.5 bg-slate-200 rounded-lg appearance-none" />
                         <input type="range" min="0" max="8" value={armHeight} onChange={(e) => handleArmChange('height', parseInt(e.target.value))}
                            className="flex-1 accent-sci-purple h-1.5 bg-slate-200 rounded-lg appearance-none" />
                    </div>
                    <button onClick={resetArm} className="absolute top-[-30px] right-2 bg-white/90 p-1.5 rounded-lg shadow-sm text-xs font-bold text-sci-purple border border-purple-100">
                        RESET
                    </button>
                 </div>
            </div>

        </div>
      ) : (
        // === SEMI AUTO 3-COLUMN LAYOUT ===
        <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 px-1 pb-1">
            
            {/* Col 1: Config (Compact) */}
            <div className="col-span-3 glass-panel rounded-2xl p-3 flex flex-col gap-4">
                 <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                    <Activity size={12} /> 模式配置
                </div>
                
                <div className="flex flex-col gap-2 flex-1">
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-bold">工艺</span>
                        <div className="flex gap-1">
                            <button onClick={() => setCoatingType(0)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${coatingType === 0 ? 'bg-sci-purple text-white' : 'bg-slate-100 text-slate-400'}`}>刮涂</button>
                            <button onClick={() => setCoatingType(1)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${coatingType === 1 ? 'bg-sci-purple text-white' : 'bg-slate-100 text-slate-400'}`}>辊涂</button>
                        </div>
                     </div>
                     <div className="flex flex-col gap-1 mt-2">
                        <span className="text-[10px] text-slate-400 font-bold">方向</span>
                        <div className="flex gap-1">
                            <button onClick={() => setDirection(0)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${direction === 0 ? 'bg-sci-blue text-white' : 'bg-slate-100 text-slate-400'}`}>向左</button>
                            <button onClick={() => setDirection(1)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${direction === 1 ? 'bg-sci-blue text-white' : 'bg-slate-100 text-slate-400'}`}>向右</button>
                        </div>
                     </div>
                </div>
            </div>

            {/* Col 2: Params (Sliders) */}
            <div className="col-span-5 glass-panel rounded-2xl p-3 flex flex-col justify-center gap-4">
                 <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                    <Ruler size={12} /> 施工参数
                </div>
                <div className="space-y-4">
                    {/* Length */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                             <span className="text-slate-400">长度 (m)</span>
                             <span className="text-sci-blue">{paramLength}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => updateFloatParam(setParamLength, paramLength, -0.5, 0, 40)} className="w-6 h-6 rounded bg-slate-100 text-slate-500 font-bold">-</button>
                            <input type="range" min="0" max="40" step="0.5" value={paramLength} onChange={(e) => setParamLength(parseFloat(e.target.value))} className="flex-1 accent-sci-blue h-1.5 bg-slate-200 rounded-lg appearance-none" />
                            <button onClick={() => updateFloatParam(setParamLength, paramLength, 0.5, 0, 40)} className="w-6 h-6 rounded bg-slate-100 text-slate-500 font-bold">+</button>
                        </div>
                    </div>
                    {/* Width */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                             <span className="text-slate-400">宽度 (m)</span>
                             <span className="text-sci-blue">{paramWidth}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => updateFloatParam(setParamWidth, paramWidth, -0.1, 0, 2.4)} className="w-6 h-6 rounded bg-slate-100 text-slate-500 font-bold">-</button>
                            <input type="range" min="0" max="2.4" step="0.1" value={paramWidth} onChange={(e) => setParamWidth(parseFloat(e.target.value))} className="flex-1 accent-sci-blue h-1.5 bg-slate-200 rounded-lg appearance-none" />
                            <button onClick={() => updateFloatParam(setParamWidth, paramWidth, 0.1, 0, 2.4)} className="w-6 h-6 rounded bg-slate-100 text-slate-500 font-bold">+</button>
                        </div>
                    </div>
                     {/* Thickness */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                             <span className="text-slate-400">厚度 (mm)</span>
                             <span className="text-sci-purple">{paramThickness}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => updateFloatParam(setParamThickness, paramThickness, -0.5, 0, 20)} className="w-6 h-6 rounded bg-slate-100 text-slate-500 font-bold">-</button>
                            <input type="range" min="0" max="20" step="0.5" value={paramThickness} onChange={(e) => setParamThickness(parseFloat(e.target.value))} className="flex-1 accent-sci-purple h-1.5 bg-slate-200 rounded-lg appearance-none" />
                            <button onClick={() => updateFloatParam(setParamThickness, paramThickness, 0.5, 0, 20)} className="w-6 h-6 rounded bg-slate-100 text-slate-500 font-bold">+</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Col 3: Action */}
            <div className="col-span-4 glass-panel rounded-2xl p-3 flex flex-col relative overflow-hidden">
                 <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Play size={12} /> 执行控制
                </div>

                <div className="flex-1 flex flex-col justify-center items-center">
                    {semiAutoAck && (
                        <div className="absolute top-10 inset-x-2 bg-slate-800/90 text-white text-[10px] py-1 px-2 rounded text-center animate-pulse z-20">
                            {semiAutoAck}
                        </div>
                    )}
                    
                    {!isConstructing ? (
                         <button
                            onClick={handleStartConstruction}
                            disabled={!isConfigValid}
                            className={`w-full h-full max-h-[160px] rounded-xl font-bold text-lg flex flex-col items-center justify-center gap-2 transition-all ${
                                isConfigValid 
                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg active:scale-95' 
                                : 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200'
                            }`}
                        >
                            <Play size={32} fill="currentColor" />
                            <span>开始施工</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleChangeCartridge}
                            className="w-full h-full max-h-[160px] rounded-xl font-bold text-lg flex flex-col items-center justify-center gap-2 transition-all bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg active:scale-95 animate-pulse"
                        >
                            <RefreshCw size={32} className="animate-spin-slow" />
                            <span>紧急停止 / 换料</span>
                        </button>
                    )}
                </div>
            </div>

        </div>
      )}
    </div>
  );
};

export default ManualAuto;