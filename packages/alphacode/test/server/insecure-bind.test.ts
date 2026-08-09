import { afterEach, describe, expect, test } from "bun:test"
import { assertNetworkBindIsAuthenticated } from "../../src/server/server"

const KEYS = ["ALPHACODE_SERVER_PASSWORD", "ALPHACODE_ALLOW_INSECURE_BIND"] as const
const original = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]))

afterEach(() => {
  for (const key of KEYS) {
    const value = original[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

function clear() {
  for (const key of KEYS) delete process.env[key]
}

describe("assertNetworkBindIsAuthenticated", () => {
  test("allows loopback binds without a password", () => {
    clear()
    for (const host of ["127.0.0.1", "localhost", "::1", "::ffff:127.0.0.1"]) {
      expect(() => assertNetworkBindIsAuthenticated(host)).not.toThrow()
    }
  })

  test("refuses a non-loopback bind when no password is set", () => {
    clear()
    for (const host of ["0.0.0.0", "192.168.1.20", "::"]) {
      expect(() => assertNetworkBindIsAuthenticated(host)).toThrow(/without authentication/)
    }
  })

  test("allows a non-loopback bind once a password is configured", () => {
    clear()
    process.env.ALPHACODE_SERVER_PASSWORD = "hunter2"
    expect(() => assertNetworkBindIsAuthenticated("0.0.0.0")).not.toThrow()
  })

  test("allows an explicit opt-out for trusted networks", () => {
    clear()
    process.env.ALPHACODE_ALLOW_INSECURE_BIND = "1"
    expect(() => assertNetworkBindIsAuthenticated("0.0.0.0")).not.toThrow()
  })

  test("an empty password does not count as configured", () => {
    clear()
    process.env.ALPHACODE_SERVER_PASSWORD = ""
    expect(() => assertNetworkBindIsAuthenticated("0.0.0.0")).toThrow(/without authentication/)
  })
})
