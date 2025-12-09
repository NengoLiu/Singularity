import React, { useState, useEffect, useRef } from 'react';
import { ros2Connection } from '../libs/ros2Connection';
import { 
    Power, RotateCcw, RotateCw, Activity, Droplets, Move, GitCommit, 
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
    PaintRoller, ArrowLeftRight, Ruler, Layers, Play, Pause, RefreshCw, AlertCircle
} from 'lucide-react';

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
  
  // Helper for float precision sliders
  const updateFloatParam = (setter: React.Dispatch<React.SetStateAction<number>>, current: number, delta: number, min: number, max: number, precision: number = 1) => {
      const next = Math.min(max, Math.max(min, current + delta));
      setter(parseFloat(next.toFixed(precision)));
  };

  const handleStartConstruction = async () => {
      try {
          // Send parameters via /semi_mode service
          const ack = await ros2Connection.sendSemiModeRequest(
              coatingType,
              direction,
              paramWidth,
              paramLength,
              paramThickness
          );

          if (ack === 1) {
              setIsConstructing(true);
              setSemiAutoAck('指令已下发: 开始施工');
              // Clear message after 3 seconds
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
          // Send stop_cmd = 2 (Change Cartridge) via /stop service
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

            if (up) x_speed += scale;      // Forward
            if (down) x_speed -= scale;    // Backward
            if (left) y_speed += scale;    // Left
            if (right) y_speed -= scale;   // Right

            const z_speed = zRotation * 30; 

            ros2Connection.publishChassisControl({ x_speed, y_speed, z_speed });
        }
    }, 100);

    return () => clearInterval(interval);
  }, [chassisEnabled, zRotation, chassisSpeedSetting]);

  // Ensure 0 is sent when stopping
  useEffect(() => {
      const { up, down, left, right } = movementState;
      if(chassisEnabled && !up && !down && !left && !right && zRotation === 0) {
          ros2Connection.publishChassisControl({ x_speed: 0, y_speed: 0, z_speed: 0 });
      }
  }, [movementState, zRotation, chassisEnabled]);


  return (
    <div className="flex flex-col h-full space-y-4" onMouseUp={handleGlobalEnd} onTouchEnd={handleGlobalEnd}>
      {/* Top Tabs */}
      <div className="flex space-x-1 bg-white/70 p-1.5 rounded-2xl w-fit mx-auto border border-white shadow-lg backdrop-blur-md sticky top-0 z-20">
        <button
          onClick={() => handleTabChange('MANUAL')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
            activeTab === 'MANUAL' 
              ? 'bg-gradient-to-r from-sci-blue to-blue-500 text-white shadow-md' 
              : 'text-slate-500 hover:text-sci-blue hover:bg-white/50'
          }`}
        >
          手动模式
        </button>
        <button
          onClick={() => handleTabChange('SEMI')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
            activeTab === 'SEMI' 
              ? 'bg-gradient-to-r from-sci-purple to-purple-500 text-white shadow-md' 
              : 'text-slate-500 hover:text-sci-purple hover:bg-white/50'
          }`}
        >
          半自动模式
        </button>
      </div>

      {activeTab === 'MANUAL' ? (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 pb-20 px-1">
            {/* ... Existing Manual Mode Components ... */}
            
            {/* 1. Device Enable Card */}
            <div className="glass-panel lg:col-span-12 rounded-3xl p-6">
                <h3 className="text-slate-800 font-bold flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-blue-100 text-sci-blue rounded-lg"><Power size={18} /></div>
                    设备使能
                </h3>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl flex-1 border border-slate-100 shadow-sm">
                        <span className="text-slate-600 font-medium">底盘电机</span>
                        <button 
                            onClick={toggleChassis}
                            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                                chassisEnabled 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                        >
                            {chassisEnabled ? '在线' : '离线'}
                        </button>
                    </div>
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl flex-1 border border-slate-100 shadow-sm">
                        <span className="text-slate-600 font-medium">机械臂</span>
                        <button 
                             onClick={toggleArm}
                             className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                                 armEnabled 
                                 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                                 : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                             }`}
                        >
                            {armEnabled ? '在线' : '离线'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Pump Control */}
            <div className="glass-panel lg:col-span-4 rounded-3xl p-6">
                <h3 className="text-slate-800 font-bold flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-cyan-100 text-sci-cyan rounded-lg"><Droplets size={18} /></div>
                    水泵控制
                </h3>
                <div className="space-y-8">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-sm text-slate-500 font-medium ml-2">总开关</span>
                        <button 
                             onClick={togglePump}
                             className={`w-14 h-8 rounded-full transition-all relative shadow-inner ${pumpOn ? 'bg-sci-cyan' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${pumpOn ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>速度</span>
                            <span className="text-sci-cyan bg-cyan-50 px-2 py-0.5 rounded">{pumpSpeed} ml/s</span>
                        </div>
                        <input 
                            type="range" min="0" max="200" value={pumpSpeed}
                            onChange={(e) => handlePumpSliderChange('speed', parseInt(e.target.value))}
                            className="w-full accent-sci-cyan h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="space-y-3">
                         <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>容量</span>
                            <span className="text-sci-cyan bg-cyan-50 px-2 py-0.5 rounded">{pumpFluid} ml</span>
                        </div>
                        <input 
                            type="range" min="0" max="12" value={pumpFluid}
                            onChange={(e) => handlePumpSliderChange('fluid', parseInt(e.target.value))}
                            className="w-full accent-sci-cyan h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* 3. Chassis Control */}
            <div className={`glass-panel lg:col-span-4 rounded-3xl p-6 flex flex-col items-center transition-opacity duration-300 ${!chassisEnabled ? 'opacity-60 pointer-events-none grayscale' : ''}`}>
                 <h3 className="text-slate-800 font-bold flex items-center gap-2 mb-6 w-full">
                    <div className="p-1.5 bg-blue-100 text-sci-blue rounded-lg"><Move size={18} /></div>
                    底盘驱动
                </h3>
                
                <div className="flex items-center gap-6 mb-8 w-full justify-center">
                    {/* D-PAD */}
                    <div className="grid grid-cols-3 gap-2">
                        {/* Row 1 */}
                        <div className="col-start-2">
                             <button
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-100 shadow-md ${
                                    movementState.up 
                                    ? 'bg-sci-blue text-white translate-y-1 shadow-inner' 
                                    : 'bg-white text-sci-blue border border-blue-100 hover:border-sci-blue hover:shadow-lg'
                                }`}
                                onMouseDown={() => handleDirectionStart('up')}
                                onMouseUp={() => handleDirectionEnd('up')}
                                onMouseLeave={() => handleDirectionEnd('up')}
                                onTouchStart={(e) => { e.preventDefault(); handleDirectionStart('up'); }}
                                onTouchEnd={(e) => { e.preventDefault(); handleDirectionEnd('up'); }}
                             >
                                <ChevronUp size={32} />
                             </button>
                        </div>
                        
                        {/* Row 2 */}
                        <div className="col-start-1 row-start-2">
                            <button
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-100 shadow-md ${
                                    movementState.left
                                    ? 'bg-sci-blue text-white translate-y-1 shadow-inner' 
                                    : 'bg-white text-sci-blue border border-blue-100 hover:border-sci-blue hover:shadow-lg'
                                }`}
                                onMouseDown={() => handleDirectionStart('left')}
                                onMouseUp={() => handleDirectionEnd('left')}
                                onMouseLeave={() => handleDirectionEnd('left')}
                                onTouchStart={(e) => { e.preventDefault(); handleDirectionStart('left'); }}
                                onTouchEnd={(e) => { e.preventDefault(); handleDirectionEnd('left'); }}
                             >
                                <ChevronLeft size={32} />
                             </button>
                        </div>
                        <div className="col-start-3 row-start-2">
                            <button
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-100 shadow-md ${
                                    movementState.right
                                    ? 'bg-sci-blue text-white translate-y-1 shadow-inner' 
                                    : 'bg-white text-sci-blue border border-blue-100 hover:border-sci-blue hover:shadow-lg'
                                }`}
                                onMouseDown={() => handleDirectionStart('right')}
                                onMouseUp={() => handleDirectionEnd('right')}
                                onMouseLeave={() => handleDirectionEnd('right')}
                                onTouchStart={(e) => { e.preventDefault(); handleDirectionStart('right'); }}
                                onTouchEnd={(e) => { e.preventDefault(); handleDirectionEnd('right'); }}
                             >
                                <ChevronRight size={32} />
                             </button>
                        </div>

                        {/* Row 3 */}
                        <div className="col-start-2 row-start-3">
                             <button
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-100 shadow-md ${
                                    movementState.down
                                    ? 'bg-sci-blue text-white translate-y-1 shadow-inner' 
                                    : 'bg-white text-sci-blue border border-blue-100 hover:border-sci-blue hover:shadow-lg'
                                }`}
                                onMouseDown={() => handleDirectionStart('down')}
                                onMouseUp={() => handleDirectionEnd('down')}
                                onMouseLeave={() => handleDirectionEnd('down')}
                                onTouchStart={(e) => { e.preventDefault(); handleDirectionStart('down'); }}
                                onTouchEnd={(e) => { e.preventDefault(); handleDirectionEnd('down'); }}
                             >
                                <ChevronDown size={32} />
                             </button>
                        </div>
                    </div>

                    {/* Rotation Controls */}
                    <div className="flex flex-col gap-3 ml-4">
                        <button 
                            className={`p-4 rounded-2xl border transition-all shadow-sm ${zRotation > 0 ? 'bg-sci-blue text-white border-transparent shadow-blue-500/30 translate-y-0.5' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                            onMouseDown={() => setZRotation(1)}
                            onMouseUp={() => setZRotation(0)}
                            onMouseLeave={() => setZRotation(0)}
                            onTouchStart={(e) => { e.preventDefault(); setZRotation(1); }}
                            onTouchEnd={(e) => { e.preventDefault(); setZRotation(0); }}
                        >
                            <RotateCcw size={24} />
                        </button>
                        <button 
                            className={`p-4 rounded-2xl border transition-all shadow-sm ${zRotation < 0 ? 'bg-sci-blue text-white border-transparent shadow-blue-500/30 translate-y-0.5' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                            onMouseDown={() => setZRotation(-1)}
                            onMouseUp={() => setZRotation(0)}
                            onMouseLeave={() => setZRotation(0)}
                            onTouchStart={(e) => { e.preventDefault(); setZRotation(-1); }}
                            onTouchEnd={(e) => { e.preventDefault(); setZRotation(0); }}
                        >
                            <RotateCw size={24} />
                        </button>
                    </div>
                </div>

                <div className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mt-4">
                    <div className="flex justify-between text-xs font-bold mb-3">
                        <span className="text-slate-400">速度限制</span>
                        <span className="text-sci-blue">{chassisSpeedSetting} mm/s</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setChassisSpeedSetting(Math.max(0, chassisSpeedSetting - 50))} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">-</button>
                        <input 
                            type="range" min="0" max="1000" step="50"
                            value={chassisSpeedSetting}
                            onChange={(e) => setChassisSpeedSetting(parseInt(e.target.value))}
                            className="flex-1 accent-sci-blue h-2 bg-slate-200 rounded-lg appearance-none"
                        />
                        <button onClick={() => setChassisSpeedSetting(Math.min(1000, chassisSpeedSetting + 50))} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">+</button>
                    </div>
                </div>
            </div>

            {/* 4. Arm Control */}
            <div className={`glass-panel lg:col-span-4 rounded-3xl p-6 transition-opacity duration-300 ${!armEnabled ? 'opacity-60 pointer-events-none grayscale' : ''}`}>
                 <h3 className="text-slate-800 font-bold flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-purple-100 text-sci-purple rounded-lg"><GitCommit size={18} /></div>
                    机械臂运动学
                </h3>
                
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>偏航角 (Yaw)</span>
                            <span className="text-sci-purple bg-purple-50 px-2 py-0.5 rounded">{armYaw}°</span>
                        </div>
                        <input 
                            type="range" min="-90" max="90" value={armYaw}
                            onChange={(e) => handleArmChange('yaw', parseInt(e.target.value))}
                            className="w-full accent-sci-purple h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>翻滚角 (Roll)</span>
                            <span className="text-sci-purple bg-purple-50 px-2 py-0.5 rounded">{armRoll}°</span>
                        </div>
                        <input 
                            type="range" min="-180" max="180" value={armRoll}
                            onChange={(e) => handleArmChange('roll', parseInt(e.target.value))}
                            className="w-full accent-sci-purple h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>高度</span>
                            <span className="text-sci-purple bg-purple-50 px-2 py-0.5 rounded">{armHeight} cm</span>
                        </div>
                        <input 
                            type="range" min="0" max="8" value={armHeight}
                            onChange={(e) => handleArmChange('height', parseInt(e.target.value))}
                            className="w-full accent-sci-purple h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <button 
                        onClick={resetArm}
                        className="w-full py-3 mt-4 bg-white border border-purple-200 text-sci-purple rounded-xl hover:bg-purple-50 transition-all font-bold text-sm shadow-sm"
                    >
                        复位
                    </button>
                </div>
            </div>

        </div>
      ) : (
        /* --- SEMI AUTO INTERFACE --- */
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 pb-20 px-1">
            
            {/* 1. Configuration: Mode & Direction */}
            <div className="glass-panel lg:col-span-4 rounded-3xl p-6">
                <h3 className="text-slate-800 font-bold flex items-center gap-2 mb-6">
                    <div className="p-1.5 bg-purple-100 text-sci-purple rounded-lg"><Activity size={18} /></div>
                    模式配置
                </h3>
                
                <div className="space-y-6">
                    {/* Coating Type Selection */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 mb-2 block">施工工艺</label>
                        <div className="flex bg-white rounded-xl p-1 border border-slate-100">
                            <button
                                onClick={() => setCoatingType(0)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${coatingType === 0 ? 'bg-sci-purple text-white shadow-md' : 'text-slate-500 hover:text-sci-purple'}`}
                            >
                                <PaintRoller size={16} /> 刮涂
                            </button>
                            <button
                                onClick={() => setCoatingType(1)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${coatingType === 1 ? 'bg-sci-purple text-white shadow-md' : 'text-slate-500 hover:text-sci-purple'}`}
                            >
                                <Layers size={16} /> 辊涂
                            </button>
                        </div>
                    </div>

                    {/* Direction Selection */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 mb-2 block">作业方向</label>
                        <div className="flex bg-white rounded-xl p-1 border border-slate-100">
                            <button
                                onClick={() => setDirection(0)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${direction === 0 ? 'bg-sci-blue text-white shadow-md' : 'text-slate-500 hover:text-sci-blue'}`}
                            >
                                <ArrowLeftRight size={16} className="rotate-180" /> 向左
                            </button>
                            <button
                                onClick={() => setDirection(1)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${direction === 1 ? 'bg-sci-blue text-white shadow-md' : 'text-slate-500 hover:text-sci-blue'}`}
                            >
                                <ArrowLeftRight size={16} /> 向右
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Parameter Sliders */}
            <div className="glass-panel lg:col-span-8 rounded-3xl p-6">
                 <h3 className="text-slate-800 font-bold flex items-center gap-2 mb-6">
                    <div className="p-1.5 bg-blue-100 text-sci-blue rounded-lg"><Ruler size={18} /></div>
                    施工参数
                </h3>

                <div className="space-y-8">
                    {/* Length Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>长度 (Length)</span>
                            <span className="text-sci-blue bg-blue-50 px-2 py-0.5 rounded">{paramLength.toFixed(1)} m</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => updateFloatParam(setParamLength, paramLength, -0.5, 0, 40)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">-</button>
                            <input 
                                type="range" min="0" max="40" step="0.5" value={paramLength}
                                onChange={(e) => setParamLength(parseFloat(e.target.value))}
                                className="flex-1 accent-sci-blue h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <button onClick={() => updateFloatParam(setParamLength, paramLength, 0.5, 0, 40)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">+</button>
                        </div>
                    </div>

                    {/* Width Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>宽度 (Width)</span>
                            <span className="text-sci-blue bg-blue-50 px-2 py-0.5 rounded">{paramWidth.toFixed(1)} m</span>
                        </div>
                         <div className="flex items-center gap-4">
                            <button onClick={() => updateFloatParam(setParamWidth, paramWidth, -0.1, 0, 2.4)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">-</button>
                            <input 
                                type="range" min="0" max="2.4" step="0.1" value={paramWidth}
                                onChange={(e) => setParamWidth(parseFloat(e.target.value))}
                                className="flex-1 accent-sci-blue h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <button onClick={() => updateFloatParam(setParamWidth, paramWidth, 0.1, 0, 2.4)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">+</button>
                        </div>
                    </div>

                    {/* Thickness Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>厚度 (Thickness)</span>
                            <span className="text-sci-purple bg-purple-50 px-2 py-0.5 rounded">{paramThickness.toFixed(1)} mm</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => updateFloatParam(setParamThickness, paramThickness, -0.5, 0, 20)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">-</button>
                            <input 
                                type="range" min="0" max="20" step="0.5" value={paramThickness}
                                onChange={(e) => setParamThickness(parseFloat(e.target.value))}
                                className="flex-1 accent-sci-purple h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <button onClick={() => updateFloatParam(setParamThickness, paramThickness, 0.5, 0, 20)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">+</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Action Card */}
            <div className="glass-panel lg:col-span-12 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Status Overlay */}
                {semiAutoAck && (
                    <div className="absolute top-4 bg-slate-800/80 text-white px-4 py-1 rounded-full text-xs font-mono animate-pulse">
                        {semiAutoAck}
                    </div>
                )}

                <div className="w-full max-w-md">
                    {!isConstructing ? (
                         <button
                            onClick={handleStartConstruction}
                            disabled={!isConfigValid}
                            className={`w-full py-6 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all ${
                                isConfigValid 
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.02]' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            <Play size={28} fill="currentColor" />
                            {isConfigValid ? '配置完成 - 开始施工' : '请先配置施工参数'}
                        </button>
                    ) : (
                        <div className="space-y-4">
                             <div className="text-center mb-4">
                                <div className="inline-block p-3 bg-blue-50 text-sci-blue rounded-full mb-2 animate-bounce">
                                    <Activity size={32} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-700">正在施工中...</h4>
                                <p className="text-slate-500 text-sm">Target: {paramLength}m x {paramWidth}m</p>
                             </div>

                             <button
                                onClick={handleChangeCartridge}
                                className="w-full py-6 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all bg-gradient-to-r from-red-500 to-red-400 text-white shadow-lg shadow-red-500/30 hover:scale-[1.02] animate-pulse-fast"
                            >
                                <RefreshCw size={28} className="animate-spin-slow" />
                                更换料筒 / 停止施工
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
      )}
    </div>
  );
};

export default ManualAuto;