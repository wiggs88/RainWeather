export type TimelinePhase = 'observed' | 'now' | 'forecast';
export type WeatherSource = 'bright-sky' | 'icon-d2';
export type Intensity = 'dry' | 'trace' | 'light' | 'moderate' | 'heavy';
export type Confidence = 'high' | 'medium' | 'low';

export interface Location {
  id: string;
  name: string;
  detail: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface TimelinePoint {
  id: string;
  timestamp: string;
  epochMs: number;
  intervalMinutes: number;
  phase: TimelinePhase;
  source: WeatherSource;
  precipitationRate: number;
  precipitationAmount: number;
  temperatureC?: number;
  intensity: Intensity;
  thunderRisk: number;
  mapFrameId?: string;
}

export interface RadarFrame {
  id: string;
  timestamp: string;
  epochMs: number;
  phase: TimelinePhase;
  source: 'bright-sky';
  imageUrl: string;
  imageExtent: [number, number, number, number];
  localPrecipitationRate: number;
}

export interface RainViewerFrame {
  id: string;
  timestamp: string;
  epochMs: number;
  tileTemplate: string;
}

export interface WeatherAlert {
  id: string;
  headline: string;
  description?: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme' | 'unknown';
}

export interface RainSummary {
  headline: string;
  detail: string;
  confidence: Confidence;
  currentIntensity: Intensity;
  nextChangeEpochMs?: number;
  dryWindowStartEpochMs?: number;
  dryWindowEndEpochMs?: number;
}

export interface WeatherSnapshot {
  location: Location;
  timeline: TimelinePoint[];
  radarFrames: RadarFrame[];
  rainViewerFrames: RainViewerFrame[];
  alerts: WeatherAlert[];
  summary: RainSummary;
  updatedAt: number;
  radarMode: 'nowcast' | 'history' | 'none';
  notices: string[];
}

export type WeatherLoadStatus = 'idle' | 'loading' | 'ready' | 'error';
