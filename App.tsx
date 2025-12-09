import React, { useState } from 'react';
import Starfield from './components/Starfield';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import ManualAuto from './components/ManualAuto';
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
      { role: 'model', text: 'Singularity Core Online. How can I assist with the mission?' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleLogin = async (ip: string) => {
      const wsUrl = `ws://${ip}`;
      console.log(`Initializing Neural Link Protocol to: ${wsUrl}`);
      
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
            console.warn("Connection failed, switching to VIRTUAL LINK (Mock Mode)", error);
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
                    parts: [{ text: `You are the AI onboard a futuristic robot. Keep responses brief and robotic. User says: ${userMsg}` }]
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
          case DashboardView.AI_CHAT:
              return (
                <div className="h-full flex flex-col max-w-4xl mx-auto w-full pb-4">
                     <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 border border-white shadow-lg flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2">
                            {chatHistory.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex items-start max-w-[80%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-slate-200' : 'bg-gradient-to-br from-sci-blue to-sci-purple text-white'}`}>
                                            {msg.role === 'user' ? 'U' : <Bot size={16} />}
                                         </div>
                                         <div className={`p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-white text-slate-700 border border-slate-100 rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
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
                                placeholder="Command Singularity..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-sci-blue focus:ring-2 focus:ring-blue-100 text-slate-700 shadow-inner"
                            />
                            <button type="submit" disabled={isChatLoading} className="absolute right-2 top-2 p-2 bg-gradient-to-r from-sci-blue to-sci-purple rounded-full text-white shadow-md hover:shadow-lg transition-all">
                                <Send size={18} />
                            </button>
                        </form>
                     </div>
                </div>
              );
          default:
              return (
                  <div className="h-full flex items-center justify-center text-slate-400 font-mono flex-col">
                      <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-lg mb-6">
                        <Terminal size={48} className="text-sci-blue opacity-50" />
                      </div>
                      <p className="text-lg font-bold text-slate-600">MODULE: {view}</p>
                      <p className="text-xs mt-2 bg-slate-200 px-3 py-1 rounded-full text-slate-500">ACCESS RESTRICTED</p>
                  </div>
              );
      }
  };

  return (
    <div className="relative w-full h-screen font-sans overflow-hidden text-slate-800">
      <Starfield />

      {screen === AppScreen.LOGIN ? (
        <LoginScreen onLogin={handleLogin} isLoading={isLoginLoading} />
      ) : (
        <div className="flex flex-col h-full relative">
            {/* Header - Glass Light */}
            <header className="h-16 px-6 border-b border-white/40 bg-white/70 backdrop-blur-xl flex items-center justify-between z-30 shadow-sm">
                <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                    <Menu className="text-sci-blue" />
                </button>
                
                <div className="flex items-center space-x-6">
                     <span className={`font-mono text-xs font-bold tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-full ${isDemoMode ? 'bg-orange-100 text-orange-500' : 'bg-blue-50 text-sci-blue'}`}>
                        {isDemoMode ? <ZapOff size={14} /> : <Wifi size={14} />}
                        {isDemoMode ? 'OFFLINE MODE' : `ONLINE: ${connectionUrl.split('://')[1]}`}
                    </span>
                    <div className="flex items-center space-x-2 text-slate-500">
                        <Battery size={18} className={robotStatus.battery < 20 ? 'text-red-500' : 'text-emerald-500'} />
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