import React, { useState, useEffect } from 'react';
import { CAROUSEL_ITEMS } from '../constants';
import { ShieldCheck, UserPlus, Lock, Network, ArrowRight, Loader2, Cpu } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (ip: string) => void;
  isLoading?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading = false }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const [robotIp, setRobotIp] = useState('192.168.1.100'); // Default placeholder
  const [password, setPassword] = useState('');

  // Auto-rotate carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (robotIp) {
      onLogin(robotIp);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden text-slate-200">
      {/* Carousel Section */}
      <div className="h-2/5 md:h-1/2 w-full relative overflow-hidden">
        {CAROUSEL_ITEMS.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === activeSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Gradient Overlay - Darker at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-sci-base via-sci-base/50 to-transparent z-10" />
            
            {/* Image container */}
            <div className="w-full h-full bg-cover bg-center opacity-70" style={{ backgroundImage: `url(${item.image})` }} />
            
            <div className="absolute bottom-12 left-0 right-0 z-20 px-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1 mb-4 rounded-full bg-slate-900/50 backdrop-blur-md border border-sci-cyan/30 text-xs font-bold text-sci-cyan tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <Cpu size={12} />
                    <span>Singularity OS v2.0</span>
                </div>
              <h2 className="text-4xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] mb-2 neon-text">
                {item.title}
              </h2>
              <p className="text-slate-300 font-medium text-sm max-w-md mx-auto drop-shadow-md">{item.description}</p>
            </div>
          </div>
        ))}
        
        {/* Indicators */}
        <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center space-x-2">
            {CAROUSEL_ITEMS.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === activeSlide ? 'w-8 bg-sci-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'w-2 bg-slate-600'}`}
                />
            ))}
        </div>
      </div>

      {/* Login Form Section - Glassmorphism Dark */}
      <div className="flex-1 relative z-20 -mt-8 bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/50 shadow-[0_-10px_50px_rgba(0,0,0,0.5)] rounded-t-[2.5rem] px-8 py-8 flex flex-col">
        <div className="flex justify-center mb-8">
            <div className="w-16 h-1.5 bg-slate-700 rounded-full" />
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
            <h3 className="text-2xl font-bold mb-1 text-white text-center font-mono tracking-wide">
                {isRegistering ? 'INIT_SEQUENCE' : 'WELCOME_BACK'}
            </h3>
            <p className="text-center text-slate-400 mb-8 text-sm">请输入凭证以访问奇点核心</p>

            <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
                <div className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-sci-cyan transition-colors">
                    <Network size={20} />
                </div>
                <input
                type="text"
                placeholder="机器人 IP"
                value={robotIp}
                onChange={(e) => setRobotIp(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-sci-cyan focus:ring-1 focus:ring-sci-cyan/50 transition-all font-mono shadow-inner"
                />
            </div>

            <div className="relative group">
                <div className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-sci-purple transition-colors">
                    <Lock size={20} />
                </div>
                <input
                type="password"
                placeholder="访问密钥"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-sci-purple focus:ring-1 focus:ring-sci-purple/50 transition-all font-mono shadow-inner"
                />
            </div>

            {!isRegistering && (
                <div className="flex justify-end">
                <button type="button" className="text-xs font-semibold text-sci-cyan hover:text-white transition-colors">
                    忘记密钥？
                </button>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-sci-blue to-sci-purple hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 rounded-2xl shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_25px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center space-x-2 ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
            >
                {isLoading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>建立链路中...</span>
                    </>
                ) : (
                    <>
                        <span>{isRegistering ? 'EXECUTE' : 'CONNECT'}</span>
                        <ArrowRight size={20} />
                    </>
                )}
            </button>
            </form>

            <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
                {isRegistering ? '已有权限？' : '新操作员？'}
                <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="ml-2 text-slate-300 font-bold hover:text-sci-cyan transition-colors"
                >
                {isRegistering ? '登录' : '注册'}
                </button>
            </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;