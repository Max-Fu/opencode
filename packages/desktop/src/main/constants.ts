import { app } from "electron"

type Channel = "dev" | "beta" | "prod"
const raw = import.meta.env.OPENCODE_CHANNEL
export const CHANNEL: Channel = raw === "dev" || raw === "beta" || raw === "prod" ? raw : "dev"

// Opt-in only. Update checks contact a release feed and leak that the app is
// running, so they stay off unless the user asks for them.
const UPDATER_OPT_IN = process.env.OPENCODE_ENABLE_AUTOUPDATE === "1" || process.env.OPENCODE_ENABLE_AUTOUPDATE === "true"

export const UPDATER_ENABLED = UPDATER_OPT_IN && app.isPackaged && CHANNEL !== "dev"
