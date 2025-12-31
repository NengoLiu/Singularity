import { useState, useCallback } from 'react';

const STORAGE_KEY = 'singularity_ros_v2_state';

// In-memory fallback for environments where localStorage is blocked (Insecure Operation)
const memoryStorage: Record<string, string> = {};

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(key) : memoryStorage[key] || null;
    } catch (e) {
      return memoryStorage[key] || null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      } else {
        memoryStorage[key] = value;
      }
    } catch (e) {
      memoryStorage[key] = value;
    }
  }
};

// 初始状态定义
const DEFAULT_STATE = {
  isConnected: false,
  isConnecting: false,
  rosUrl: 'ws://192.168.4.1:9090',
};

// 安全地从本地读取
const getInitialState = () => {
  try {
    const saved = safeLocalStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 保持持久化的 URL 和基本的连接意图
      return { 
        ...DEFAULT_STATE, 
        rosUrl: parsed.rosUrl || DEFAULT_STATE.rosUrl 
      };
    }
  } catch (e) {
    console.warn("ROS Store persistent data corrupted, using defaults.");
  }
  return DEFAULT_STATE;
};

let globalState = getInitialState();
const listeners = new Set<(state: typeof globalState) => void>();

const setState = (nextState: Partial<typeof globalState>) => {
  globalState = { ...globalState, ...nextState };
  // 仅持久化关键配置
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify({
    rosUrl: globalState.rosUrl
  }));
  listeners.forEach(l => l(globalState));
};

export const useRosStore = () => {
  const [state, setInternalState] = useState(globalState);

  useState(() => {
    const listener = (s: typeof globalState) => setInternalState(s);
    listeners.add(listener);
    return () => listeners.delete(listener);
  });

  return {
    ...state,
    setIsConnected: (val: boolean) => setState({ isConnected: val }),
    setIsConnecting: (val: boolean) => setState({ isConnecting: val }),
    setRosUrl: (url: string) => setState({ rosUrl: url }),
  };
};