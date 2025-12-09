export enum AppScreen {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
}

export enum DashboardView {
  ADMIN = 'ADMIN',
  FAULT_MANAGEMENT = 'FAULT_MANAGEMENT',
  PATH_PLANNING = 'PATH_PLANNING',
  FULL_AUTO = 'FULL_AUTO',
  MANUAL_SEMI_AUTO = 'MANUAL_SEMI_AUTO', // The main control page
  REMOTE_INTERFACE = 'REMOTE_INTERFACE',
  SETTINGS = 'SETTINGS', // Keep for general config
  AI_CHAT = 'AI_CHAT',
}

export interface RobotStatus {
  battery: number;
  signalStrength: number;
  temperature: number;
  isOnline: boolean;
}

export interface CarouselItem {
  id: number;
  title: string;
  description: string;
  image: string;
}
