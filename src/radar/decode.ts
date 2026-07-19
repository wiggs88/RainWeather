import type { BrightSkyRadarResponse } from '../weather/brightSky';
import { phaseForTimestamp, radarSampleToTimelinePoint } from '../weather/normalize';
import type { RadarFrame, TimelinePoint } from '../weather/types';
import { radarExtentForBbox } from './dwdProjection';

interface WorkerFrameMessage {
  type: 'frame';
  index: number;
  id: string;
  timestamp: string;
  localPrecipitationRate: number;
  rgba: ArrayBuffer;
}

interface WorkerErrorMessage {
  type: 'frame-error';
  index: number;
  message: string;
}

interface WorkerDoneMessage {
  type: 'done';
}

type WorkerMessage = WorkerFrameMessage | WorkerErrorMessage | WorkerDoneMessage;

export interface DecodedRadar {
  frames: RadarFrame[];
  timeline: TimelinePoint[];
}

function rgbaToObjectUrl(
  rgba: ArrayBuffer,
  width: number,
  height: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      reject(new Error('Canvas is unavailable'));
      return;
    }

    const image = new ImageData(new Uint8ClampedArray(rgba), width, height);
    context.putImageData(image, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not create radar frame'));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  });
}

export async function decodeBrightSkyRadar(
  response: BrightSkyRadarResponse,
  signal?: AbortSignal,
  nowMs = Date.now(),
): Promise<DecodedRadar> {
  if (!response.bbox || !response.latlon_position) {
    throw new Error('Radar geometry is unavailable');
  }

  const [top, left, bottom, right] = response.bbox;
  const samplePosition = response.latlon_position;
  const width = right - left + 1;
  const height = bottom - top + 1;
  if (width <= 0 || height <= 0) throw new Error('Radar geometry is invalid');

  return new Promise<DecodedRadar>((resolve, reject) => {
    const worker = new Worker(new URL('./radar.worker.ts', import.meta.url), { type: 'module' });
    const decoded: WorkerFrameMessage[] = [];

    const handleAbort = () => {
      worker.terminate();
      reject(new DOMException('Radar decoding aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', handleAbort, { once: true });

    worker.addEventListener('error', (event) => {
      signal?.removeEventListener('abort', handleAbort);
      worker.terminate();
      reject(new Error(event.message || 'Radar worker failed'));
    });

    worker.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      if (message.type === 'frame') {
        decoded.push(message);
        return;
      }
      if (message.type === 'frame-error') {
        return;
      }
      if (message.type !== 'done') return;

      signal?.removeEventListener('abort', handleAbort);
      worker.terminate();

      try {
        const sorted = [...decoded].sort((a, b) => a.index - b.index);
        const imageUrls = await Promise.all(
          sorted.map((frame) => rgbaToObjectUrl(frame.rgba, width, height)),
        );
        const imageExtent = radarExtentForBbox(response.bbox!);
        const frames = sorted.map((frame, index): RadarFrame => {
          const epochMs = Date.parse(frame.timestamp);
          return {
            id: frame.id,
            timestamp: frame.timestamp,
            epochMs,
            phase: phaseForTimestamp(epochMs, nowMs),
            source: 'bright-sky',
            imageUrl: imageUrls[index],
            imageExtent,
            localPrecipitationRate: frame.localPrecipitationRate,
          };
        });
        const timeline = sorted.map((frame) =>
          radarSampleToTimelinePoint(
            frame.id,
            frame.timestamp,
            frame.localPrecipitationRate,
            nowMs,
          ),
        );
        resolve({ frames, timeline });
      } catch (error) {
        reject(error);
      }
    });

    worker.postMessage({
      type: 'decode',
      width,
      height,
      sampleX: samplePosition.x,
      sampleY: samplePosition.y,
      sampleRadius: 2,
      frames: response.radar.map((record, index) => ({
        id: `radar-${Date.parse(record.timestamp)}-${index}`,
        timestamp: record.timestamp,
        compressed: record.precipitation_5,
      })),
    });
  });
}
