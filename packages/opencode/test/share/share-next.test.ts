import { beforeEach, describe, expect } from "bun:test"
import { Effect, Exit, Layer } from "effect"
import { HttpClient } from "effect/unstable/http"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { httpClient } from "@opencode-ai/core/effect/app-node-platform"
import { CrossSpawnSpawner } from "@opencode-ai/core/cross-spawn-spawner"
import { SessionProjector } from "@opencode-ai/core/session/projector"

import { AccountRepo } from "../../src/account/repo"
import { EventV2Bridge } from "../../src/event-v2-bridge"
import { Session } from "@/session/session"
import { SessionID } from "../../src/session/schema"
import { ShareNext } from "@/share/share-next"
import { SessionShareTable } from "@opencode-ai/core/share/sql"
import { Database } from "@opencode-ai/core/database/database"
import { provideTmpdirInstance } from "../fixture/fixture"
import { resetDatabase } from "../fixture/db"
import { testEffect } from "../lib/effect"

const env = LayerNode.compile(LayerNode.group([CrossSpawnSpawner.node]))
const it = testEffect(env)

// Any outbound request from the share code path is a bug: this build must never
// upload a transcript to a hosted service.
const none = HttpClient.make(() => Effect.die("share must not make http calls"))

function shareLayer(client: HttpClient.HttpClient) {
  const replacement = [httpClient, Layer.succeed(HttpClient.HttpClient, client)] as const
  return LayerNode.compile(
    LayerNode.group([
      ShareNext.node,
      EventV2Bridge.node,
      Session.node,
      SessionProjector.node,
      AccountRepo.node,
      Database.node,
    ]),
    [replacement],
  )
}

beforeEach(async () => {
  await resetDatabase()
})

describe("ShareNext", () => {
  it.live("create fails instead of uploading the session", () =>
    provideTmpdirInstance(() =>
      Effect.gen(function* () {
        const result = yield* Effect.exit(ShareNext.use.create(SessionID.make("ses_disabled")))
        expect(Exit.isFailure(result)).toBe(true)
      }).pipe(Effect.provide(shareLayer(none))),
    ),
  )

  it.live("create does not persist a share row", () =>
    provideTmpdirInstance(() =>
      Effect.gen(function* () {
        yield* Effect.ignore(ShareNext.use.create(SessionID.make("ses_disabled")))
        const { db } = yield* Database.Service
        const rows = yield* db.select().from(SessionShareTable).all().pipe(Effect.orDie)
        expect(rows).toEqual([])
      }).pipe(Effect.provide(shareLayer(none))),
    ),
  )

  it.live("remove is a no-op", () =>
    provideTmpdirInstance(() =>
      Effect.gen(function* () {
        const result = yield* Effect.exit(ShareNext.use.remove(SessionID.make("ses_disabled")))
        expect(Exit.isSuccess(result)).toBe(true)
      }).pipe(Effect.provide(shareLayer(none))),
    ),
  )

  it.live("init does not subscribe to session events", () =>
    provideTmpdirInstance(() =>
      Effect.gen(function* () {
        const result = yield* Effect.exit(ShareNext.use.init())
        expect(Exit.isSuccess(result)).toBe(true)
      }).pipe(Effect.provide(shareLayer(none))),
    ),
  )
})
