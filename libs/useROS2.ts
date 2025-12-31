// 作为 ROS2 服务器交互的核心钩子，封装了连接管理和指令发送逻辑
import { useCallback, useEffect } from 'react';
import { ros2Connection } from './ros2Connection';
import { useToast } from '../hooks/use-toast';
import { useRosStore } from './rosStore';
import {
  PumpMessage,
  ChassisControlMessage,
  ArmControlMessage,
  SemiModeRequest,
} from './ros2Connection';

export const useROS2 = () => {
  const {
    isConnected,
    isConnecting,
    rosUrl,
    setIsConnected,
    setIsConnecting,
    setRosUrl,
  } = useRosStore();
  
  const { toast } = useToast();

  // 监听物理链路状态
  useEffect(() => {
    const handleClose = () => setIsConnected(false);
    const handleConnection = () => setIsConnected(true);

    ros2Connection.on('connection', handleConnection);
    ros2Connection.on('close', handleClose);
    
    return () => {
      ros2Connection.off('connection', handleConnection);
      ros2Connection.off('close', handleClose);
    };
  }, [setIsConnected]);

  // 公共校验：直接通过 class 实例检查，不受 React 异步渲染限制
  const checkConnection = useCallback(() => {
    if (!ros2Connection.isConnected()) {
      toast({
        title: "指令拦截",
        description: "当前未连接机器人或连接已中断。",
        variant: "destructive",
      });
      return false;
    }
    return true;
  }, [toast]);

  // 连接逻辑
  const connect = useCallback(async (targetUrl?: string) => {
    const urlToConnect = targetUrl || rosUrl;
    if (isConnecting) return;

    setIsConnecting(true);
    try {
      await ros2Connection.connect(urlToConnect);
      setIsConnected(true);
      setRosUrl(urlToConnect);
    } catch (err) {
      setIsConnected(false);
      setIsConnecting(false);
      throw err; 
    } finally {
      setIsConnecting(false);
    }
  }, [rosUrl, isConnecting, setIsConnected, setIsConnecting, setRosUrl]);

  // 断开逻辑
  const disconnect = useCallback(() => {
    ros2Connection.disconnect();
    setIsConnected(false);
  }, [setIsConnected]);

  // 1. 业务握手
  const sendConnectionEstablish = useCallback(async (establish: number) => {
    return await ros2Connection.sendConnectionEstablishRequest(establish);
  }, []);

  // 2. 底盘使能
  const sendChassisEnable = useCallback(async (motorCmd: number) => {
    if (!checkConnection()) return 0;
    return await ros2Connection.sendChassisEnableRequest(motorCmd);
  }, [checkConnection]);

  // 3. 机械臂使能
  const sendArmEnable = useCallback(async (motorCmd: number) => {
    if (!checkConnection()) return 0;
    return await ros2Connection.sendArmEnableRequest(motorCmd);
  }, [checkConnection]);

  // 4. 话题发布系列
  const publishPumpControl = useCallback((message: PumpMessage) => {
    if (!checkConnection()) return;
    ros2Connection.publishPumpControl(message);
  }, [checkConnection]);

  const publishChassisControl = useCallback((message: ChassisControlMessage) => {
    if (!checkConnection()) return;
    ros2Connection.publishChassisControl(message);
  }, [checkConnection]);

  const publishArmControl = useCallback((message: ArmControlMessage) => {
    if (!checkConnection()) return;
    ros2Connection.publishArmControl(message);
  }, [checkConnection]);

  // 5. 模式控制
  const sendSemiMode = useCallback(async (request: SemiModeRequest) => {
    if (!checkConnection()) return 0;
    return await ros2Connection.sendSemiModeRequest(request);
  }, [checkConnection]);

  const sendStop = useCallback(async (stopCmd: number) => {
    if (!checkConnection()) return 0;
    return await ros2Connection.sendStopRequest(stopCmd);
  }, [checkConnection]);

  const sendMachineMode = useCallback(async (modeCmd: number) => {
    if (!checkConnection()) return 0;
    return await ros2Connection.sendMachineModeRequest(modeCmd);
  }, [checkConnection]);

  return {
    isConnected,
    rosUrl,
    setRosUrl,
    isConnecting,
    connect,
    disconnect,
    sendConnectionEstablish,
    sendChassisEnable,
    sendArmEnable,
    publishPumpControl,
    publishChassisControl,
    publishArmControl,
    sendSemiMode,
    sendStop,
    sendMachineMode,
  };
};