/// <reference lib="webworker" />

import { inflate } from 'pako';
import { rateToRgba } from './palette';

interface DecodeRequest {
  type: 'decode';
  width: number;
  height: number;
  sampleX: number;
  sampleY: number;
  sampleRadius: number;
  frames: Array<{ id: string; timestamp: string; compressed: string }>;
}

function decodePrecipitation(encoded: string): Uint16Array {
  const compressed = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  const rawBytes = inflate(compressed);
  return new Uint16Array(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength / 2);
}

function sampleLocalRate(
  values: Uint16Array,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
): number {
  const samples: number[] = [];
  const startX = Math.max(0, Math.round(centerX) - radius);
  const endX = Math.min(width - 1, Math.round(centerX) + radius);
  const startY = Math.max(0, Math.round(centerY) - radius);
  const endY = Math.min(height - 1, Math.round(centerY) + radius);

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const raw = values[y * width + x];
      if (raw < 10_000) samples.push((raw / 100) * 12);
    }
  }

  if (samples.length === 0) return 0;
  samples.sort((a, b) => a - b);
  return samples[Math.floor((samples.length - 1) * 0.75)];
}

self.addEventListener('message', (event: MessageEvent<DecodeRequest>) => {
  if (event.data.type !== 'decode') return;
  const { width, height, sampleX, sampleY, sampleRadius, frames } = event.data;

  frames.forEach((frame, index) => {
    try {
      const values = decodePrecipitation(frame.compressed);
      if (values.length !== width * height) {
        throw new Error(`Unexpected radar grid size: ${values.length}`);
      }

      const rgba = new Uint8ClampedArray(values.length * 4);
      for (let valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
        const raw = values[valueIndex];
        const rate = raw < 10_000 ? (raw / 100) * 12 : 0;
        const color = rateToRgba(rate);
        const rgbaIndex = valueIndex * 4;
        rgba[rgbaIndex] = color[0];
        rgba[rgbaIndex + 1] = color[1];
        rgba[rgbaIndex + 2] = color[2];
        rgba[rgbaIndex + 3] = color[3];
      }

      self.postMessage(
        {
          type: 'frame',
          index,
          id: frame.id,
          timestamp: frame.timestamp,
          localPrecipitationRate: sampleLocalRate(
            values,
            width,
            height,
            sampleX,
            sampleY,
            sampleRadius,
          ),
          rgba: rgba.buffer,
        },
        { transfer: [rgba.buffer] },
      );
    } catch (error) {
      self.postMessage({
        type: 'frame-error',
        index,
        message: error instanceof Error ? error.message : 'Radar decode failed',
      });
    }
  });

  self.postMessage({ type: 'done' });
});

export {};
