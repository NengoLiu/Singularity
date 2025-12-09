import { CarouselItem } from './types';

export const CAROUSEL_ITEMS: CarouselItem[] = [
  {
    id: 1,
    title: "神经链路",
    description: "直连奇点核心的低延迟通道。",
    image: "https://picsum.photos/800/600?grayscale&blur=2"
  },
  {
    id: 2,
    title: "精准驱动",
    description: "带触觉反馈的全向移动控制。",
    image: "https://picsum.photos/801/600?grayscale&blur=2"
  },
  {
    id: 3,
    title: "AI 辅助",
    description: "由 Gemini 驱动的自主决策系统。",
    image: "https://picsum.photos/802/600?grayscale&blur=2"
  }
];

export const MOCK_TELEMETRY_DATA = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  speed: Math.floor(Math.random() * 50) + 10,
  voltage: 11.5 + Math.random(),
  temp: 40 + Math.random() * 10
}));