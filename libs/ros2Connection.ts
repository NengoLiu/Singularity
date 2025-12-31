import * as ROSLIB_NS from 'roslib';

// 核心修復：Vite/Rollup 對 roslib 的互操作性處理
const ROSLIB = (ROSLIB_NS as any).default || ROSLIB_NS;

// 使用動態屬性訪問，避免編譯時的 Named Export 靜態檢查錯誤
const Ros = ROSLIB.Ros;
const Topic = ROSLIB.Topic;
const Service = ROSLIB.Service;
const Message = ROSLIB.Message;
const ServiceRequest = ROSLIB.ServiceRequest;

// 消息和服務接口定義
export interface ConnectionEstablishRequest { establish: number; }
export interface ConnectionEstablishResponse { establish_ack: number; }
export interface EnableRequest { motor_cmd: number; }
export interface ChassisEnableResponse { motor_ack: number; }
export interface ArmEnableResponse { arm_ack: number; }
export interface PumpMessage { pump_switch: number; pump_speed: number; pump_flud: number; }
export interface ChassisControlMessage { x_speed: number; y_speed: number; z_speed: number; }
export interface ArmControlMessage { yaw_angle: number; roll_angle: number; updown_angle: number; arm_reset: number; }
export interface SemiModeRequest { blade_roller: number; direction: number; width: number; length: number; thickness: number; }
export interface SemiModeResponse { ack: number; }
export interface StopRequest { stop_cmd: number; }
export interface StopResponse { stop_ack: number; }
export interface MachineModeRequest { mode_cmd: number; }
export interface MachineModeResponse { mode_ack: number; }

export class ROS2Connection {
  private ros: any = null;
  private pumpTopic: any = null;
  private chassisTopic: any = null;
  private armTopic: any = null;
  private pumpTopicReady = false;
  private chassisTopicReady = false;
  private armTopicReady = false;
  private connectionTimeout: any = null;

  // 重置話題狀態
  private resetTopicStates(): void {
    this.pumpTopicReady = false;
    this.chassisTopicReady = false;
    this.armTopicReady = false;
    this.pumpTopic = null;
    this.chassisTopic = null;
    this.armTopic = null;
  }

  // 清除超時定時器
  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  // 初始化話題
  private initTopics(): void {
    if (!this.isConnected()) {
      this.resetTopicStates();
      return;
    }

    try {
      this.pumpTopic = new Topic({
        ros: this.ros,
        name: '/pump_control',
        messageType: 'web_connect/msg/Pump'
      });
      this.pumpTopic.advertise();
      this.pumpTopicReady = true;

      this.chassisTopic = new Topic({
        ros: this.ros,
        name: '/chassis_control',
        messageType: 'web_connect/msg/Chassis'
      });
      this.chassisTopic.advertise();
      this.chassisTopicReady = true;

      this.armTopic = new Topic({
        ros: this.ros,
        name: '/arm_control',
        messageType: 'web_connect/msg/Arm'
      });
      this.armTopic.advertise();
      this.armTopicReady = true;
    } catch (error) {
      console.error('初始化话题失败:', error);
      this.resetTopicStates();
    }
  }

  on(eventName: string, callback: (...args: any[]) => void): void {
    if (this.ros) this.ros.on(eventName, callback);
  }

  off(eventName: string, callback: (...args: any[]) => void): void {
    if (this.ros) this.ros.off(eventName, callback);
  }

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.ros) {
          this.ros.close();
        }

        if (window.location.protocol === 'https:' && url.startsWith('ws://')) {
          return reject(new Error('HTTPS 页面无法连接不安全的 ws:// 地址'));
        }

        this.connectionTimeout = setTimeout(() => {
          this.disconnect();
          reject(new Error('物理连接超时，请检查机器人 IP 是否可达'));
        }, 10000);

        this.ros = new Ros({ url });

        this.ros.on('connection', () => {
          this.clearConnectionTimeout();
          this.initTopics();
          resolve();
        });

        this.ros.on('error', (error: any) => {
          this.clearConnectionTimeout();
          reject(new Error(`WebSocket 报错：请确认 rosbridge 已开启并在 9090 端口监听`));
        });

        this.ros.on('close', () => {
          this.resetTopicStates();
        });
      } catch (error) {
        this.clearConnectionTimeout();
        reject(new Error(`系统阻断连接：${(error as Error).message}`));
      }
    });
  }

  disconnect(): void {
    this.clearConnectionTimeout();
    if (this.ros) {
      // 彻底移除所有事件监听，防止重连时触发旧逻辑
      this.ros.removeAllListeners();
      this.ros.close();
      this.ros = null;
    }
    this.resetTopicStates();
  }

  isConnected(): boolean {
    return this.ros !== null && this.ros.isConnected === true;
  }

  sendConnectionEstablishRequest(establish: number): Promise<number> {
    return this.callService<ConnectionEstablishRequest, ConnectionEstablishResponse>(
      '/connection_establish',
      'web_connect/srv/Establish',
      { establish },
      (response) => response.establish_ack
    );
  }

  sendChassisEnableRequest(motor_cmd: number): Promise<number> {
    return this.callService<EnableRequest, ChassisEnableResponse>(
      '/chassis_enable',
      'web_connect/srv/Enable',
      { motor_cmd },
      (response) => response.motor_ack
    );
  }

  sendArmEnableRequest(motor_cmd: number): Promise<number> {
    return this.callService<EnableRequest, ArmEnableResponse>(
      '/arm_enable',
      'web_connect/srv/Enable',
      { motor_cmd },
      (response) => response.arm_ack
    );
  }

  publishChassisControl(message: ChassisControlMessage): void {
    if (!this.isConnected() || !this.chassisTopicReady || !this.chassisTopic) return;
    this.chassisTopic.publish(new Message(message));
  }

  publishPumpControl(message: PumpMessage): void {
    if (!this.isConnected() || !this.pumpTopicReady || !this.pumpTopic) return;
    this.pumpTopic.publish(new Message(message));
  }

  publishArmControl(message: ArmControlMessage): void {
    if (!this.isConnected() || !this.armTopicReady || !this.armTopic) return;
    this.armTopic.publish(new Message(message));
  }

  sendSemiModeRequest(params: SemiModeRequest): Promise<number> {
    return this.callService<SemiModeRequest, SemiModeResponse>(
      '/semi_mode',
      'web_connect/srv/Semi',
      params,
      (response) => response.ack
    );
  }

  sendStopRequest(stop_cmd: number): Promise<number> {
    return this.callService<StopRequest, StopResponse>(
      '/stop',
      'web_connect/srv/Stop',
      { stop_cmd },
      (response) => response.stop_ack
    );
  }

  sendMachineModeRequest(mode_cmd: number): Promise<number> {
    return this.callService<MachineModeRequest, MachineModeResponse>(
      '/machine_mode',
      'web_connect/srv/Mode',
      { mode_cmd },
      (response) => response.mode_ack
    );
  }

  private callService<TRequest, TResponse>(
    serviceName: string,
    serviceType: string,
    request: TRequest,
    responseHandler: (response: TResponse) => number
  ): Promise<number> {
    return new Promise((resolve) => {
      if (!this.isConnected()) {
        resolve(0);
        return;
      }

      try {
        const service = new Service({
          ros: this.ros,
          name: serviceName,
          serviceType: serviceType
        });

        const serviceRequest = new ServiceRequest(request);

        service.callService(
          serviceRequest,
          (response: TResponse) => resolve(responseHandler(response)),
          (err: string) => {
              console.warn(`服务调用 ${serviceName} 失败:`, err);
              resolve(0);
          }
        );
      } catch (error) {
        console.error(`尝试调用 ${serviceName} 时发生异常:`, error);
        resolve(0);
      }
    });
  }
}

export const ros2Connection = new ROS2Connection();