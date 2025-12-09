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
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 bottom-0 w-64 bg-cyber-gray border-r border-gray-800 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold font-mono tracking-widest text-neon-blue">MENU</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <ChevronLeft size={24} />
          </button>
        </div>

        <nav className="flex-1 py-6">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onChangeView(item.id);
                    onClose();
                  }}
                  className={`w-full px-6 py-4 flex items-center space-x-4 transition-colors relative ${currentView === item.id ? 'text-neon-blue bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    {currentView === item.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.5)]" />
                    )}
                  <item.icon size={20} />
                  <span className="font-mono text-sm tracking-wider">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6 border-t border-gray-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 text-red-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-mono text-sm">断开连接</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;