import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ros2Connection } from '../libs/ros2Connection';
import Joystick from './Joystick';
import { Power, RotateCcw, RotateCw, Activity, Droplets, Move, GitCommit } from 'lucide-react';

const ManualAuto: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'SEMI'>('MANUAL');
  
  // Enable States
  const [chassisEnabled, setChassisEnabled] = useState(false);
  const [armEnabled, setArmEnabled] = useState(false);
  
  // Pump States
  const [pumpOn, setPumpOn] = useState(false);
  const [pumpSpeed, setPumpSpeed] = useState(0);
  const [pumpFluid, setPumpFluid] = useState(0);

  // Chassis Control States
  const [chassisSpeedSetting, setChassisSpeedSetting] = useState(500); 
  const [joystickData, setJoystickData] = useState({ x: 0, y: 0 });
  const [zRotation, setZRotation] = useState(0);

  // Arm Control States
  const [armYaw, setArmYaw] = useState(0);
  const [armRoll, setArmRoll] = useState(0);
  const [armHeight, setArmHeight] = useState(0);

  // Switch Mode logic
  const handleTabChange = async (tab: 'MANUAL' | 'SEMI') => {
    setActiveTab(tab);
    try {
        await ros2Connection.sendMachineModeRequest(tab === 'MANUAL' ? 1 : 2);
    } catch (e) {
        console.error("Failed to switch mode", e);
    }
  };

  // Toggle Chassis Enable
  const toggleChassis = async () => {
    try {
        const cmd = chassisEnabled ? 0 : 1;
        const ack = await ros2Connection.sendChassisEnableRequest(cmd);
        if (ack === 1) setChassisEnabled(!chassisEnabled);
    } catch (e) {
        console.error("Chassis enable failed", e);
    }
  };

  // Toggle Arm Enable
  const toggleArm = async () => {
    try {
        const cmd = armEnabled ? 0 : 1;
        const ack = await ros2Connection.sendArmEnableRequest(cmd);
        if (ack === 1) setArmEnabled(!armEnabled);
    } catch (e) {
        console.error("Arm enable failed", e);
    }
  };

  // Pump Logic
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

  // Arm Logic
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

  // Chassis Loop
  useEffect(() => {
    if (!chassisEnabled) return;

    const interval = setInterval(() => {
        if (joystickData.x !== 0 || joystickData.y !== 0 || zRotation !== 0) {
            const scale = chassisSpeedSetting / 1000.0; 
            const x_speed = -joystickData.y * scale;
            const y_speed = -joystickData.x * scale;
            const z_speed = zRotation * 30; 

            ros2Connection.publishChassisControl({ x_speed, y_speed, z_speed });
        }
    }, 100);

    return () => clearInterval(interval);
  }, [chassisEnabled, joystickData, zRotation, chassisSpeedSetting]);

  // Ensure 0 is sent when stopping
  useEffect(() => {
      if(chassisEnabled && joystickData.x === 0 && joystickData.y === 0 && zRotation === 0) {
          ros2Connection.publishChassisControl({ x_speed: 0, y_speed: 0, z_speed: 0 });
      }
  }, [joystickData, zRotation, chassisEnabled]);


  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Tabs - Floating Island Style */}
      <div className="flex space-x-1 bg-white/70 p-1.5 rounded-2xl w-fit mx-auto border border-white shadow-lg backdrop-blur-md sticky top-0 z-20">
        <button
          onClick={() => handleTabChange('MANUAL')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
            activeTab === 'MANUAL' 
              ? 'bg-gradient-to-r from-sci-blue to-blue-500 text-white shadow-md' 
              : 'text-slate-500 hover:text-sci-blue hover:bg-white/50'
          }`}
        >
          MANUAL
        </button>
        <button
          onClick={() => handleTabChange('SEMI')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
            activeTab === 'SEMI' 
              ? 'bg-gradient-to-r from-sci-purple to-purple-500 text-white shadow-md' 
              : 'text-slate-500 hover:text-sci-purple hover:bg-white/50'
          }`}
        >
          SEMI-AUTO
        </button>
      </div>

      {activeTab === 'MANUAL' ? (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 pb-20 px-1">
            
            {/* 1. Device Enable Card */}
            <div className="glass-panel lg:col-span-12 rounded-3xl p-6">
                <h3 className="text-slate-800 font-bold flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-blue-100 text-sci-blue rounded-lg"><Power size={18} /></div>
                    DEVICE ENABLE
                </h3>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl flex-1 border border-slate-100 shadow-sm">
                        <span className="text-slate-600 font-medium">CHASSIS MOTOR</span>
                        <button 
                            onClick={toggleChassis}
                            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                                chassisEnabled 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                        >
                            {chassisEnabled ? 'ONLINE' : 'OFFLINE'}
                        </button>
                    </div>
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl flex-1 border border-slate-100 shadow-sm">
                        <span className="text-slate-600 font-medium">ROBOT ARM</span>
                        <button 
                             onClick={toggleArm}
                             className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                                 armEnabled 
                                 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                                 : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                             }`}
                        >
                            {armEnabled ? 'ONLINE' : 'OFFLINE'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Pump Control */}
            <div className="glass-panel lg:col-span-4 rounded-3xl p-6">
                <h3 className="text-slate-800 font-bold flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-cyan-100 text-sci-cyan rounded-lg"><Droplets size={18} /></div>
                    PUMP CONTROL
                </h3>
                <div className="space-y-8">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                        <span className="text-sm text-slate-500 font-medium ml-2">MASTER SWITCH</span>
                        <button 
                             onClick={togglePump}
                             className={`w-14 h-8 rounded-full transition-all relative shadow-inner ${pumpOn ? 'bg-sci-cyan' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${pumpOn ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>SPEED</span>
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
                            <span>VOLUME</span>
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
                    CHASSIS DRIVE
                </h3>
                
                <div className="flex items-end gap-6 mb-8">
                    <Joystick onMove={(x, y) => setJoystickData({x, y})} onStop={() => setJoystickData({x:0, y:0})} />
                    
                    <div className="flex flex-col gap-3">
                        <button 
                            className={`p-4 rounded-2xl border transition-all shadow-sm ${zRotation > 0 ? 'bg-sci-blue text-white border-transparent shadow-blue-500/30' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                            onMouseDown={() => setZRotation(1)}
                            onMouseUp={() => setZRotation(0)}
                            onTouchStart={() => setZRotation(1)}
                            onTouchEnd={() => setZRotation(0)}
                        >
                            <RotateCcw size={24} />
                        </button>
                        <button 
                            className={`p-4 rounded-2xl border transition-all shadow-sm ${zRotation < 0 ? 'bg-sci-blue text-white border-transparent shadow-blue-500/30' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                            onMouseDown={() => setZRotation(-1)}
                            onMouseUp={() => setZRotation(0)}
                            onTouchStart={() => setZRotation(-1)}
                            onTouchEnd={() => setZRotation(0)}
                        >
                            <RotateCw size={24} />
                        </button>
                    </div>
                </div>

                <div className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between text-xs font-bold mb-3">
                        <span className="text-slate-400">SPEED LIMIT</span>
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
                    ARM KINEMATICS
                </h3>
                
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>YAW</span>
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
                            <span>ROLL</span>
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
                            <span>HEIGHT</span>
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
                        RESET POSITION
                    </button>
                </div>
            </div>

        </div>
      ) : (
        /* SEMI AUTO Placeholder */
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-6">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl">
                 <Activity size={48} className="animate-pulse text-sci-purple" />
            </div>
            <div className="text-center font-mono">
                <h3 className="text-xl font-bold text-slate-700 mb-2">SEMI-AUTO ACTIVE</h3>
                <p>Waiting for parameter configuration...</p>
                <div className="mt-6 px-4 py-2 bg-white rounded-full border border-slate-200 text-xs inline-block">
                    CONSTRUCTION PENDING
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ManualAuto;