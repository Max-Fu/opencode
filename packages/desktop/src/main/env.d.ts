interface ImportMetaEnv {
  readonly ALPHACODE_CHANNEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "virtual:alphacode-server" {
  export namespace Server {
    export const listen: typeof import("../../../alphacode/dist/types/src/node").Server.listen
    export type Listener = import("../../../alphacode/dist/types/src/node").Server.Listener
  }
  export namespace Config {
    export const get: typeof import("../../../alphacode/dist/types/src/node").Config.get
    export type Info = import("../../../alphacode/dist/types/src/node").Config.Info
  }
  export const bootstrap: typeof import("../../../alphacode/dist/types/src/node").bootstrap
}
