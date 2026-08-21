import { Circle as CircleStyle, Fill, Style } from "ol/style";

import {
  MARKER_COLORS,
  establishmentMarkerHex,
  hexToRgba,
} from "@/lib/map/marker-colors";
import type { MarkerRole } from "@/lib/map/types";

function markerRadiusForZoom(zoom: number, role: MarkerRole): number {
  if (role === "primary") {
    if (zoom <= 7) return 12;
    if (zoom <= 12) return 11;
    return 10;
  }

  if (role === "sido-context") {
    if (zoom <= 7) return 7;
    if (zoom <= 12) return 6;
    return 5;
  }

  if (zoom <= 7) return 9;
  if (zoom <= 12) return 8;
  return 6;
}

export function buildMarkerGlowStyles(
  establishment: string,
  role: MarkerRole,
  zoom: number,
): Style {
  const radius = markerRadiusForZoom(zoom, role);
  const opacity = role === "sido-context" ? MARKER_COLORS.sidoContextOpacity : 1;
  const color =
    role === "primary"
      ? MARKER_COLORS.primary
      : establishmentMarkerHex(establishment);

  return new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({ color: hexToRgba(color, 0.95 * opacity) }),
    }),
  });
}
