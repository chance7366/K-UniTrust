/** V-World 주소 지오코딩 (도로명 → 좌표 + 지번주소) */

export type GeocodeResult = {
  lng: number;
  lat: number;
  lotAddress: string;
  rawStatus: string;
};

type VworldAddressResponse = {
  response?: {
    status?: string;
    result?:
      | {
          point?: { x?: string; y?: string };
          text?: string;
        }
      | Array<{ text?: string }>;
    error?: { text?: string };
  };
};

export async function reverseGeocodeParcelAddress(
  lng: number,
  lat: number,
  apiKey: string,
): Promise<string | null> {
  const url = new URL("https://api.vworld.kr/req/address");
  url.searchParams.set("service", "address");
  url.searchParams.set("request", "getAddress");
  url.searchParams.set("version", "2.0");
  url.searchParams.set("crs", "EPSG:4326");
  url.searchParams.set("point", `${lng},${lat}`);
  url.searchParams.set("type", "PARCEL");
  url.searchParams.set("format", "json");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as VworldAddressResponse;
  if (data.response?.status !== "OK") return null;

  const result = data.response.result;
  if (Array.isArray(result)) {
    return result[0]?.text?.trim() || null;
  }
  return result?.text?.trim() || null;
}

export async function geocodeRoadAddress(
  roadAddress: string,
  apiKey: string,
): Promise<GeocodeResult | null> {
  const url = new URL("https://api.vworld.kr/req/address");
  url.searchParams.set("service", "address");
  url.searchParams.set("request", "getcoord");
  url.searchParams.set("version", "2.0");
  url.searchParams.set("crs", "EPSG:4326");
  url.searchParams.set("address", roadAddress);
  url.searchParams.set("refine", "true");
  url.searchParams.set("type", "ROAD");
  url.searchParams.set("format", "json");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as VworldAddressResponse;
  if (data.response?.status !== "OK") return null;

  const result = data.response.result;
  if (!result || Array.isArray(result)) return null;

  const point = result.point;
  const lng = Number(point?.x);
  const lat = Number(point?.y);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  const lotAddress =
    (await reverseGeocodeParcelAddress(lng, lat, apiKey)) ??
    result.text?.trim() ??
    "";

  return {
    lng,
    lat,
    lotAddress,
    rawStatus: "OK",
  };
}

/** 좌표만 있을 때 지번주소만 역지오코딩 */
export async function geocodeLotAddressFromCoords(
  lng: number,
  lat: number,
  apiKey: string,
): Promise<string | null> {
  return reverseGeocodeParcelAddress(lng, lat, apiKey);
}

export function parseRoadAddressParts(roadAddress: string): {
  sido: string;
  sigungu: string;
} {
  const road = roadAddress.trim();
  const m = road.match(
    /^(.+?(?:특별자치도|특별자치시|특별시|광역시|도))\s+(.+?(?:시|군|구))/,
  );
  if (!m) return { sido: "", sigungu: "" };
  return { sido: m[1] ?? "", sigungu: m[2] ?? "" };
}

export function normalizeSidoLabel(sido: string): string {
  return sido
    .replace("특별자치도", "")
    .replace("특별자치시", "")
    .replace("특별시", "")
    .replace("광역시", "")
    .replace(/도$/, "")
    .trim();
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
