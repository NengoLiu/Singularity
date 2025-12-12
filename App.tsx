import React, { useState } from 'react';
import Starfield from './components/Starfield';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import ManualAuto from './components/ManualAuto';
import AdminPanel from './components/AdminPanel';
import PathPlanning from './components/PathPlanning';
import FaultManagement from './components/FaultManagement';
import { AppScreen, DashboardView, RobotStatus } from './types';
import { Menu, Battery, Wifi, Send, Settings, Terminal, ZapOff, Activity, Bot } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ros2Connection } from './libs/ros2Connection';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.LOGIN);
  const [view, setView] = useState<DashboardView>(DashboardView.MANUAL_SEMI_AUTO);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [connectionUrl, setConnectionUrl] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const [robotStatus, setRobotStatus] = useState<RobotStatus>({
    battery: 87,
    signalStrength: 92,
    temperature: 42,
    isOnline: false
  });
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([
      { role: 'model', text: '奇点核心已上线。有什么可以帮您的？' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleLogin = async (ip: string) => {
      // FIX: Automatically select Secure WebSocket (wss) if the page is loaded via HTTPS
      // This prevents the "Mixed Content" security error in browsers.
      const isSecure = window.location.protocol === 'https:';
      const protocol = isSecure ? 'wss' : 'ws';
      
      // Default ROS Bridge port is 9090 if not specified
      const cleanIp = ip.trim();
      const host = cleanIp.includes(':') ? cleanIp : `${cleanIp}:9090`;
      
      const wsUrl = `${protocol}://${host}`;
      
      console.log(`Initializing Neural Link Protocol to: ${wsUrl} (Secure Mode: ${isSecure})`);
      
      setIsLoginLoading(true);

      // Simulate network handshake delay for effect
      setTimeout(async () => {
          try {
            await ros2Connection.connect(wsUrl);
            await ros2Connection.sendConnectionEstablishRequest(1);
            
            setConnectionUrl(wsUrl);
            setRobotStatus(prev => ({ ...prev, isOnline: true }));
            setIsDemoMode(false);
          } catch (error) {
            console.warn("Connection failed or blocked, switching to VIRTUAL LINK (Mock Mode)", error);
            // If connection fails (e.g. wss not supported by robot), fall back to Mock Mode
            // This ensures the app is usable even if the real connection is blocked by browser policies
            ros2Connection.setMockMode(true);
            setConnectionUrl(wsUrl); 
            setRobotStatus(prev => ({ ...prev, isOnline: true, signalStrength: 100 })); 
            setIsDemoMode(true);
          } finally {
            setIsLoginLoading(false);
            setScreen(AppScreen.DASHBOARD);
            setView(DashboardView.MANUAL_SEMI_AUTO);
          }
      }, 1500); 
  };

  const handleLogout = () => {
      ros2Connection.disconnect();
      ros2Connection.setMockMode(false);
      setScreen(AppScreen.LOGIN);
      setConnectionUrl('');
      setIsDemoMode(false);
      setIsLoginLoading(false);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!chatInput.trim()) return;

      const userMsg = chatInput;
      setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
      setChatInput('');
      setIsChatLoading(true);

      try {
        if (!process.env.API_KEY) {
            setChatHistory(prev => [...prev, { role: 'model', text: 'Error: API_KEY not found.' }]);
            return;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash";
        
        const response = await ai.models.generateContent({
            model: model,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `You are the AI onboard a futuristic robot. Respond in Chinese. Keep responses brief and robotic. User says: ${userMsg}` }]
                }
            ]
        });

        const text = response.text || "No data.";
        setChatHistory(prev => [...prev, { role: 'model', text: text }]);
      } catch (error) {
          console.error(error);
          setChatHistory(prev => [...prev, { role: 'model', text: "Signal lost." }]);
      } finally {
          setIsChatLoading(false);
      }
  };

  const renderDashboardContent = () => {
      switch(view) {
          case DashboardView.MANUAL_SEMI_AUTO:
              return <ManualAuto />;
          case DashboardView.ADMIN:
              return <AdminPanel />;
          case DashboardView.PATH_PLANNING:
              return <PathPlanning />;
          case DashboardView.FAULT_MANAGEMENT:
              return <FaultManagement />;
          case DashboardView.AI_CHAT:
              return (
                <div className="h-full flex flex-col max-w-4xl mx-auto w-full pb-4">
                     <div className="glass-panel rounded-3xl p-6 flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2 custom-scrollbar">
                            {chatHistory.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex items-start max-w-[80%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${msg.role === 'user' ? 'bg-slate-700 text-slate-300' : 'bg-gradient-to-br from-sci-blue to-sci-purple text-white'}`}>
                                            {msg.role === 'user' ? 'U' : <Bot size={16} />}
                                         </div>
                                         <div className={`p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tr-none' : 'bg-slate-900/80 text-sci-cyan border border-sci-cyan/20 rounded-tl-none'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleChatSubmit} className="relative">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="向奇点发送指令..."
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-sci-blue focus:ring-1 focus:ring-sci-blue/50 text-slate-200 shadow-inner placeholder-slate-600"
                            />
                            <button type="submit" disabled={isChatLoading} className="absolute right-2 top-2 p-2 bg-gradient-to-r from-sci-blue to-sci-purple rounded-full text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all">
                                <Send size={18} />
                            </button>
                        </form>
                     </div>
                </div>
              );
          default:
              return (
                  <div className="h-full flex items-center justify-center text-slate-500 font-mono flex-col">
                      <div className="w-32 h-32 rounded-full bg-slate-900/50 border border-slate-800 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-6">
                        <Terminal size={48} className="text-slate-700" />
                      </div>
                      <p className="text-lg font-bold text-slate-400">模块: {view}</p>
                      <p className="text-xs mt-2 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-red-400">ACCESS_DENIED</p>
                  </div>
              );
      }
  };

  return (
    <div className="relative w-full h-screen font-sans overflow-hidden text-slate-200">
      <Starfield />

      {screen === AppScreen.LOGIN ? (
        <LoginScreen onLogin={handleLogin} isLoading={isLoginLoading} />
      ) : (
        <div className="flex flex-col h-full relative">
            {/* Header - Glass Dark */}
            <header className="h-16 px-6 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl flex items-center justify-between z-30 shadow-lg">
                <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                    <Menu className="text-sci-cyan" />
                </button>
                
                <div className="flex items-center space-x-6">
                     <span className={`font-mono text-xs font-bold tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-full border ${isDemoMode ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-sci-blue/10 border-sci-blue/30 text-sci-blue'}`}>
                        {isDemoMode ? <ZapOff size={14} /> : <Wifi size={14} />}
                        {isDemoMode ? 'OFFLINE_SIM' : `LINK: ${connectionUrl.split('://')[1]}`}
                    </span>
                    <div className="flex items-center space-x-2 text-slate-400">
                        <Battery size={18} className={robotStatus.battery < 20 ? 'text-red-500' : 'text-emerald-400'} />
                        <span className="font-mono text-sm font-bold">{robotStatus.battery}%</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative overflow-hidden p-4 md:p-6">
                {renderDashboardContent()}
            </main>

            <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
                currentView={view}
                onChangeView={setView}
                onLogout={handleLogout}
            />
        </div>
      )}
    </div>
  );
};

export default App;