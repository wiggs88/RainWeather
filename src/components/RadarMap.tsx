import { apply } from 'ol-mapbox-style';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import View from 'ol/View';
import LayerGroup from 'ol/layer/Group';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import ImageStatic from 'ol/source/ImageStatic';
import XYZ from 'ol/source/XYZ';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DWD_PROJECTION_CODE, registerDwdProjection } from '../radar/dwdProjection';
import type {
  Location,
  RadarFrame,
  RainViewerFrame,
  TimelinePoint,
} from '../weather/types';
import { LocationDuck } from './LocationDuck';

interface RadarMapProps {
  location: Location;
  selectedPoint?: TimelinePoint;
  radarFrames: RadarFrame[];
  rainViewerFrames: RainViewerFrame[];
}

const PANEL_RESERVED_HEIGHT = 190;
const DEFAULT_ZOOM = 8.6;

// Keep the location visible above the weather panel that overlaps the map.
function centerLocation(map: Map, location: Location): void {
  const size = map.getSize();
  if (!size) return;
  const targetY = Math.max(160, (size[1] - PANEL_RESERVED_HEIGHT) / 2 + 48);
  map
    .getView()
    .centerOn(fromLonLat([location.longitude, location.latitude]), size, [size[0] / 2, targetY]);
}

function closestRainViewerFrame(
  frames: RainViewerFrame[],
  epochMs: number,
): RainViewerFrame | undefined {
  let closest: RainViewerFrame | undefined;
  let distance = Number.POSITIVE_INFINITY;
  frames.forEach((frame) => {
    const nextDistance = Math.abs(frame.epochMs - epochMs);
    if (nextDistance < distance) {
      closest = frame;
      distance = nextDistance;
    }
  });
  return closest;
}

export function RadarMap({
  location,
  selectedPoint,
  radarFrames,
  rainViewerFrames,
}: RadarMapProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef(location);
  locationRef.current = location;
  const mapRef = useRef<Map | undefined>(undefined);
  const radarLayerRef = useRef(new ImageLayer({ opacity: 0.82 }));
  const fallbackLayerRef = useRef(new TileLayer({ visible: false, opacity: 0.72 }));
  const [markerElement] = useState(() => document.createElement('div'));
  const markerRef = useRef<Overlay | undefined>(undefined);

  useEffect(() => {
    if (!targetRef.current || mapRef.current) return;
    registerDwdProjection();

    const baseGroup = new LayerGroup();
    const marker = new Overlay({
      element: markerElement,
      positioning: 'center-center',
      stopEvent: false,
      position: fromLonLat([location.longitude, location.latitude]),
    });
    markerRef.current = marker;
    const map = new Map({
      target: targetRef.current,
      controls: [],
      layers: [baseGroup, fallbackLayerRef.current, radarLayerRef.current],
      overlays: [marker],
      view: new View({
        center: fromLonLat([location.longitude, location.latitude]),
        zoom: DEFAULT_ZOOM,
        minZoom: 4,
        maxZoom: 12,
      }),
    });
    mapRef.current = map;

    void apply(baseGroup, 'https://tiles.openfreemap.org/styles/dark').catch(() => {
      // The weather layers remain useful if the optional vector basemap is delayed.
    });

    const observer = new ResizeObserver(() => {
      map.updateSize();
      centerLocation(map, locationRef.current);
    });
    observer.observe(targetRef.current);
    centerLocation(map, locationRef.current);

    return () => {
      observer.disconnect();
      map.setTarget(undefined);
      mapRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.setPosition(fromLonLat([location.longitude, location.latitude]));
    map.getView().setZoom(DEFAULT_ZOOM);
    centerLocation(map, location);
  }, [location]);

  useEffect(() => {
    const selectedFrame = selectedPoint?.mapFrameId
      ? radarFrames.find((frame) => frame.id === selectedPoint.mapFrameId)
      : undefined;

    if (selectedFrame) {
      radarLayerRef.current.setSource(
        new ImageStatic({
          url: selectedFrame.imageUrl,
          projection: DWD_PROJECTION_CODE,
          imageExtent: selectedFrame.imageExtent,
          interpolate: false,
        }),
      );
      radarLayerRef.current.setVisible(true);
      fallbackLayerRef.current.setVisible(false);
      return;
    }

    radarLayerRef.current.setVisible(false);
    if (radarFrames.length > 0) {
      fallbackLayerRef.current.setVisible(false);
      return;
    }
    const fallback = selectedPoint
      ? closestRainViewerFrame(rainViewerFrames, selectedPoint.epochMs)
      : rainViewerFrames.at(-1);
    if (fallback) {
      fallbackLayerRef.current.setSource(
        new XYZ({
          url: fallback.tileTemplate,
          maxZoom: 7,
          crossOrigin: 'anonymous',
          interpolate: false,
        }),
      );
      fallbackLayerRef.current.setVisible(true);
    } else {
      fallbackLayerRef.current.setVisible(false);
    }
  }, [radarFrames, rainViewerFrames, selectedPoint]);

  return (
    <>
      <div ref={targetRef} className="radar-map" role="img" aria-label="Animated precipitation map" />
      {createPortal(<LocationDuck intensity={selectedPoint?.intensity} />, markerElement)}
    </>
  );
}
