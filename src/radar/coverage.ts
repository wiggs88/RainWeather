import proj4 from 'proj4';
import { DWD_GRID_PROJ4 } from './dwdProjection';

/** DWD's 17 weather radar sites (latitude, longitude). */
export const DWD_RADAR_SITES: ReadonlyArray<readonly [number, number]> = [
  [53.564, 6.748], // Borkum
  [54.004, 10.047], // Boostedt
  [51.125, 13.769], // Dresden
  [49.541, 12.403], // Eisberg
  [51.406, 6.967], // Essen
  [47.874, 8.004], // Feldberg
  [51.311, 8.802], // Flechtdorf
  [52.46, 9.695], // Hannover
  [48.175, 12.102], // Isen
  [48.042, 10.219], // Memmingen
  [50.5, 11.135], // Neuhaus
  [50.11, 6.549], // Neuheilenbach
  [49.985, 8.713], // Offenthal
  [52.649, 13.858], // Prötzel
  [54.176, 12.058], // Rostock
  [48.585, 9.783], // Türkheim
  [52.16, 11.176], // Ummendorf
];

/** Precipitation scans reach about 150 km from each site. */
export const DWD_RADAR_RANGE_KM = 150;
/** Width of the dithered fade where coverage runs out. */
export const DWD_FADE_KM = 30;

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export function distanceToNearestDwdRadarKm(latitude: number, longitude: number): number {
  return Math.min(
    ...DWD_RADAR_SITES.map(([lat, lon]) => distanceKm(latitude, longitude, lat, lon)),
  );
}

/**
 * DWD radar is only trustworthy where a German radar can see. Outside that
 * (Paris, Amsterdam, Vienna…) the composite just reports zero, which looks dry,
 * so those locations use the pan-European RainViewer composite instead.
 */
export function isWithinDwdCoverage(latitude: number, longitude: number): boolean {
  return distanceToNearestDwdRadarKm(latitude, longitude) <= DWD_RADAR_RANGE_KM - DWD_FADE_KM;
}

/** Radar sites in pixel coordinates of a Bright Sky bbox (1 px = 1 km). */
export function dwdSitesInBbox(
  bbox: [number, number, number, number],
): Array<{ x: number; y: number }> {
  const [top, left] = bbox;
  return DWD_RADAR_SITES.map(([lat, lon]) => {
    const [x, y] = proj4('EPSG:4326', DWD_GRID_PROJ4, [lon, lat]);
    return { x: (x + 500) / 1000 - left, y: (500 - y) / 1000 - top };
  });
}
