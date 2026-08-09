declare global {
  const ALPHACODE_VERSION: string
  const ALPHACODE_CHANNEL: string
}

export const InstallationVersion = typeof ALPHACODE_VERSION === "string" ? ALPHACODE_VERSION : "local"
export const InstallationChannel = typeof ALPHACODE_CHANNEL === "string" ? ALPHACODE_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
