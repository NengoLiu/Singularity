import React, { useState, useEffect } from 'react';
import { CAROUSEL_ITEMS } from '../constants';
import { ShieldCheck, UserPlus, Lock, Network, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (ip: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const [robotIp, setRobotIp] = useState('');
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
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      {/* Carousel Section */}
      <div className="h-1/3 md:h-1/2 w-full relative">
        {CAROUSEL_ITEMS.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === activeSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyber-black z-10" />
            {/* Placeholder for dynamic tech image */}
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
            
            <div className="absolute bottom-8 left-0 right-0 z-20 px-8 text-center">
              <h2 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-white drop-shadow-[0_0_10px_rgba(0,243,255,0.5)] mb-2">
                {item.title}
              </h2>
              <p className="text-gray-300 font-mono text-sm">{item.description}</p>
            </div>
          </div>
        ))}
        
        {/* Indicators */}
        <div className="absolute bottom-2 left-0 right-0 z-30 flex justify-center space-x-2">
            {CAROUSEL_ITEMS.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-1 rounded-full transition-all duration-300 ${idx === activeSlide ? 'w-8 bg-neon-blue' : 'w-2 bg-gray-600'}`}
                />
            ))}
        </div>
      </div>

      {/* Login Form Section */}
      <div className="flex-1 relative z-20 px-8 py-6 flex flex-col justify-center bg-black/20 backdrop-blur-sm border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <div className="flex justify-center mb-6">
            <div className="w-16 h-1 bg-gray-800 rounded-full" />
        </div>

        <h3 className="text-2xl font-bold mb-6 text-white text-center">
            {isRegistering ? 'INITIALIZE LINK' : 'AUTHENTICATE'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <Network className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-neon-blue transition-colors" size={20} />
            <input
              type="text"
              placeholder="ROBOT IP (e.g. 192.168.1.100)"
              value={robotIp}
              onChange={(e) => setRobotIp(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all font-mono"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-neon-purple transition-colors" size={20} />
            <input
              type="password"
              placeholder="ACCESS KEY"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all font-mono"
            />
          </div>

          {!isRegistering && (
            <div className="flex justify-end">
              <button type="button" className="text-xs text-neon-blue hover:text-white transition-colors">
                FORGOT ACCESS KEY?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-neon-blue to-blue-600 hover:from-blue-400 hover:to-blue-500 text-black font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(0,243,255,0.5)] transition-all flex items-center justify-center space-x-2"
          >
            <span>{isRegistering ? 'ESTABLISH LINK' : 'CONNECT'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            {isRegistering ? 'Already have clearance?' : 'New operator?'}
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="ml-2 text-neon-purple font-bold hover:text-white transition-colors"
            >
              {isRegistering ? 'LOGIN' : 'REGISTER'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;