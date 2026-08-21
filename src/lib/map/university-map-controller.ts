import { Map as OlMap, View } from "ol";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import Overlay from "ol/Overlay";
import { unByKey } from "ol/Observable";
import type { EventsKey } from "ol/events";
import { fromLonLat, toLonLat, transformExtent } from "ol/proj";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";

import {
  KOREA_BBOX,
  findSidoAtPoint,
  getSidoMapZoom,
} from "@/lib/analysis/korea-sido-regions";
import type { UniversityLocationRow } from "@/lib/ingest/university-locations-config";
import { buildMarkerGlowStyles } from "@/lib/map/marker-glow-styles";
import {
  DARK_BOUNDARY_MAP_BG,
  createVWorldBoundaryWmsLayer,
} from "@/lib/map/vworld-boundary-wms";
import type {
  MapDisplayMode,
  MapViewTarget,
  MarkerRole,
  UniversityMapController,
  UniversityMapControllerOptions,
  UniversityMapMarker,
} from "@/lib/map/types";

const KOREA_EXTENT = transformExtent(KOREA_BBOX, "EPSG:4326", "EPSG:3857");
const SCHOOL_FOCUS_ZOOM = 15;
const MARKER_HIT_TOLERANCE = 8;

function formatSchoolLabel(school: UniversityLocationRow): string {
  if (school.mainBranch && school.mainBranch !== "본교") {
    return `${school.schoolName} (${school.mainBranch})`;
  }
  return school.schoolName;
}

type OlCesiumInstance = {
  setEnabled: (enabled: boolean) => void;
  destroy: () => void;
};

function fitMarkerExtent(
  map: OlMap,
  source: VectorSource,
  maxZoom: number,
) {
  const extent = source.getExtent();
  if (
    !extent ||
    !extent.every((v) => Number.isFinite(v)) ||
    extent[0] === Infinity
  ) {
    return false;
  }

  map.getView().fit(extent, {
    padding: [56, 56, 56, 56],
    duration: 500,
    maxZoom,
  });
  return true;
}
function fitKoreaView(map: OlMap) {
  map.getView().fit(KOREA_EXTENT, {
    padding: [32, 32, 32, 32],
    duration: 500,
    maxZoom: 7,
  });
}

declare global {
  interface Window {
    Cesium?: unknown;
    CESIUM_BASE_URL?: string;
  }
}

export class OpenLayersUniversityMapController implements UniversityMapController {
  private readonly options: UniversityMapControllerOptions;
  private map: OlMap | null = null;
  private vectorSource: VectorSource | null = null;
  private markerLayer: VectorLayer<VectorSource> | null = null;
  private baseTileLayer: TileLayer<XYZ> | null = null;
  private sidoBoundaryLayer: TileLayer | null = null;
  private sigunguBoundaryLayer: TileLayer | null = null;
  private mapContainer: HTMLElement | null = null;
  private apiKey = "";
  private tooltipOverlay: Overlay | null = null;
  private tooltipElement: HTMLDivElement | null = null;
  private pointerMoveKey: EventsKey | null = null;
  private moveEndKey: EventsKey | null = null;
  private selectedSidoId: string | null = null;
  private suppressViewportRegionChange = false;
  private ol3d: OlCesiumInstance | null = null;
  private displayMode: MapDisplayMode = "2d";
  private mounted = false;
  private cesiumLoading: Promise<void> | null = null;

  constructor(options: UniversityMapControllerOptions) {
    this.options = options;
  }

  get ready() {
    return this.mounted;
  }

  async mount(): Promise<void> {
    if (this.map) return;

    const { container, apiKey, onSelectSchool, onSelectRegion } = this.options;
    this.apiKey = apiKey;
    this.mapContainer = container;

    this.vectorSource = new VectorSource();
    const markerLayer = new VectorLayer({
      source: this.vectorSource,
      zIndex: 10,
    });
    this.markerLayer = markerLayer;

    const baseTileLayer = new TileLayer({
      source: new XYZ({
        url: this.buildTileUrl("2d"),
        crossOrigin: "anonymous",
      }),
    });
    this.baseTileLayer = baseTileLayer;

    this.sidoBoundaryLayer = createVWorldBoundaryWmsLayer(apiKey, "sido");
    this.sigunguBoundaryLayer = createVWorldBoundaryWmsLayer(apiKey, "sigungu");

    const map = new OlMap({
      target: container,
      layers: [
        baseTileLayer,
        this.sidoBoundaryLayer,
        this.sigunguBoundaryLayer,
        markerLayer,
      ],
      view: new View({
        center: fromLonLat([127.8, 36.2]),
        zoom: 7,
        minZoom: 6,
        maxZoom: 18,
        extent: KOREA_EXTENT,
        constrainOnlyCenter: false,
        enableRotation: false,
      }),
    });

    markerLayer.setStyle((feature) => {
      const zoom = map.getView().getZoom() ?? 7;
      const establishment = feature.get("establishment") as string;
      const role = feature.get("role") as MarkerRole;
      return buildMarkerGlowStyles(establishment, role, zoom);
    });

    map.getView().on("change:resolution", () => {
      markerLayer.changed();
    });

    const tooltipElement = document.createElement("div");
    tooltipElement.className =
      "pointer-events-none hidden rounded-md border border-border/60 bg-surface/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-lg whitespace-nowrap";
    this.tooltipElement = tooltipElement;

    const tooltipOverlay = new Overlay({
      element: tooltipElement,
      offset: [0, -12],
      positioning: "bottom-center",
      stopEvent: false,
    });
    map.addOverlay(tooltipOverlay);
    this.tooltipOverlay = tooltipOverlay;

    this.pointerMoveKey = map.on("pointermove", (evt) => {
      if (evt.dragging) return;

      const feature = map.forEachFeatureAtPixel(
        evt.pixel,
        (f) => f,
        {
          layerFilter: (layer) => layer === markerLayer,
          hitTolerance: MARKER_HIT_TOLERANCE,
        },
      );

      const target = map.getTargetElement();
      if (!target) return;

      if (feature) {
        const school = feature.get("school") as
          | UniversityMapMarker["school"]
          | undefined;
        if (school) {
          tooltipElement.textContent = formatSchoolLabel(school);
          tooltipElement.classList.remove("hidden");
          tooltipOverlay.setPosition(evt.coordinate);
          target.style.cursor = "pointer";
          return;
        }
      }

      tooltipElement.classList.add("hidden");
      tooltipOverlay.setPosition(undefined);
      target.style.cursor = "";
    });

    map.on("click", (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature) {
        const school = feature.get("school") as UniversityMapMarker["school"] | undefined;
        if (school) {
          onSelectSchool(school);
          return;
        }
      }

      const [clickLng, clickLat] = toLonLat(evt.coordinate);
      const sido = findSidoAtPoint(clickLng, clickLat);
      if (sido) onSelectRegion(sido, null);
    });

    this.moveEndKey = map.on("moveend", () => {
      if (this.suppressViewportRegionChange) return;

      const { onViewportRegionChange } = this.options;
      if (!onViewportRegionChange) return;

      const center = map.getView().getCenter();
      if (!center) return;

      const [lng, lat] = toLonLat(center);
      const sido = findSidoAtPoint(lng, lat);
      if (
        !sido ||
        this.selectedSidoId === null ||
        sido.id === this.selectedSidoId
      ) {
        return;
      }

      onViewportRegionChange(sido);
    });

    this.map = map;
    this.mounted = true;
  }

  destroy(): void {
    if (this.pointerMoveKey) {
      unByKey(this.pointerMoveKey);
      this.pointerMoveKey = null;
    }
    if (this.moveEndKey) {
      unByKey(this.moveEndKey);
      this.moveEndKey = null;
    }
    this.ol3d?.destroy();
    this.ol3d = null;
    this.map?.setTarget(undefined);
    this.map = null;
    this.vectorSource = null;
    this.markerLayer = null;
    this.baseTileLayer = null;
    this.sidoBoundaryLayer = null;
    this.sigunguBoundaryLayer = null;
    this.mapContainer = null;
    this.tooltipOverlay = null;
    this.tooltipElement?.remove();
    this.tooltipElement = null;
    this.mounted = false;
  }

  setMarkers(markers: UniversityMapMarker[]): void {
    const source = this.vectorSource;
    if (!source) return;

    source.clear();
    for (const marker of markers) {
      const feature = new Feature({
        geometry: new Point(fromLonLat([marker.lng, marker.lat])),
        school: marker.school,
        establishment: marker.establishment,
        role: marker.role,
      });
      source.addFeature(feature);
    }
    this.markerLayer?.changed();
  }

  setSelectedSidoId(sidoId: string | null): void {
    this.selectedSidoId = sidoId;
  }

  flyTo(target: MapViewTarget): void {
    const map = this.map;
    if (!map) return;

    const view = map.getView();

    this.runProgrammaticViewChange(() => {
      if (target.kind === "search-focus") {
        if (target.points.length === 0) return;

        if (target.points.length === 1) {
          const [point] = target.points;
          view.animate({
            center: fromLonLat([point.lng, point.lat]),
            zoom: SCHOOL_FOCUS_ZOOM,
            duration: 500,
          });
          return;
        }

        const extent = target.points.reduce(
          (acc, point) => {
            const [x, y] = fromLonLat([point.lng, point.lat]);
            return [
              Math.min(acc[0], x),
              Math.min(acc[1], y),
              Math.max(acc[2], x),
              Math.max(acc[3], y),
            ] as [number, number, number, number];
          },
          [Infinity, Infinity, -Infinity, -Infinity] as [
            number,
            number,
            number,
            number,
          ],
        );

        view.fit(extent, {
          padding: [72, 72, 72, 72],
          duration: 500,
          maxZoom: SCHOOL_FOCUS_ZOOM,
        });
        return;
      }

      if (target.kind === "school") {
        view.animate({
          center: fromLonLat([target.lng, target.lat]),
          zoom: SCHOOL_FOCUS_ZOOM,
          duration: 500,
        });
        return;
      }

      if (target.kind === "sido") {
        const source = this.vectorSource;
        const maxZoom = getSidoMapZoom(target.sido) + 1;

        if (source && fitMarkerExtent(map, source, maxZoom)) {
          return;
        }

        const sidoExtent = transformExtent(
          target.sido.bbox,
          "EPSG:4326",
          "EPSG:3857",
        );
        view.fit(sidoExtent, {
          padding: [56, 56, 56, 56],
          duration: 500,
          maxZoom: getSidoMapZoom(target.sido),
        });
        return;
      }

      fitKoreaView(map);
    });
  }

  private runProgrammaticViewChange(action: () => void): void {
    const map = this.map;
    const view = map?.getView();
    if (!map || !view) return;

    this.suppressViewportRegionChange = true;
    const release = () => {
      this.suppressViewportRegionChange = false;
    };
    const timeoutId = window.setTimeout(release, 700);
    map.once("moveend", () => {
      window.clearTimeout(timeoutId);
      release();
    });

    action();
  }

  async setDisplayMode(mode: MapDisplayMode): Promise<void> {
    if (mode === this.displayMode) return;

    if (mode === "3d") {
      await this.ensureCesium();
      this.applyTileBaseMap("2d");
      this.ol3d?.setEnabled(true);
      this.displayMode = "3d";
      return;
    }

    this.ol3d?.setEnabled(false);

    if (mode === "boundary") {
      this.baseTileLayer?.setVisible(false);
      this.sidoBoundaryLayer?.setVisible(true);
      this.sigunguBoundaryLayer?.setVisible(true);
      this.setMapBackground(DARK_BOUNDARY_MAP_BG);
      this.displayMode = "boundary";
      return;
    }

    this.applyTileBaseMap(mode);
    this.displayMode = mode;
  }

  private applyTileBaseMap(mode: "2d" | "satellite") {
    this.baseTileLayer?.setVisible(true);
    this.sidoBoundaryLayer?.setVisible(false);
    this.sigunguBoundaryLayer?.setVisible(false);
    this.setMapBackground("");
    this.setBaseMapType(mode);
  }

  private setMapBackground(color: string) {
    const target = this.map?.getTargetElement();
    if (target) {
      target.style.backgroundColor = color;
    }
    if (this.mapContainer) {
      this.mapContainer.style.backgroundColor = color;
    }
  }

  private buildTileUrl(mode: "2d" | "satellite"): string {
    const layer = mode === "satellite" ? "Satellite" : "Base";
    const extension = mode === "satellite" ? "jpeg" : "png";
    return `https://api.vworld.kr/req/wmts/1.0.0/${this.apiKey}/${layer}/{z}/{y}/{x}.${extension}`;
  }

  private setBaseMapType(mode: "2d" | "satellite"): void {
    const source = this.baseTileLayer?.getSource();
    if (!source) return;
    source.setUrl(this.buildTileUrl(mode));
  }

  getDisplayMode(): MapDisplayMode {
    return this.displayMode;
  }

  resize(): void {
    this.map?.updateSize();
  }

  private async ensureCesium(): Promise<void> {
    if (this.ol3d) return;
    if (this.cesiumLoading) {
      await this.cesiumLoading;
      return;
    }

    this.cesiumLoading = (async () => {
      if (!window.Cesium) {
        window.CESIUM_BASE_URL = "/cesium/";
        const Cesium = await import("cesium");
        await import("cesium/Build/Cesium/Widgets/widgets.css");
        window.Cesium = Cesium;
      }

      const OLCesium = (await import("ol-cesium")).default;
      if (!this.map) return;

      this.ol3d = new OLCesium({ map: this.map }) as OlCesiumInstance;
    })();

    await this.cesiumLoading;
    this.cesiumLoading = null;
  }
}

export function createUniversityMapController(
  options: UniversityMapControllerOptions,
): UniversityMapController {
  return new OpenLayersUniversityMapController(options);
}
