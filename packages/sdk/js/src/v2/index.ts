export * from "./client.js"
export * from "./server.js"

import { createAlphacodeClient } from "./client.js"
import { createAlphacodeServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export * as data from "./data.js"

export async function createAlphacode(options?: ServerOptions) {
  const server = await createAlphacodeServer({
    ...options,
  })

  const client = createAlphacodeClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
