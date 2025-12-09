import React, { useState } from 'react';
import Starfield from './components/Starfield';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Joystick from './components/Joystick';
import { AppScreen, DashboardView, RobotStatus } from './types';
import { Menu, Battery, Wifi, Thermometer, Mic, Send, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MOCK_TELEMETRY_DATA } from './constants';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.LOGIN);
  const [view, setView] = useState<DashboardView>(DashboardView.CONTROL);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Connection State
  const [connectionUrl, setConnectionUrl] = useState<string>('');

  const [robotStatus] = useState<RobotStatus>({
    battery: 87,
    signalStrength: 92,
    temperature: 42,
    isOnline: true
  });
  
  // Joystick State
  const [joystickData, setJoystickData] = useState({ x: 0, y: 0 });

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([
      { role: 'model', text: 'Singularity Core Online. How can I assist with the mission?' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleLogin = (ip: string) => {
      // Construct WebSocket URL from the IP address
      const wsUrl = `ws://${ip}`;
      console.log(`Initializing Neural Link Protocol to: ${wsUrl}`);
      setConnectionUrl(wsUrl);
      setScreen(AppScreen.DASHBOARD);
  };

  const handleLogout = () => {
      setScreen(AppScreen.LOGIN);
      setView(DashboardView.CONTROL);
      setConnectionUrl('');
  };

  const handleJoystickMove = (x: number, y: number) => {
    setJoystickData({ x, y });
    // In a real app, send WebSocket message here using connectionUrl
    // if (websocket.current && websocket.current.readyState === WebSocket.OPEN) { ... }
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
            setChatHistory(prev => [...prev, { role: 'model', text: 'Error: API_KEY not found in environment.' }]);
            return;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash";
        
        // Use direct generateContent for simplicity in this context
        const response = await ai.models.generateContent({
            model: model,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `You are the AI onboard a futuristic robot named Singularity. Keep responses brief, tech-focused, and robotic but helpful. User says: ${userMsg}` }]
                }
            ]
        });

        const text = response.text || "System Error: No response data.";
        setChatHistory(prev => [...prev, { role: 'model', text: text }]);
      } catch (error) {
          console.error(error);
          setChatHistory(prev => [...prev, { role: 'model', text: "Connection interruption. Signal lost." }]);
      } finally {
          setIsChatLoading(false);
      }
  };

  return (
    <div className="relative w-full h-screen text-white font-sans overflow-hidden">
      <Starfield />

      {screen === AppScreen.LOGIN ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <div className="flex flex-col h-full relative">
            {/* Header / StatusBar */}
            <header className="h-16 px-4 border-b border-gray-800 bg-black/40 backdrop-blur-md flex items-center justify-between z-30">
                <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Menu className="text-neon-blue" />
                </button>
                
                <div className="flex items-center space-x-4">
                     <span className="font-mono text-xs text-neon-blue tracking-widest animate-pulse">
                        {robotStatus.isOnline ? `SYSTEM ONLINE: ${connectionUrl.split('://')[1]}` : 'OFFLINE'}
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

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden p-4">
                
                {/* View: Manual Control */}
                {view === DashboardView.CONTROL && (
                    <div className="h-full flex flex-col items-center justify-center space-y-12">
                         <div className="text-center space-y-2">
                             <h2 className="text-2xl font-bold tracking-widest text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">MANUAL OVERRIDE</h2>
                             <div className="flex justify-center space-x-4 font-mono text-xs text-neon-blue">
                                 <span>X: {joystickData.x.toFixed(2)}</span>
                                 <span>Y: {joystickData.y.toFixed(2)}</span>
                             </div>
                         </div>

                         <div className="relative">
                            <Joystick onMove={handleJoystickMove} onStop={() => handleJoystickMove(0, 0)} />
                             {/* Decorative ring */}
                             <div className="absolute inset-0 -m-8 border border-dashed border-gray-600 rounded-full animate-spin-slow opacity-30 pointer-events-none"></div>
                         </div>

                         <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                             <button className="bg-gray-800/50 border border-neon-blue/30 text-neon-blue py-3 rounded-lg font-mono text-sm active:bg-neon-blue active:text-black transition-colors">
                                 LIGHTS
                             </button>
                             <button className="bg-gray-800/50 border border-neon-purple/30 text-neon-purple py-3 rounded-lg font-mono text-sm active:bg-neon-purple active:text-black transition-colors">
                                 SCAN
                             </button>
                             <button className="bg-gray-800/50 border border-red-500/30 text-red-500 py-3 rounded-lg font-mono text-sm active:bg-red-500 active:text-black transition-colors col-span-2">
                                 EMERGENCY STOP
                             </button>
                         </div>
                    </div>
                )}

                {/* View: Telemetry */}
                {view === DashboardView.TELEMETRY && (
                    <div className="h-full flex flex-col space-y-6">
                        <h2 className="text-xl font-bold font-mono text-neon-purple mb-4 border-l-4 border-neon-purple pl-4">LIVE METRICS</h2>
                        
                        <div className="bg-black/40 border border-gray-800 p-4 rounded-xl backdrop-blur-sm">
                            <h3 className="text-gray-400 text-xs font-mono mb-2">VELOCITY (m/s)</h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={MOCK_TELEMETRY_DATA}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="time" hide />
                                        <YAxis stroke="#666" fontSize={10} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                                            itemStyle={{ color: '#00f3ff' }}
                                        />
                                        <Line type="monotone" dataKey="speed" stroke="#00f3ff" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 border border-gray-800 p-4 rounded-xl backdrop-blur-sm flex flex-col items-center justify-center space-y-2">
                                <Thermometer className="text-orange-500" size={24} />
                                <span className="text-2xl font-bold">{robotStatus.temperature}°C</span>
                                <span className="text-xs text-gray-500 font-mono">CORE TEMP</span>
                            </div>
                            <div className="bg-black/40 border border-gray-800 p-4 rounded-xl backdrop-blur-sm flex flex-col items-center justify-center space-y-2">
                                <Battery className="text-green-500" size={24} />
                                <span className="text-2xl font-bold">{robotStatus.battery}V</span>
                                <span className="text-xs text-gray-500 font-mono">VOLTAGE</span>
                            </div>
                         </div>
                    </div>
                )}

                {/* View: AI Chat */}
                {view === DashboardView.AI_CHAT && (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                            {chatHistory.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-neon-blue/20 border border-neon-blue/50 text-white' : 'bg-gray-800 border border-gray-700 text-gray-300'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg flex space-x-1">
                                        <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '0s'}}></div>
                                        <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '0.1s'}}></div>
                                        <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '0.2s'}}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleChatSubmit} className="relative">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Command Singularity..."
                                className="w-full bg-gray-900 border border-gray-700 rounded-full py-3 pl-4 pr-12 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue font-mono text-sm"
                            />
                            <button 
                                type="submit"
                                disabled={isChatLoading}
                                className="absolute right-2 top-2 p-1.5 bg-neon-blue rounded-full text-black hover:bg-white transition-colors disabled:opacity-50"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                )}

                {/* View: Settings */}
                {view === DashboardView.SETTINGS && (
                    <div className="h-full flex items-center justify-center text-gray-500 font-mono">
                        <div className="text-center">
                            <Settings size={48} className="mx-auto mb-4 animate-spin-slow" />
                            <p>CONFIGURATION LOCKED</p>
                            <p className="text-xs mt-2">ADMIN ACCESS REQUIRED</p>
                        </div>
                    </div>
                )}

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