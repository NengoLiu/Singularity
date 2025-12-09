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
  const [chassisSpeedSetting, setChassisSpeedSetting] = useState(500); // mm/s visual representation
  const [joystickData, setJoystickData] = useState({ x: 0, y: 0 });
  const [zRotation, setZRotation] = useState(0); // -1 to 1

  // Arm Control States
  const [armYaw, setArmYaw] = useState(0);
  const [armRoll, setArmRoll] = useState(0);
  const [armHeight, setArmHeight] = useState(0);

  // Switch Mode logic
  const handleTabChange = async (tab: 'MANUAL' | 'SEMI') => {
    setActiveTab(tab);
    try {
        // 1: Manual, 2: Semi-Auto
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
    
    // Debounce or immediate send? For responsiveness, sending immediately but relying on the backend to handle rate is okay, 
    // or we can use the interval loop. Here we send on change for simplicity.
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
        // If joystick is active or rotation is active
        if (joystickData.x !== 0 || joystickData.y !== 0 || zRotation !== 0) {
            // Mapping:
            // Joystick Y (up is -1 in HTML, usually we want +1 for forward). 
            // So x_speed (forward) = -joystick.y * scale
            // Joystick X (right is +1). y_speed (left/right) -> usually Left is +Y in ROS ENU.
            // So y_speed (left) = -joystick.x * scale
            
            // Speed scale: converting abstract 0-1 to m/s. Let's assume max speed setting (500) = 0.5 m/s? 
            // Or just treat speedSetting as a raw multiplier. 
            // User provided x_speed as float64 m/s. 
            // Let's assume speedSetting 500 = 0.5m/s.
            const scale = chassisSpeedSetting / 1000.0; 

            const x_speed = -joystickData.y * scale;
            const y_speed = -joystickData.x * scale;
            const z_speed = zRotation * 30; // 30 deg/s max rotation

            ros2Connection.publishChassisControl({
                x_speed,
                y_speed,
                z_speed
            });
        } else {
             // Send stop packet occasionally? Or rely on release?
             // Usually good to send 0s once when stopping, Joystick component calls onStop which sets x/y to 0.
             // We can detect if we just stopped. 
             // For simplicity, we just won't spam 0s if nothing is moving, 
             // BUT we need to send 0s at least once when releasing. 
             // The state updates to 0,0, so this loop will catch the 0,0 state at least once if we don't return early.
             // However, to avoid spamming 0s forever, we can track 'isMoving'.
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
      {/* Top Tabs */}
      <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-xl w-fit mx-auto border border-gray-700 backdrop-blur-md sticky top-0 z-20">
        <button
          onClick={() => handleTabChange('MANUAL')}
          className={`px-8 py-2 rounded-lg font-mono text-sm font-bold transition-all duration-300 ${
            activeTab === 'MANUAL' 
              ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          MANUAL MODE
        </button>
        <button
          onClick={() => handleTabChange('SEMI')}
          className={`px-8 py-2 rounded-lg font-mono text-sm font-bold transition-all duration-300 ${
            activeTab === 'SEMI' 
              ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(188,19,254,0.4)]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          SEMI-AUTO MODE
        </button>
      </div>

      {activeTab === 'MANUAL' ? (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 pb-20">
            
            {/* 1. Device Enable Card */}
            <div className="lg:col-span-12 bg-gray-900/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-neon-blue font-mono font-bold flex items-center gap-2 mb-4">
                    <Power size={20} /> DEVICE ENABLE
                </h3>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl flex-1 border border-gray-800">
                        <span className="text-gray-300 font-mono">CHASSIS MOTOR</span>
                        <button 
                            onClick={toggleChassis}
                            className={`px-6 py-2 rounded-lg font-bold font-mono transition-all ${
                                chassisEnabled ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-800 text-gray-500'
                            }`}
                        >
                            {chassisEnabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                    </div>
                    <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl flex-1 border border-gray-800">
                        <span className="text-gray-300 font-mono">ROBOT ARM</span>
                        <button 
                             onClick={toggleArm}
                             className={`px-6 py-2 rounded-lg font-bold font-mono transition-all ${
                                 armEnabled ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-800 text-gray-500'
                             }`}
                        >
                            {armEnabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Pump Control */}
            <div className="lg:col-span-4 bg-gray-900/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-neon-blue font-mono font-bold flex items-center gap-2 mb-4">
                    <Droplets size={20} /> PUMP CONTROL
                </h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">PUMP STATUS</span>
                        <button 
                             onClick={togglePump}
                             className={`w-12 h-6 rounded-full transition-colors relative ${pumpOn ? 'bg-neon-blue' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${pumpOn ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono text-gray-400">
                            <span>SPEED (ml/s)</span>
                            <span className="text-neon-blue">{pumpSpeed}</span>
                        </div>
                        <input 
                            type="range" min="0" max="200" value={pumpSpeed}
                            onChange={(e) => handlePumpSliderChange('speed', parseInt(e.target.value))}
                            className="w-full accent-neon-blue h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="space-y-2">
                         <div className="flex justify-between text-xs font-mono text-gray-400">
                            <span>FLUID (ml)</span>
                            <span className="text-neon-blue">{pumpFluid}</span>
                        </div>
                        <input 
                            type="range" min="0" max="12" value={pumpFluid}
                            onChange={(e) => handlePumpSliderChange('fluid', parseInt(e.target.value))}
                            className="w-full accent-neon-blue h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* 3. Chassis Control */}
            <div className={`lg:col-span-4 bg-gray-900/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col items-center ${!chassisEnabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                 <h3 className="text-neon-blue font-mono font-bold flex items-center gap-2 mb-4 w-full">
                    <Move size={20} /> CHASSIS DRIVE
                </h3>
                
                <div className="flex items-end gap-6 mb-6">
                    <Joystick onMove={(x, y) => setJoystickData({x, y})} onStop={() => setJoystickData({x:0, y:0})} />
                    
                    <div className="flex flex-col gap-2">
                        <button 
                            className={`p-4 rounded-xl border border-gray-700 bg-black/40 active:bg-neon-blue active:text-black transition-colors ${zRotation < 0 ? 'bg-neon-blue text-black' : 'text-gray-300'}`}
                            onMouseDown={() => setZRotation(1)} // Left turn usually positive Z? ROS convention varies. Let's assume CCW is positive
                            onMouseUp={() => setZRotation(0)}
                            onTouchStart={() => setZRotation(1)}
                            onTouchEnd={() => setZRotation(0)}
                        >
                            <RotateCcw size={24} />
                        </button>
                        <button 
                            className={`p-4 rounded-xl border border-gray-700 bg-black/40 active:bg-neon-blue active:text-black transition-colors ${zRotation > 0 ? 'bg-neon-blue text-black' : 'text-gray-300'}`}
                            onMouseDown={() => setZRotation(-1)}
                            onMouseUp={() => setZRotation(0)}
                            onTouchStart={() => setZRotation(-1)}
                            onTouchEnd={() => setZRotation(0)}
                        >
                            <RotateCw size={24} />
                        </button>
                    </div>
                </div>

                <div className="w-full bg-black/20 p-3 rounded-xl border border-gray-800">
                    <div className="flex justify-between text-xs font-mono mb-2">
                        <span className="text-gray-400">MAX SPEED LIMIT</span>
                        <span className="text-neon-blue">{chassisSpeedSetting} mm/s</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setChassisSpeedSetting(Math.max(0, chassisSpeedSetting - 50))} className="text-gray-500 hover:text-white">-</button>
                        <input 
                            type="range" min="0" max="1000" step="50"
                            value={chassisSpeedSetting}
                            onChange={(e) => setChassisSpeedSetting(parseInt(e.target.value))}
                            className="flex-1 accent-neon-blue h-1 bg-gray-700 rounded-lg appearance-none"
                        />
                        <button onClick={() => setChassisSpeedSetting(Math.min(1000, chassisSpeedSetting + 50))} className="text-gray-500 hover:text-white">+</button>
                    </div>
                </div>
            </div>

            {/* 4. Arm Control */}
            <div className={`lg:col-span-4 bg-gray-900/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm ${!armEnabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                 <h3 className="text-neon-blue font-mono font-bold flex items-center gap-2 mb-4">
                    <GitCommit size={20} /> ARM KINEMATICS
                </h3>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono text-gray-400">
                            <span>YAW (-90° to 90°)</span>
                            <span className="text-neon-purple">{armYaw}°</span>
                        </div>
                        <input 
                            type="range" min="-90" max="90" value={armYaw}
                            onChange={(e) => handleArmChange('yaw', parseInt(e.target.value))}
                            className="w-full accent-neon-purple h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono text-gray-400">
                            <span>ROLL (-180° to 180°)</span>
                            <span className="text-neon-purple">{armRoll}°</span>
                        </div>
                        <input 
                            type="range" min="-180" max="180" value={armRoll}
                            onChange={(e) => handleArmChange('roll', parseInt(e.target.value))}
                            className="w-full accent-neon-purple h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono text-gray-400">
                            <span>HEIGHT (0-8 cm)</span>
                            <span className="text-neon-purple">{armHeight} cm</span>
                        </div>
                        <input 
                            type="range" min="0" max="8" value={armHeight}
                            onChange={(e) => handleArmChange('height', parseInt(e.target.value))}
                            className="w-full accent-neon-purple h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <button 
                        onClick={resetArm}
                        className="w-full py-3 mt-2 border border-neon-purple/50 text-neon-purple rounded-xl hover:bg-neon-purple hover:text-white transition-all font-mono font-bold text-sm"
                    >
                        RESET POSITION
                    </button>
                </div>
            </div>

        </div>
      ) : (
        /* SEMI AUTO Placeholder */
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
            <Activity size={48} className="animate-pulse-fast text-neon-purple" />
            <div className="text-center font-mono">
                <h3 className="text-xl text-white mb-2">SEMI-AUTO MODE ACTIVE</h3>
                <p>Waiting for parameter configuration...</p>
                <p className="text-xs mt-4 opacity-50">(Interface construction pending)</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default ManualAuto;