import { apply } from 'ol-mapbox-style';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import LayerGroup from 'ol/layer/Group';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import ImageStatic from 'ol/source/ImageStatic';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { useEffect, useRef } from 'react';
import { DWD_PROJECTION_CODE, registerDwdProjection } from '../radar/dwdProjection';
import type {
  Location,
  RadarFrame,
  RainViewerFrame,
  TimelinePoint,
} from '../weather/types';

interface RadarMapProps {
  location: Location;
  selectedPoint?: TimelinePoint;
  radarFrames: RadarFrame[];
  rainViewerFrames: RainViewerFrame[];
}

const markerStyle = new Style({
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({ color: '#f2f5f7' }),
    stroke: new Stroke({ color: '#090b0d', width: 3 }),
  }),
});

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
  const markerSourceRef = useRef(new VectorSource());

  useEffect(() => {
    if (!targetRef.current || mapRef.current) return;
    registerDwdProjection();

    const baseGroup = new LayerGroup();
    const markerLayer = new VectorLayer({
      source: markerSourceRef.current,
      style: markerStyle,
      zIndex: 30,
    });
    const map = new Map({
      target: targetRef.current,
      controls: [],
      layers: [baseGroup, fallbackLayerRef.current, radarLayerRef.current, markerLayer],
      view: new View({
        center: fromLonLat([location.longitude, location.latitude]),
        zoom: 8.6,
        minZoom: 4,
        maxZoom: 12,
      }),
    });
    mapRef.current = map;

    void apply(baseGroup, 'https://tiles.openfreemap.org/styles/dark').catch(() => {
      // The weather layers remain useful if the optional vector basemap is delayed.
    });

    const placeLocationInView = () => {
      const size = map.getSize();
      if (!size) return;
      const currentLocation = locationRef.current;
      const availableWidth = size[0] >= 720 ? size[0] - 400 : size[0];
      const targetY = size[0] >= 720 ? size[1] / 2 : Math.max(160, (size[1] - 340) / 2 + 48);
      map.getView().centerOn(
        fromLonLat([currentLocation.longitude, currentLocation.latitude]),
        size,
        [availableWidth / 2, targetY],
      );
    };
    const observer = new ResizeObserver(() => {
      map.updateSize();
      placeLocationInView();
    });
    observer.observe(targetRef.current);
    placeLocationInView();

    return () => {
      observer.disconnect();
      map.setTarget(undefined);
      mapRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const coordinate = fromLonLat([location.longitude, location.latitude]);
    markerSourceRef.current.clear();
    markerSourceRef.current.addFeature(new Feature(new Point(coordinate)));
    map.getView().setZoom(8.6);
    const size = map.getSize();
    if (size) {
      const availableWidth = size[0] >= 720 ? size[0] - 400 : size[0];
      const targetY = size[0] >= 720 ? size[1] / 2 : Math.max(160, (size[1] - 340) / 2 + 48);
      map.getView().centerOn(coordinate, size, [availableWidth / 2, targetY]);
    }
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
        new XYZ({ url: fallback.tileTemplate, maxZoom: 7, crossOrigin: 'anonymous' }),
      );
      fallbackLayerRef.current.setVisible(true);
    } else {
      fallbackLayerRef.current.setVisible(false);
    }
  }, [radarFrames, rainViewerFrames, selectedPoint]);

  return <div ref={targetRef} className="radar-map" aria-label="Animated precipitation map" />;
}
