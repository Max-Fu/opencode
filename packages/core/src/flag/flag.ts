import { Config } from "effect"

export function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

const copy = process.env["ALPHACODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
const fff = process.env["ALPHACODE_DISABLE_FFF"]

function enabledByExperimental(key: string) {
  return process.env[key] === undefined ? truthy("ALPHACODE_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  ALPHACODE_AUTO_HEAP_SNAPSHOT: truthy("ALPHACODE_AUTO_HEAP_SNAPSHOT"),
  ALPHACODE_GIT_BASH_PATH: process.env["ALPHACODE_GIT_BASH_PATH"],
  ALPHACODE_CONFIG: process.env["ALPHACODE_CONFIG"],
  ALPHACODE_CONFIG_CONTENT: process.env["ALPHACODE_CONFIG_CONTENT"],
  // Update checks are opt-in: alphacode never contacts a release index unless
  // the user explicitly asks for it.
  ALPHACODE_ENABLE_AUTOUPDATE: truthy("ALPHACODE_ENABLE_AUTOUPDATE"),
  ALPHACODE_DISABLE_AUTOUPDATE: truthy("ALPHACODE_DISABLE_AUTOUPDATE"),
  ALPHACODE_ALWAYS_NOTIFY_UPDATE: truthy("ALPHACODE_ALWAYS_NOTIFY_UPDATE"),
  ALPHACODE_DISABLE_PRUNE: truthy("ALPHACODE_DISABLE_PRUNE"),
  ALPHACODE_DISABLE_TERMINAL_TITLE: truthy("ALPHACODE_DISABLE_TERMINAL_TITLE"),
  ALPHACODE_SHOW_TTFD: truthy("ALPHACODE_SHOW_TTFD"),
  ALPHACODE_DISABLE_AUTOCOMPACT: truthy("ALPHACODE_DISABLE_AUTOCOMPACT"),
  // The remote model catalog is opt-in: by default alphacode uses the catalog
  // snapshot embedded at build time (or ALPHACODE_MODELS_PATH) and makes no
  // network request of its own.
  ALPHACODE_ENABLE_MODELS_FETCH: truthy("ALPHACODE_ENABLE_MODELS_FETCH"),
  ALPHACODE_DISABLE_MODELS_FETCH: truthy("ALPHACODE_DISABLE_MODELS_FETCH"),
  ALPHACODE_DISABLE_MOUSE: truthy("ALPHACODE_DISABLE_MOUSE"),
  ALPHACODE_FAKE_VCS: process.env["ALPHACODE_FAKE_VCS"],
  ALPHACODE_SERVER_PASSWORD: process.env["ALPHACODE_SERVER_PASSWORD"],
  ALPHACODE_SERVER_USERNAME: process.env["ALPHACODE_SERVER_USERNAME"],
  ALPHACODE_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("ALPHACODE_DISABLE_FFF"),

  // Experimental
  ALPHACODE_EXPERIMENTAL_FILEWATCHER: Config.boolean("ALPHACODE_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  ALPHACODE_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("ALPHACODE_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  ALPHACODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("ALPHACODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  ALPHACODE_MODELS_URL: process.env["ALPHACODE_MODELS_URL"],
  ALPHACODE_MODELS_PATH: process.env["ALPHACODE_MODELS_PATH"],
  ALPHACODE_DB: process.env["ALPHACODE_DB"],

  ALPHACODE_WORKSPACE_ID: process.env["ALPHACODE_WORKSPACE_ID"],
  ALPHACODE_EXPERIMENTAL_WORKSPACES: enabledByExperimental("ALPHACODE_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get ALPHACODE_DISABLE_PROJECT_CONFIG() {
    return truthy("ALPHACODE_DISABLE_PROJECT_CONFIG")
  },
  get ALPHACODE_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("ALPHACODE_EXPERIMENTAL_REFERENCES")
  },
  get ALPHACODE_TUI_CONFIG() {
    return process.env["ALPHACODE_TUI_CONFIG"]
  },
  get ALPHACODE_CONFIG_DIR() {
    return process.env["ALPHACODE_CONFIG_DIR"]
  },
  get ALPHACODE_PURE() {
    return truthy("ALPHACODE_PURE")
  },
  get ALPHACODE_PERMISSION() {
    return process.env["ALPHACODE_PERMISSION"]
  },
  get ALPHACODE_PLUGIN_META_FILE() {
    return process.env["ALPHACODE_PLUGIN_META_FILE"]
  },
  get ALPHACODE_CLIENT() {
    return process.env["ALPHACODE_CLIENT"] ?? "cli"
  },
}
