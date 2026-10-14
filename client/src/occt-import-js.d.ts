declare module "occt-import-js" {
  type OcctResult = {
    success: boolean;
    meshes?: Array<{
      attributes?: { position?: { array?: ArrayLike<number> } };
      index?: { array?: ArrayLike<number> };
    }>;
  };

  type OcctRuntime = {
    ReadIgesFile(bytes: Uint8Array, params: Record<string, string | number>): OcctResult;
  };

  type OcctFactoryOptions = {
    locateFile?: (fileName: string) => string;
    print?: (...values: unknown[]) => void;
    printErr?: (...values: unknown[]) => void;
  };

  export default function createOcct(options?: OcctFactoryOptions): Promise<OcctRuntime>;
}
