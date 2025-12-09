import React, { useState } from 'react';
import Starfield from './components/Starfield';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import ManualAuto from './components/ManualAuto';
import { AppScreen, DashboardView, RobotStatus } from './types';
import { Menu, Battery, Wifi, Send, Settings, Terminal } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ros2Connection } from './libs/ros2Connection';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.LOGIN);
  const [view, setView] = useState<DashboardView>(DashboardView.MANUAL_SEMI_AUTO);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [connectionUrl, setConnectionUrl] = useState<string>('');

  const [robotStatus] = useState<RobotStatus>({
    battery: 87,
    signalStrength: 92,
    temperature: 42,
    isOnline: true
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
      
      try {
        await ros2Connection.connect(wsUrl);
        // Send Establish Request (0: Off, 1: On)
        await ros2Connection.sendConnectionEstablishRequest(1);
        
        setConnectionUrl(wsUrl);
        setScreen(AppScreen.DASHBOARD);
        setView(DashboardView.MANUAL_SEMI_AUTO);
      } catch (error) {
        alert(`Connection Failed: ${error}`);
        // For development/demo purposes without a real robot, we might want to let them in anyway?
        // Uncomment below to bypass:
        // setConnectionUrl(wsUrl);
        // setScreen(AppScreen.DASHBOARD);
      }
  };

  const handleLogout = () => {
      ros2Connection.disconnect();
      setScreen(AppScreen.LOGIN);
      setConnectionUrl('');
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
                <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-neon-blue/20 border border-neon-blue/50 text-white' : 'bg-gray-800 border border-gray-700 text-gray-300'}`}>
                                    {msg.text}
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
                            className="w-full bg-gray-900 border border-gray-700 rounded-full py-3 pl-4 pr-12 focus:outline-none focus:border-neon-blue font-mono text-sm"
                        />
                        <button type="submit" disabled={isChatLoading} className="absolute right-2 top-2 p-1.5 bg-neon-blue rounded-full text-black">
                            <Send size={16} />
                        </button>
                    </form>
                </div>
              );
          default:
              return (
                  <div className="h-full flex items-center justify-center text-gray-500 font-mono flex-col">
                      <Terminal size={48} className="mb-4 text-neon-blue opacity-50" />
                      <p>MODULE: {view}</p>
                      <p className="text-xs mt-2 opacity-50">ACCESS RESTRICTED / UNDER CONSTRUCTION</p>
                  </div>
              );
      }
  };

  return (
    <div className="relative w-full h-screen text-white font-sans overflow-hidden">
      <Starfield />

      {screen === AppScreen.LOGIN ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <div className="flex flex-col h-full relative">
            {/* Header */}
            <header className="h-16 px-4 border-b border-gray-800 bg-black/40 backdrop-blur-md flex items-center justify-between z-30">
                <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Menu className="text-neon-blue" />
                </button>
                
                <div className="flex items-center space-x-4">
                     <span className="font-mono text-xs text-neon-blue tracking-widest animate-pulse">
                        {robotStatus.isOnline ? `LINK ESTABLISHED` : 'OFFLINE'}
                    </span>
                    <div className="flex items-center space-x-1 text-gray-300">
                        <Battery size={16} className={robotStatus.battery < 20 ? 'text-red-500' : 'text-green-400'} />
                        <span className="font-mono text-xs">{robotStatus.battery}%</span>
                    </div>
                     <div className="flex items-center space-x-1 text-gray-300">
                        <Wifi size={16} className="text-neon-blue" />
                        <span className="font-mono text-xs">{robotStatus.signalStrength}%</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative overflow-hidden p-4">
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