import Projection from 'ol/proj/Projection';
import { get as getProjection } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';

export const DWD_PROJECTION_CODE = 'DE1200';
export const DWD_GRID_PROJ4 =
  '+proj=stere +lat_0=90 +lat_ts=60 +lon_0=10 +a=6378137 +b=6356752.3142451802 +no_defs +x_0=543196.83521776402 +y_0=3622588.8619310018';

let registered = false;

export function registerDwdProjection(): void {
  if (registered) return;
  proj4.defs(DWD_PROJECTION_CODE, DWD_GRID_PROJ4);
  register(proj4);
  const projection = getProjection(DWD_PROJECTION_CODE) as Projection | null;
  projection?.setExtent([-500, -1_199_500, 1_099_500, 500]);
  registered = true;
}

export function radarExtentForBbox(
  bbox: [number, number, number, number],
): [number, number, number, number] {
  const [top, left, bottom, right] = bbox;
  const xMin = -500 + left * 1000;
  const xMax = -500 + (right + 1) * 1000;
  const yMax = 500 - top * 1000;
  const yMin = 500 - (bottom + 1) * 1000;
  return [xMin, yMin, xMax, yMax];
}
