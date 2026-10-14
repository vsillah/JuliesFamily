/// <reference lib="webworker" />

import createOcct from "occt-import-js";
import occtWasmUrl from "occt-import-js/dist/occt-import-js.wasm?url";
import { asKinfloIgesError, normalizeKinfloIgesGeometry } from "@/lib/kinfloIges";

type WorkerRequest = { bytes: ArrayBuffer };

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    const occt = await createOcct({
      locateFile: (fileName) => fileName.endsWith(".wasm") ? occtWasmUrl : fileName,
      print: () => undefined,
      printErr: () => undefined,
    });
    const result = occt.ReadIgesFile(new Uint8Array(event.data.bytes), {
      linearUnit: "millimeter",
      linearDeflectionType: "bounding_box_ratio",
      linearDeflection: 0.001,
      angularDeflection: 0.5,
    });
    self.postMessage({ status: "ready", geometry: normalizeKinfloIgesGeometry(result) });
  } catch (error) {
    const safeError = asKinfloIgesError(error);
    self.postMessage({ status: "error", code: safeError.code, message: safeError.message });
  }
};
