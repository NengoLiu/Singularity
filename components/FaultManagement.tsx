import React, { useState } from 'react';
import { 
  AlertTriangle, AlertOctagon, CheckCircle2, 
  Wrench, Trash2, RefreshCcw, ClipboardList,
  ChevronDown, ChevronUp, Activity
} from 'lucide-react';

interface FaultRecord {
  id: string;
  code: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  module: string;
  message: string;
  timestamp: string;
  suggestion: string;
  resolved: boolean;
}

const MOCK_FAULTS: FaultRecord[] = [
  {
    id: 'f1',
    code: 'E-MOTOR-04',
    level: 'CRITICAL',
    module: 'Drive System',
    message: '左前轮伺服电机过载 (Left Front Servo Overload)',
    timestamp: '10:42:05',
    suggestion: '检查轮轴是否有异物卡死，或降低行进速度。',
    resolved: false
  },
  {
    id: 'f2',
    code: 'W-LIDAR-02',
    level: 'WARNING',
    module: 'Navigation',
    message: 'Lidar 数据同步延迟 > 200ms',
    timestamp: '10:41:55',
    suggestion: '建议重启导航模块或检查通信链路负载。',
    resolved: false
  },
  {
    id: 'f3',
    code: 'I-PUMP-01',
    level: 'INFO',
    module: 'Coating System',
    message: '涂料余量低于 15%',
    timestamp: '10:30:00',
    suggestion: '请准备更换料筒。',
    resolved: false
  },
  {
    id: 'f4',
    code: 'E-BAT-09',
    level: 'INFO',
    module: 'Power',
    message: '电池温度略高 (45°C)',
    timestamp: '09:15:00',
    suggestion: '正常范围内，持续监控。',
    resolved: true
  }
];

const FaultManagement: React.FC = () => {
  const [faults, setFaults] = useState<FaultRecord[]>(MOCK_FAULTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const activeFaults = faults.filter(f => !f.resolved);
  const resolvedFaults = faults.filter(f => f.resolved);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const resolveFault = (id: string) => {
    setFaults(prev => prev.map(f => f.id === id ? { ...f, resolved: true } : f));
    setExpandedId(null);
  };

  const clearHistory = () => {
      setFaults(prev => prev.filter(f => !f.resolved));
  };

  const runDiagnostics = () => {
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 2000);
  };

  const getLevelStyles = (level: string) => {
      switch(level) {
          case 'CRITICAL': return 'border-red-500/50 bg-red-950/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
          case 'WARNING': return 'border-orange-500/50 bg-orange-950/20 text-orange-400';
          default: return 'border-sci-blue/30 bg-slate-900/50 text-sci-blue';
      }
  };

  const getIcon = (level: string) => {
      switch(level) {
          case 'CRITICAL': return <AlertOctagon className="animate-pulse" />;
          case 'WARNING': return <AlertTriangle />;
          default: return <ClipboardList />;
      }
  };

  return (
    <div className="flex flex-col h-full w-full gap-4">
        {/* Header Summary */}
        <div className="flex gap-4 h-24 shrink-0">
            <div className="flex-1 glass-panel rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_#ef4444]"></div>
                <div className="ml-4">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Active Faults</div>
                    <div className="text-4xl font-black text-white font-mono">{activeFaults.length}</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-900/20 border border-red-500/50 flex items-center justify-center text-red-500">
                    <AlertTriangle size={24} />
                </div>
            </div>

            <div className="flex-1 glass-panel rounded-2xl p-4 flex items-center justify-between relative overflow-hidden">
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                 <div className="ml-4">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">System Health</div>
                    <div className="text-4xl font-black text-white font-mono">{activeFaults.some(f => f.level === 'CRITICAL') ? '82%' : '98%'}</div>
                </div>
                 <div className="h-12 w-12 rounded-full bg-emerald-900/20 border border-emerald-500/50 flex items-center justify-center text-emerald-500">
                    <Activity size={24} />
                </div>
            </div>
            
            <button 
                onClick={runDiagnostics}
                disabled={isScanning}
                className="w-24 glass-panel rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-800 transition-colors group cursor-pointer active:scale-95"
            >
                <RefreshCcw size={24} className={`text-sci-cyan ${isScanning ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                <span className="text-[10px] font-bold text-slate-400">自检</span>
            </button>
        </div>

        {/* Fault List */}
        <div className="flex-1 glass-panel rounded-2xl p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                 <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wrench size={16} className="text-sci-purple" /> 
                    故障列表 / Event Log
                 </h3>
                 {resolvedFaults.length > 0 && (
                     <button onClick={clearHistory} className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1">
                         <Trash2 size={12} /> 清除历史
                     </button>
                 )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {activeFaults.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-600 gap-2">
                        <CheckCircle2 size={48} className="text-emerald-900" />
                        <span className="text-xs font-mono">ALL SYSTEMS NOMINAL</span>
                    </div>
                )}

                {activeFaults.map(fault => (
                    <div 
                        key={fault.id}
                        className={`border rounded-xl transition-all duration-300 ${getLevelStyles(fault.level)}`}
                    >
                        <div 
                            className="p-3 flex items-center gap-3 cursor-pointer"
                            onClick={() => toggleExpand(fault.id)}
                        >
                            <div className="shrink-0">{getIcon(fault.level)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-bold text-sm truncate pr-2">{fault.message}</span>
                                    <span className="text-[10px] font-mono opacity-70 shrink-0 bg-black/20 px-1.5 py-0.5 rounded">{fault.timestamp}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] opacity-80 font-mono">
                                    <span>{fault.code}</span>
                                    <span>•</span>
                                    <span>{fault.module}</span>
                                </div>
                            </div>
                            <div className="shrink-0">
                                {expandedId === fault.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </div>
                        
                        {/* Expanded Details */}
                        <div className={`overflow-hidden transition-all duration-300 ${expandedId === fault.id ? 'max-h-40 border-t border-black/20' : 'max-h-0'}`}>
                            <div className="p-3 bg-black/10 text-xs">
                                <div className="mb-2">
                                    <span className="font-bold opacity-70 block mb-1">建议操作 (SUGGESTION):</span>
                                    <p className="opacity-90">{fault.suggestion}</p>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); resolveFault(fault.id); }}
                                        className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded flex items-center gap-2 border border-slate-600 transition-colors"
                                    >
                                        <CheckCircle2 size={14} className="text-emerald-400" />
                                        <span className="font-bold">标记为已解决</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* History Section Divider */}
                {resolvedFaults.length > 0 && (
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                        <div className="relative flex justify-center"><span className="bg-slate-900 px-2 text-[10px] text-slate-500 uppercase font-bold">History</span></div>
                    </div>
                )}

                {resolvedFaults.map(fault => (
                    <div key={fault.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900/30 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                            <div>
                                <div className="text-xs text-slate-300 line-through decoration-slate-600">{fault.message}</div>
                                <div className="text-[10px] text-slate-600 font-mono">{fault.timestamp} • {fault.code}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default FaultManagement;