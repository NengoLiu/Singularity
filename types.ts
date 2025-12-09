export enum AppScreen {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
}

export enum DashboardView {
  CONTROL = 'CONTROL',
  TELEMETRY = 'TELEMETRY',
  AI_CHAT = 'AI_CHAT',
  SETTINGS = 'SETTINGS',
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
