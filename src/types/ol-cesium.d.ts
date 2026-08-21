declare module "ol-cesium" {
  import type { Map as OlMap } from "ol";

  export default class OLCesium {
    constructor(options: { map: OlMap });
    setEnabled(enabled: boolean): void;
    destroy(): void;
  }
}
