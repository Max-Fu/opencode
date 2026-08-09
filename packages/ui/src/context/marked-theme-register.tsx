import { registerCustomTheme } from "@pierre/diffs"
import { AlphaCodeTheme } from "./marked-theme"

let registered = false

export function registerAlphaCodeTheme() {
  if (registered) return
  registered = true
  registerCustomTheme("AlphaCode", () => Promise.resolve(AlphaCodeTheme))
}
