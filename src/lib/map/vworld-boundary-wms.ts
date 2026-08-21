import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";

export type BoundaryLayerKind = "sido" | "sigungu";

/** V-World WMS 레이어 ID (소문자, _info 접미사 없음) */
export const VWORLD_BOUNDARY_LAYER_IDS = {
  sido: "lt_c_adsido",
  sigungu: "lt_c_adsigg",
} as const;

export type BoundaryLayerVisibility = {
  sido: boolean;
  sigungu: boolean;
};

export const DARK_BOUNDARY_MAP_BG = "#0d1117";

export const VWORLD_WMS_URL = "https://api.vworld.kr/req/wms";

function boundarySld(layerId: string, strokeWidth: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
  <NamedLayer>
    <Name>${layerId}</Name>
    <UserStyle>
      <FeatureTypeStyle>
        <Rule>
          <PolygonSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#FFFFFF</CssParameter>
              <CssParameter name="stroke-width">${strokeWidth}</CssParameter>
            </Stroke>
            <Fill>
              <CssParameter name="fill">#00000000</CssParameter>
            </Fill>
          </PolygonSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;
}

function resolveWmsDomain() {
  if (typeof window === "undefined") return "localhost";
  return window.location.hostname || "localhost";
}

export function buildVWorldWmsParams(
  apiKey: string,
  layerId: string,
  sldBody?: string,
) {
  const params: Record<string, string | boolean> = {
    SERVICE: "WMS",
    REQUEST: "GetMap",
    VERSION: "1.3.0",
    LAYERS: layerId,
    CRS: "EPSG:3857",
    FORMAT: "image/png",
    TRANSPARENT: true,
    KEY: apiKey,
    apikey: apiKey,
    DOMAIN: resolveWmsDomain(),
  };

  if (sldBody) {
    params.SLD_BODY = sldBody;
  } else {
    params.STYLES = layerId;
  }

  return params;
}

export function createVWorldBoundaryWmsLayer(
  apiKey: string,
  kind: BoundaryLayerKind,
  visible = false,
) {
  const layerId = VWORLD_BOUNDARY_LAYER_IDS[kind];
  const strokeWidth = kind === "sido" ? 2 : 1;
  const sldBody = boundarySld(layerId, strokeWidth);

  const layer = new TileLayer({
    visible,
    opacity: 1,
    zIndex: kind === "sido" ? 5 : 6,
    source: new TileWMS({
      url: VWORLD_WMS_URL,
      params: buildVWorldWmsParams(apiKey, layerId, sldBody),
    }),
  });
  layer.set("boundaryKind", kind);
  return layer;
}
