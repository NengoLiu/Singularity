import React from 'react';
import { DashboardView } from '../types';
import { 
  Shield, 
  AlertTriangle, 
  Map, 
  Zap, 
  HandMetal, 
  Gamepad2, 
  LogOut, 
  ChevronLeft 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: DashboardView;
  onChangeView: (view: DashboardView) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onChangeView, onLogout }) => {
  const menuItems = [
    { id: DashboardView.ADMIN, label: '管理员', icon: Shield },
    { id: DashboardView.FAULT_MANAGEMENT, label: '故障管理', icon: AlertTriangle },
    { id: DashboardView.PATH_PLANNING, label: '路径规划', icon: Map },
    { id: DashboardView.FULL_AUTO, label: '全自动施工', icon: Zap },
    { id: DashboardView.MANUAL_SEMI_AUTO, label: '手动/半自动施工', icon: HandMetal },
    { id: DashboardView.REMOTE_INTERFACE, label: '遥控界面', icon: Gamepad2 },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel - Dark Theme */}
      <div className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900/95 backdrop-blur-2xl border-r border-slate-700/50 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h2 className="text-xl font-bold font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sci-cyan to-sci-purple neon-text">
            MENU
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
        </div>

        <nav className="flex-1 py-6">
          <ul className="space-y-2 px-3">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onChangeView(item.id);
                    onClose();
                  }}
                  className={`w-full px-4 py-3 flex items-center space-x-4 rounded-xl transition-all relative group ${
                      currentView === item.id 
                      ? 'bg-sci-blue/10 text-sci-blue border border-sci-blue/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                    {currentView === item.id && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-sci-blue rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                    )}
                  <item.icon size={20} className={currentView === item.id ? 'text-sci-blue' : 'text-slate-500 group-hover:text-sci-purple transition-colors'} />
                  <span className="font-medium text-sm tracking-wide">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-950/30">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-900 border border-red-900/30 text-red-500 hover:bg-red-950/30 hover:border-red-500/50 transition-all shadow-sm"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">断开连接</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;