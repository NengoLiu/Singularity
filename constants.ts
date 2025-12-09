import { CarouselItem } from './types';

export const CAROUSEL_ITEMS: CarouselItem[] = [
  {
    id: 1,
    title: "NEURAL LINK",
    description: "Direct low-latency connection to Singularity Core.",
    image: "https://picsum.photos/800/600?grayscale&blur=2"
  },
  {
    id: 2,
    title: "PRECISION DRIVE",
    description: "Omni-directional movement with haptic feedback.",
    image: "https://picsum.photos/801/600?grayscale&blur=2"
  },
  {
    id: 3,
    title: "AI ASSISTANCE",
    description: "Gemini-powered autonomous decision making.",
    image: "https://picsum.photos/802/600?grayscale&blur=2"
  }
];

export const MOCK_TELEMETRY_DATA = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  speed: Math.floor(Math.random() * 50) + 10,
  voltage: 11.5 + Math.random(),
  temp: 40 + Math.random() * 10
}));
