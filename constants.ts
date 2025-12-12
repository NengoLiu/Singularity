import { CarouselItem } from './types';

export const CAROUSEL_ITEMS: CarouselItem[] = [
  {
    id: 1,
    title: "奇点智造",
    description: "重塑地坪施工新纪元。以绝对的精度和效率，通过奇点核心定义行业自动化涂敷的最高标准。",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "极致工艺",
    description: "专为环氧、聚氨酯及固化地坪设计。从地下车库到高端厂房，毫米级膜厚控制，零误差拼接。",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "蜂群协同",
    description: "单机自主作业，多机协同覆盖。奇点 AI 算法让大规模地面工程从此变得简单。",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop"
  }
];

export const MOCK_TELEMETRY_DATA = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  speed: Math.floor(Math.random() * 50) + 10,
  voltage: 11.5 + Math.random(),
  temp: 40 + Math.random() * 10
}));