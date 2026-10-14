import {
  KINFLO_IGES_LIMITS,
  KinfloIgesError,
  type KinfloIgesErrorCode,
  type KinfloIgesGeometry,
  createKinfloEngineeringReview,
  inspectKinfloIgesSource,
  sha256Hex,
} from "@/lib/kinfloIges";

type WorkerSuccess = { status: "ready"; geometry: KinfloIgesGeometry };
type WorkerFailure = { status: "error"; code: KinfloIgesErrorCode; message: string };

function convertInWorker(bytes: Uint8Array) {
  return new Promise<KinfloIgesGeometry>((resolve, reject) => {
    const worker = new Worker(new URL("../workers/kinfloIges.worker.ts", import.meta.url), { type: "module" });
    const timeout = window.setTimeout(() => {
      worker.terminate();
      reject(new KinfloIgesError("TIMEOUT", "The browser-local CAD worker exceeded its five-second limit."));
    }, KINFLO_IGES_LIMITS.timeoutMs);

    worker.onmessage = (event: MessageEvent<WorkerSuccess | WorkerFailure>) => {
      window.clearTimeout(timeout);
      worker.terminate();
      if (event.data.status === "ready") resolve(event.data.geometry);
      else reject(new KinfloIgesError(event.data.code, event.data.message));
    };
    worker.onerror = () => {
      window.clearTimeout(timeout);
      worker.terminate();
      reject(new KinfloIgesError("RUNTIME_UNAVAILABLE", "The browser-local CAD worker could not start."));
    };

    const transferable = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    worker.postMessage({ bytes: transferable }, [transferable]);
  });
}

export async function prepareKinfloIgesReview(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  inspectKinfloIgesSource(file.name, bytes);
  const [digestSha256, geometry] = await Promise.all([
    sha256Hex(bytes),
    convertInWorker(bytes),
  ]);
  return {
    geometry,
    review: createKinfloEngineeringReview(file.name, bytes.byteLength, digestSha256, geometry),
  };
}
