import { afterEach, describe, expect, test } from "bun:test"
import { Flag } from "@alphacode-ai/core/flag/flag"
import { assertNetworkBindIsAuthenticated } from "../../src/server/server"

const original = {
  password: Flag.ALPHACODE_SERVER_PASSWORD,
  insecure: Flag.ALPHACODE_ALLOW_INSECURE_BIND,
}

afterEach(() => {
  Flag.ALPHACODE_SERVER_PASSWORD = original.password
  Flag.ALPHACODE_ALLOW_INSECURE_BIND = original.insecure
})

function clear() {
  Flag.ALPHACODE_SERVER_PASSWORD = undefined
  Flag.ALPHACODE_ALLOW_INSECURE_BIND = false
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
    Flag.ALPHACODE_SERVER_PASSWORD = "hunter2"
    expect(() => assertNetworkBindIsAuthenticated("0.0.0.0")).not.toThrow()
  })

  test("allows an explicit opt-out for trusted networks", () => {
    clear()
    Flag.ALPHACODE_ALLOW_INSECURE_BIND = true
    expect(() => assertNetworkBindIsAuthenticated("0.0.0.0")).not.toThrow()
  })

  test("an empty password does not count as configured", () => {
    clear()
    Flag.ALPHACODE_SERVER_PASSWORD = ""
    expect(() => assertNetworkBindIsAuthenticated("0.0.0.0")).toThrow(/without authentication/)
  })
})
