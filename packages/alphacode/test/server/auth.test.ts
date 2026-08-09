import { afterEach, describe, expect, test } from "bun:test"
import { Option, Redacted } from "effect"
import { Flag } from "@alphacode-ai/core/flag/flag"
import { ServerAuth } from "../../src/server/auth"

const original = {
  ALPHACODE_SERVER_PASSWORD: Flag.ALPHACODE_SERVER_PASSWORD,
  ALPHACODE_SERVER_USERNAME: Flag.ALPHACODE_SERVER_USERNAME,
}

afterEach(() => {
  Flag.ALPHACODE_SERVER_PASSWORD = original.ALPHACODE_SERVER_PASSWORD
  Flag.ALPHACODE_SERVER_USERNAME = original.ALPHACODE_SERVER_USERNAME
})

describe("ServerAuth", () => {
  test("does not emit auth headers without a password", () => {
    Flag.ALPHACODE_SERVER_PASSWORD = undefined
    Flag.ALPHACODE_SERVER_USERNAME = "alice"

    expect(ServerAuth.header()).toBeUndefined()
    expect(ServerAuth.headers()).toBeUndefined()
  })

  test("defaults to the alphacode username", () => {
    Flag.ALPHACODE_SERVER_PASSWORD = "secret"
    Flag.ALPHACODE_SERVER_USERNAME = undefined

    expect(ServerAuth.headers()).toEqual({
      Authorization: `Basic ${Buffer.from("alphacode:secret").toString("base64")}`,
    })
  })

  test("uses the configured username", () => {
    Flag.ALPHACODE_SERVER_PASSWORD = "secret"
    Flag.ALPHACODE_SERVER_USERNAME = "alice"

    expect(ServerAuth.headers()).toEqual({
      Authorization: `Basic ${Buffer.from("alice:secret").toString("base64")}`,
    })
  })

  test("prefers explicit credentials", () => {
    Flag.ALPHACODE_SERVER_PASSWORD = "secret"
    Flag.ALPHACODE_SERVER_USERNAME = "alice"

    expect(ServerAuth.headers({ password: "cli-secret", username: "bob" })).toEqual({
      Authorization: `Basic ${Buffer.from("bob:cli-secret").toString("base64")}`,
    })
  })

  test("validates decoded credentials against effect config", () => {
    const config = { password: Option.some("secret"), username: "alice" }

    expect(ServerAuth.required(config)).toBe(true)
    expect(ServerAuth.authorized({ username: "alice", password: Redacted.make("secret") }, config)).toBe(true)
    expect(ServerAuth.authorized({ username: "alphacode", password: Redacted.make("secret") }, config)).toBe(false)
  })
})
