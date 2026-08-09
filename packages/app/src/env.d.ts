interface ImportMetaEnv {
  readonly VITE_ALPHACODE_SERVER_HOST: string
  readonly VITE_ALPHACODE_SERVER_PORT: string
  readonly VITE_ALPHACODE_CHANNEL?: "dev" | "beta" | "prod"
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "*.png" {
  const src: string
  export default src
}

declare module "*.mp4" {
  const src: string
  export default src
}

export declare module "solid-js" {
  namespace JSX {
    interface Directives {
      sortable: true
    }
  }
}
