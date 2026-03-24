import { Studio } from "./types";

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price_per_hour: number;
  features: { text: string; included: boolean }[];
  is_popular?: boolean;
}

export interface AddOnService {
  id: string;
  name: string;
  description: string;
  price: number;
  thumbnail: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingState {
  currentStep: number;
  date: Date | null;
  timeSlot: string | null;
  duration: number;
  participants: number;
  selectedStudio: Studio | null;
  selectedPackage: ServicePackage | null;
  selectedAddOns: AddOnService[];
}

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: "recording",
    name: "Recording",
    description: "Raw recording with professional equipment",
    price_per_hour: 0,
    features: [
      { text: "Professional studio access", included: true },
      { text: "High-quality equipment", included: true },
      { text: "On-site technical support", included: true },
      { text: "Raw audio files", included: true },
      { text: "Live mix monitoring", included: false },
      { text: "Professional editing", included: false },
    ],
  },
  {
    id: "recording-mix",
    name: "Recording + Live Mix",
    description: "Recording with real-time mixing by our engineers",
    price_per_hour: 500,
    features: [
      { text: "Professional studio access", included: true },
      { text: "High-quality equipment", included: true },
      { text: "On-site technical support", included: true },
      { text: "Raw audio files", included: true },
      { text: "Live mix monitoring", included: true },
      { text: "Professional editing", included: false },
    ],
    is_popular: true,
  },
  {
    id: "recording-edit",
    name: "Recording + Professional Edit",
    description: "Full package with post-production editing",
    price_per_hour: 1200,
    features: [
      { text: "Professional studio access", included: true },
      { text: "High-quality equipment", included: true },
      { text: "On-site technical support", included: true },
      { text: "Raw audio files", included: true },
      { text: "Live mix monitoring", included: true },
      { text: "Professional editing", included: true },
    ],
  },
];

export const ADD_ON_SERVICES: AddOnService[] = [
  {
    id: "thumbnail",
    name: "YouTube Thumbnail",
    description: "Professional thumbnail design for your episode",
    price: 1500,
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80",
  },
  {
    id: "episode-edit",
    name: "Episode Editing",
    description: "Full post-production editing and mastering",
    price: 3500,
    thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=80",
  },
  {
    id: "highlights",
    name: "Highlights / Clips",
    description: "Short highlight clips from your episode",
    price: 2000,
    thumbnail: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80",
  },
  {
    id: "reels",
    name: "Reels",
    description: "Social media ready vertical video reels",
    price: 2500,
    thumbnail: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=400&q=80",
  },
  {
    id: "transcription",
    name: "Transcription",
    description: "Full episode transcription with timestamps",
    price: 800,
    thumbnail: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80",
  },
  {
    id: "show-notes",
    name: "Show Notes",
    description: "Detailed show notes with links and timestamps",
    price: 1000,
    thumbnail: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&q=80",
  },
];

export const TIME_SLOTS: TimeSlot[] = [
  { time: "09:00", available: true },
  { time: "10:00", available: true },
  { time: "11:00", available: true },
  { time: "12:00", available: true },
  { time: "13:00", available: true },
  { time: "14:00", available: true },
  { time: "15:00", available: true },
  { time: "16:00", available: true },
  { time: "17:00", available: true },
  { time: "18:00", available: true },
  { time: "19:00", available: true },
  { time: "20:00", available: true },
];

export const DURATION_OPTIONS = [1, 2, 3, 4];
export const PARTICIPANT_OPTIONS = [1, 2, 3, 4, 5];
