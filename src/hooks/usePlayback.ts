import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TimelinePoint } from '../weather/types';

function findNowIndex(points: TimelinePoint[]): number {
  const marked = points.findIndex((point) => point.phase === 'now');
  if (marked >= 0) return marked;
  let nearest = 0;
  let distance = Number.POSITIVE_INFINITY;
  points.forEach((point, index) => {
    const nextDistance = Math.abs(point.epochMs - Date.now());
    if (nextDistance < distance) {
      nearest = index;
      distance = nextDistance;
    }
  });
  return nearest;
}

export interface PlaybackState {
  selectedIndex: number;
  selectedPoint?: TimelinePoint;
  isPlaying: boolean;
  setSelectedIndex: (index: number) => void;
  togglePlayback: () => void;
  jumpToNow: () => void;
}

export function usePlayback(points: TimelinePoint[]): PlaybackState {
  const [selectedIndex, setSelectedIndexState] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const nowIndex = useMemo(() => findNowIndex(points), [points]);
  const playableIndices = useMemo(() => {
    const radarIndices = points.flatMap((point, index) =>
      point.mapFrameId ? [index] : [],
    );
    return radarIndices.length > 1 ? radarIndices : points.map((_, index) => index);
  }, [points]);

  const clearTimer = useCallback(() => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  useEffect(() => {
    setSelectedIndexState(nowIndex);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setIsPlaying(points.length > 1 && !reducedMotion);
  }, [nowIndex, points.length]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') setIsPlaying(false);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    clearTimer();
    if (!isPlaying || playableIndices.length <= 1) return;

    const delay = selectedIndex === nowIndex ? 1100 : 480;
    timer.current = window.setTimeout(() => {
      setSelectedIndexState((current) => {
        const position = playableIndices.indexOf(current);
        return playableIndices[(Math.max(position, -1) + 1) % playableIndices.length];
      });
    }, delay);

    return clearTimer;
  }, [clearTimer, isPlaying, nowIndex, playableIndices, selectedIndex]);

  const setSelectedIndex = useCallback(
    (index: number) => {
      setIsPlaying(false);
      setSelectedIndexState(Math.max(0, Math.min(points.length - 1, Math.round(index))));
    },
    [points.length],
  );

  const togglePlayback = useCallback(() => {
    if (playableIndices.length <= 1) return;
    setIsPlaying((playing) => {
      if (!playing && !playableIndices.includes(selectedIndex)) {
        setSelectedIndexState(playableIndices[0]);
      }
      return !playing;
    });
  }, [playableIndices, selectedIndex]);

  const jumpToNow = useCallback(() => {
    setSelectedIndexState(nowIndex);
    setIsPlaying(false);
  }, [nowIndex]);

  return {
    selectedIndex,
    selectedPoint: points[selectedIndex],
    isPlaying,
    setSelectedIndex,
    togglePlayback,
    jumpToNow,
  };
}
