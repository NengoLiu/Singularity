import React, { useState, useEffect } from 'react';
import { CAROUSEL_ITEMS } from '../constants';
import { ShieldCheck, UserPlus, Lock, Network, ArrowRight, Loader2 } from 'lucide-react';

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
    <div className="w-full h-full flex flex-col relative overflow-hidden text-slate-800">
      {/* Carousel Section */}
      <div className="h-2/5 md:h-1/2 w-full relative overflow-hidden">
        {CAROUSEL_ITEMS.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === activeSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Gradient Overlay instead of black */}
            <div className="absolute inset-0 bg-gradient-to-t from-sci-base via-transparent to-transparent z-10" />
            
            {/* Image container */}
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
            
            <div className="absolute bottom-12 left-0 right-0 z-20 px-8 text-center">
                <div className="inline-block px-4 py-1 mb-4 rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-xs font-bold text-white tracking-widest uppercase">
                    Singularity OS v2.0
                </div>
              <h2 className="text-4xl font-black italic tracking-tighter text-white drop-shadow-md mb-2">
                {item.title}
              </h2>
              <p className="text-white/90 font-medium text-sm max-w-md mx-auto drop-shadow-sm">{item.description}</p>
            </div>
          </div>
        ))}
        
        {/* Indicators */}
        <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center space-x-2">
            {CAROUSEL_ITEMS.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === activeSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                />
            ))}
        </div>
      </div>

      {/* Login Form Section - Glassmorphism Light */}
      <div className="flex-1 relative z-20 -mt-8 bg-white/80 backdrop-blur-xl border-t border-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[2.5rem] px-8 py-8 flex flex-col">
        <div className="flex justify-center mb-8">
            <div className="w-16 h-1.5 bg-slate-200 rounded-full" />
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
            <h3 className="text-2xl font-bold mb-1 text-slate-800 text-center">
                {isRegistering ? '初始化连接' : '欢迎回来'}
            </h3>
            <p className="text-center text-slate-500 mb-8 text-sm">请输入凭证以访问奇点核心</p>

            <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
                <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-sci-blue transition-colors">
                    <Network size={20} />
                </div>
                <input
                type="text"
                placeholder="机器人 IP"
                value={robotIp}
                onChange={(e) => setRobotIp(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sci-blue focus:ring-4 focus:ring-blue-500/10 transition-all font-mono shadow-sm"
                />
            </div>

            <div className="relative group">
                <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-sci-purple transition-colors">
                    <Lock size={20} />
                </div>
                <input
                type="password"
                placeholder="访问密钥"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sci-purple focus:ring-4 focus:ring-purple-500/10 transition-all font-mono shadow-sm"
                />
            </div>

            {!isRegistering && (
                <div className="flex justify-end">
                <button type="button" className="text-xs font-semibold text-sci-blue hover:text-sci-purple transition-colors">
                    忘记密钥？
                </button>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-sci-blue to-sci-purple hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
            >
                {isLoading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>连接中...</span>
                    </>
                ) : (
                    <>
                        <span>{isRegistering ? '建立连接' : '连接'}</span>
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
                className="ml-2 text-slate-800 font-bold hover:text-sci-blue transition-colors"
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