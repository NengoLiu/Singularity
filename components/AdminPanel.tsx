import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Cpu, HardDrive, Activity, 
  Thermometer, Sliders, Save, RotateCcw, 
  Terminal, AlertOctagon, FileText, CheckCircle2
} from 'lucide-react';

// Mock Logs
const INITIAL_LOGS = [
  "[SYSTEM] Kernel initialized in 0.042s",
  "[MODULE] Motor drivers [M1, M2, M3, M4] online",
  "[SENSOR] Lidar calibration matrix loaded",
  "[COATING] Nozzle pressure stabilized at 120 PSI",
  "[NETWORK] Neural Link connected via Secure WSS",
  "[AI] Singularity Core v2.0 standing by..."
];

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SYSTEM' | 'CONFIG' | 'LOGS'>('SYSTEM');
  const [logs, setLogs] = useState<string[]>(INITIAL_LOGS);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Simulation States
  const [cpuUsage, setCpuUsage] = useState(12);
  const [temp, setTemp] = useState(38);
  
  // Config States
  const [config, setConfig] = useState({
      maxSpeed: 1.2, // m/s
      overlapRatio: 15, // %
      pumpPressure: 85, // PSI
      turnRadius: 0.5, // m
      pidP: 0.85,
      pidI: 0.12,
      pidD: 0.05
  });

  // Auto-scroll logs
  useEffect(() => {
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, activeTab]);

  // Simulate telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
        setCpuUsage(prev => Math.min(100, Math.max(5, prev + (Math.random() - 0.5) * 10)));
        setTemp(prev => Math.min(80, Math.max(30, prev + (Math.random() - 0.5) * 2)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConfigChange = (key: keyof typeof config, value: number) => {
      setConfig(prev => ({ ...prev, [key]: value }));
  };

  const addLog = (msg: string) => {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const handleSaveConfig = () => {
      addLog("[CONFIG] Parameters saved to non-volatile memory.");
      addLog("[SYSTEM] Applying new kinematics...");
  };

  const renderSystemTab = () => (
    <div className="grid grid-cols-2 gap-4 h-full overflow-y-auto custom-scrollbar p-1">
        {/* Core Metrics */}
        <div className="col-span-2 glass-panel rounded-2xl p-4 flex items-center justify-around">
            <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                        <circle cx="48" cy="48" r="40" stroke="#06b6d4" strokeWidth="8" fill="transparent" 
                                strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - cpuUsage / 100)} 
                                className="transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Cpu size={20} className="text-slate-400 mb-1" />
                        <span className="text-xl font-bold text-white font-mono">{cpuUsage.toFixed(0)}%</span>
                    </div>
                </div>
                <span className="text-xs font-bold text-slate-400 tracking-wider">CPU LOAD</span>
            </div>

            <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                        <circle cx="48" cy="48" r="40" stroke={temp > 60 ? '#ef4444' : '#3b82f6'} strokeWidth="8" fill="transparent" 
                                strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - temp / 100)} 
                                className="transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Thermometer size={20} className="text-slate-400 mb-1" />
                        <span className="text-xl font-bold text-white font-mono">{temp.toFixed(0)}°C</span>
                    </div>
                </div>
                <span className="text-xs font-bold text-slate-400 tracking-wider">CORE TEMP</span>
            </div>
        </div>

        {/* Module Status List */}
        <div className="col-span-2 glass-panel rounded-2xl p-4">
            <h3 className="text-xs font-bold text-sci-cyan mb-4 flex items-center gap-2 uppercase tracking-widest neon-text">
                <Activity size={14} /> 模块健康状态
            </h3>
            <div className="space-y-3">
                {[
                    { name: 'IMU 惯导单元', status: 'CALIBRATED', color: 'text-emerald-400' },
                    { name: '涂料流量计', status: 'NORMAL', color: 'text-emerald-400' },
                    { name: '左轮伺服电机', status: 'ONLINE', color: 'text-emerald-400' },
                    { name: '右轮伺服电机', status: 'ONLINE', color: 'text-emerald-400' },
                    { name: '主控通信总线', status: 'STABLE', color: 'text-sci-blue' },
                ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                        <span className="text-sm text-slate-300">{item.name}</span>
                        <div className="flex items-center gap-2">
                             <span className={`text-xs font-mono font-bold ${item.color}`}>{item.status}</span>
                             <div className={`w-2 h-2 rounded-full ${item.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor] animate-pulse`} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderConfigTab = () => (
      <div className="h-full overflow-y-auto custom-scrollbar p-1 pb-20">
          <div className="glass-panel rounded-2xl p-4 mb-4">
              <h3 className="text-xs font-bold text-sci-purple mb-4 flex items-center gap-2 uppercase tracking-widest neon-text">
                  <Sliders size={14} /> 施工参数校准
              </h3>
              
              <div className="space-y-6">
                  {/* Max Speed */}
                  <div>
                      <div className="flex justify-between mb-2">
                          <span className="text-sm text-slate-400">最大行进速度 (Max Speed)</span>
                          <span className="text-sm font-mono text-sci-cyan">{config.maxSpeed} m/s</span>
                      </div>
                      <input type="range" min="0.1" max="3.0" step="0.1" value={config.maxSpeed} 
                             onChange={(e) => handleConfigChange('maxSpeed', parseFloat(e.target.value))}
                             className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-sci-cyan cursor-pointer" />
                  </div>

                  {/* Overlap */}
                  <div>
                      <div className="flex justify-between mb-2">
                          <span className="text-sm text-slate-400">涂膜重叠率 (Overlap)</span>
                          <span className="text-sm font-mono text-sci-cyan">{config.overlapRatio}%</span>
                      </div>
                      <input type="range" min="0" max="50" step="1" value={config.overlapRatio} 
                             onChange={(e) => handleConfigChange('overlapRatio', parseFloat(e.target.value))}
                             className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-sci-cyan cursor-pointer" />
                  </div>
                  
                  {/* PID Tuning Section */}
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-3 text-slate-500 text-xs font-bold">
                          <Activity size={12} /> 运动控制 PID
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-center text-slate-500">P (比例)</span>
                              <input type="number" step="0.01" value={config.pidP} onChange={(e) => handleConfigChange('pidP', parseFloat(e.target.value))} className="bg-slate-800 border border-slate-700 rounded text-center text-sci-blue text-sm py-1 focus:border-sci-blue outline-none" />
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-center text-slate-500">I (积分)</span>
                              <input type="number" step="0.01" value={config.pidI} onChange={(e) => handleConfigChange('pidI', parseFloat(e.target.value))} className="bg-slate-800 border border-slate-700 rounded text-center text-sci-blue text-sm py-1 focus:border-sci-blue outline-none" />
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-center text-slate-500">D (微分)</span>
                              <input type="number" step="0.01" value={config.pidD} onChange={(e) => handleConfigChange('pidD', parseFloat(e.target.value))} className="bg-slate-800 border border-slate-700 rounded text-center text-sci-blue text-sm py-1 focus:border-sci-blue outline-none" />
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex gap-3">
               <button onClick={handleSaveConfig} className="flex-1 bg-sci-blue hover:bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all active:scale-95">
                   <Save size={18} /> 保存配置
               </button>
               <button onClick={() => addLog("[SYSTEM] Configuration Reset.")} className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-xl transition-all">
                   <RotateCcw size={18} />
               </button>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full w-full">
        {/* Admin Header */}
        <div className="flex items-center justify-between mb-4 px-1">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shadow-lg">
                    <ShieldCheck className="text-sci-cyan" size={20} />
                 </div>
                 <div>
                     <h1 className="text-lg font-black italic text-white tracking-wide">ADMIN_CONSOLE</h1>
                     <p className="text-[10px] font-mono text-sci-cyan uppercase tracking-wider">Root Access Granted</p>
                 </div>
             </div>
             <div className="bg-red-900/20 border border-red-500/30 px-3 py-1 rounded text-[10px] font-bold text-red-400 animate-pulse flex items-center gap-2">
                 <AlertOctagon size={12} /> LIVE
             </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-slate-900/80 rounded-xl border border-slate-800 mb-4 backdrop-blur-sm">
            {[
                { id: 'SYSTEM', icon: HardDrive, label: '系统概况' },
                { id: 'CONFIG', icon: Sliders, label: '参数配置' },
                { id: 'LOGS', icon: Terminal, label: '运行日志' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        activeTab === tab.id 
                        ? 'bg-sci-cyan/10 text-sci-cyan border border-sci-cyan/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <tab.icon size={14} /> {tab.label}
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 relative">
            {activeTab === 'SYSTEM' && renderSystemTab()}
            {activeTab === 'CONFIG' && renderConfigTab()}
            
            {activeTab === 'LOGS' && (
                <div className="h-full glass-panel rounded-2xl p-4 overflow-hidden flex flex-col">
                     <h3 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2 uppercase tracking-widest border-b border-slate-800 pb-2">
                        <FileText size={14} /> System Kernel Output
                    </h3>
                    <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar p-2 bg-slate-950/50 rounded-lg border border-slate-800/50">
                        {logs.map((log, idx) => (
                            <div key={idx} className="break-all">
                                <span className="text-slate-500 mr-2">{idx + 1}</span>
                                <span className={log.includes('ERROR') ? 'text-red-400' : log.includes('SYSTEM') ? 'text-sci-blue' : 'text-emerald-400'}>
                                    {log}
                                </span>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminPanel;