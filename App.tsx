import React, { useState, useEffect } from 'react';
import Starfield from './components/Starfield';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import ManualAuto from './components/ManualAuto';
import AdminPanel from './components/AdminPanel';
import PathPlanning from './components/PathPlanning';
import FaultManagement from './components/FaultManagement';
import { AppScreen, DashboardView, RobotStatus } from './types';
import { Menu, Battery, Wifi, Send, Terminal, ZapOff, Bot, X, Cpu } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useROS2 } from './libs/useROS2';
import { useToast } from './hooks/use-toast';
import { safeLocalStorage } from './libs/rosStore';

const NAV_STORAGE_KEY = 'singularity_nav_state_v4';

const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`glass-panel p-4 rounded-2xl flex items-start gap-3 shadow-2xl border-l-4 transition-all duration-500 pointer-events-auto ${
            t.open !== false ? 'animate-in slide-in-from-top-4 opacity-100' : 'opacity-0 translate-y-[-10px]'
          } ${
            t.variant === 'destructive' ? 'border-l-red-500 bg-red-950/40' :
            t.variant === 'success' ? 'border-l-emerald-500 bg-emerald-950/40' :
            'border-l-sci-blue'
          }`}
        >
          <div className="flex-1">
            {t.title && <div className="font-bold text-sm text-white">{t.title}</div>}
            {t.description && <div className="text-xs text-slate-300 mt-0.5">{t.description}</div>}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
};

// 辅助延时函数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(() => {
      try {
          const saved = safeLocalStorage.getItem(NAV_STORAGE_KEY);
          if (saved) return JSON.parse(saved).screen || AppScreen.LOGIN;
      } catch(e) {}
      return AppScreen.LOGIN;
  });

  const [view, setView] = useState<DashboardView>(() => {
      try {
          const saved = safeLocalStorage.getItem(NAV_STORAGE_KEY);
          if (saved) return JSON.parse(saved).view || DashboardView.MANUAL_SEMI_AUTO;
      } catch(e) {}
      return DashboardView.MANUAL_SEMI_AUTO;
  });

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { isConnected, isConnecting, connect, disconnect, sendConnectionEstablish } = useROS2();
  const { toast } = useToast();

  useEffect(() => {
    safeLocalStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ screen, view }));
  }, [screen, view]);

  const [robotStatus] = useState<RobotStatus>({
    battery: 87,
    signalStrength: 92,
    temperature: 42,
    isOnline: false
  });

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([
      { role: 'model', text: '奇点核心已上线。有什么可以帮您的？' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  /**
   * 登录逻辑增强
   */
  const handleLogin = async (ipInput: string) => {
      let rawIp = ipInput.trim();
      if (!rawIp) return;

      let wsUrl = rawIp;

      // 1. 补全协议
      if (!wsUrl.includes('://')) {
          wsUrl = 'ws://' + wsUrl;
      }

      try {
        // 使用 URL 对象解析，增加容错性
        const urlObj = new URL(wsUrl);
        if (!urlObj.port) {
            wsUrl = `${urlObj.protocol}//${urlObj.hostname}:9090`;
        }
      } catch (e) {
        // 如果 URL 解析失败，尝试手动拼接端口
        if (!wsUrl.includes(':', wsUrl.indexOf('//') + 2)) {
          wsUrl = wsUrl + ':9090';
        }
      }

      try {
        // 第一步：物理连接 (WebSocket)
        await connect(wsUrl);
        
        // 关键：给 ROSbridge 充足时间同步服务列表，避免 "Service not found" 导致的握手失败
        await sleep(3000);
        
        // 第二步：业务握手 (ROS2 Service call)
        const ack = await sendConnectionEstablish(1);
        
        if (ack === 1) {
            toast({ title: "核心链路已锁定", description: "身份验证通过，欢迎操作员。", variant: "success" });
            setScreen(AppScreen.DASHBOARD);
            setView(DashboardView.MANUAL_SEMI_AUTO);
        } else {
            toast({ 
                title: "业务握手失败", 
                description: "网络已连接，但机器人拒绝了您的访问密钥或服务未准备就绪 (ACK=0)。", 
                variant: "destructive" 
            });
            disconnect(); // 握手失败必须断开物理连接
        }
      } catch (e: any) { 
        const isHttps = window.location.protocol === 'https:';
        toast({ 
            title: "通信建立失败", 
            description: isHttps && wsUrl.startsWith('ws://') 
                ? "混合内容阻断：请在本地环境运行或使用 wss:// 安全连接。" 
                : e.message || "目标主机不可达，请检查 IP 状态。", 
            variant: "destructive" 
        });
        disconnect();
      }
  };

  const handleLogout = () => {
      disconnect();
      setScreen(AppScreen.LOGIN);
      setView(DashboardView.MANUAL_SEMI_AUTO);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!chatInput.trim()) return;
      const userMsg = chatInput;
      setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
      setChatInput('');
      setIsChatLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ role: 'user', parts: [{ text: `你是一个高端工业机器人车载 AI“奇点”。简短回复：${userMsg}` }] }]
        });
        setChatHistory(prev => [...prev, { role: 'model', text: response.text || "通信中断。" }]);
      } catch (error) {
          setChatHistory(prev => [...prev, { role: 'model', text: "核心系统脱机。" }]);
      } finally { setIsChatLoading(false); }
  };

  const renderDashboardContent = () => {
      switch(view) {
          case DashboardView.MANUAL_SEMI_AUTO: return <ManualAuto />;
          case DashboardView.ADMIN: return <AdminPanel />;
          case DashboardView.PATH_PLANNING: return <PathPlanning />;
          case DashboardView.FAULT_MANAGEMENT: return <FaultManagement />;
          case DashboardView.AI_CHAT: return (
                <div className="h-full flex flex-col max-w-4xl mx-auto w-full pb-4 animate-in fade-in zoom-in-95 duration-500">
                     <div className="glass-panel rounded-3xl p-6 flex-1 flex flex-col overflow-hidden shadow-2xl">
                        <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2 custom-scrollbar">
                            {chatHistory.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex items-start max-w-[85%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-gradient-to-br from-sci-blue to-sci-purple text-white'}`}>
                                            {msg.role === 'user' ? 'U' : <Bot size={20} />}
                                         </div>
                                         <div className={`p-4 rounded-2xl text-sm shadow-md ${msg.role === 'user' ? 'bg-slate-800 text-slate-200' : 'bg-slate-900/90 text-sci-cyan border border-sci-cyan/20'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleChatSubmit} className="relative mt-2">
                            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="下达指令..." className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl py-5 pl-6 pr-16 focus:outline-none text-slate-200" />
                            <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="absolute right-3 top-3 p-3 bg-gradient-to-r from-sci-blue to-sci-purple rounded-xl text-white"><Send size={20} /></button>
                        </form>
                     </div>
                </div>
              );
          default: return <ManualAuto />;
      }
  };

  return (
    <div className="relative w-full h-screen font-sans overflow-hidden text-slate-200 bg-sci-base">
      <Starfield />
      <Toaster />

      {screen === AppScreen.LOGIN ? (
        <LoginScreen onLogin={handleLogin} isLoading={isConnecting} />
      ) : (
        <div className="flex flex-col h-full relative">
            <header className="h-20 px-6 border-b border-white/5 bg-slate-900/60 backdrop-blur-2xl flex items-center justify-between z-30 shadow-2xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-sci-cyan rounded-2xl transition-all active:scale-90">
                        <Menu size={24} />
                    </button>
                    <div>
                        <h2 className="text-sm font-black italic tracking-widest text-white leading-tight">SINGULARITY_HUB</h2>
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse'}`}></div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{isConnected ? 'Link Secure' : 'Disconnected'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 px-4 py-2 bg-slate-950/40 rounded-2xl border border-white/5">
                    <div className="flex items-center space-x-2">
                        <Battery size={18} className={robotStatus.battery < 20 ? 'text-red-500 animate-bounce' : 'text-emerald-400'} />
                        <span className="font-mono text-sm font-black">{robotStatus.battery}%</span>
                    </div>
                    <div className="w-px h-4 bg-slate-800"></div>
                    <div className="flex items-center space-x-2">
                        <Cpu size={18} className="text-sci-purple" />
                        <span className="font-mono text-sm font-black">{robotStatus.temperature}°C</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 relative overflow-hidden p-4 md:p-6 bg-gradient-to-b from-transparent to-slate-950/20">
                {renderDashboardContent()}
            </main>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} currentView={view} onChangeView={setView} onLogout={handleLogout} />
        </div>
      )}
    </div>
  );
};

export default App;