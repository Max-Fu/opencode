// Preload: log every outbound network attempt with a stack trace.
// Covers globalThis.fetch (Effect HttpClient) and node net/tls/http(s) (arborist,
// make-fetch-happen, and anything else that skips fetch).
const out = (kind: string, target: string) => {
  const stack = (new Error().stack ?? "").split("\n").slice(2, 14).join("\n")
  process.stderr.write(`\n### NETSPY ${kind} -> ${target}\n${stack}\n`)
}

const realFetch = globalThis.fetch
globalThis.fetch = function (input: any, init?: any) {
  const url = typeof input === "string" ? input : (input?.url ?? String(input))
  out("fetch", url)
  return realFetch.call(this, input, init)
} as typeof fetch

for (const mod of ["node:net", "node:tls", "node:http", "node:https"]) {
  try {
    const m = require(mod)
    if (m.connect) {
      const real = m.connect
      m.connect = function (...args: any[]) {
        const a = args[0]
        const target = typeof a === "object" ? `${a?.host ?? a?.hostname}:${a?.port}` : String(a)
        out(`${mod}.connect`, target)
        return real.apply(this, args)
      }
    }
    if (m.request) {
      const real = m.request
      m.request = function (...args: any[]) {
        const a = args[0]
        const target = typeof a === "string" ? a : `${a?.hostname ?? a?.host}${a?.path ?? ""}`
        out(`${mod}.request`, target)
        return real.apply(this, args)
      }
    }
  } catch {
    // module unavailable in this runtime
  }
}

process.stderr.write("### NETSPY LOADED\n")
