export * as ConfigPaths from "./paths"

import path from "path"
import { Flag } from "@alphacode-ai/core/flag/flag"
import { Global } from "@alphacode-ai/core/global"
import { unique } from "remeda"
import * as Effect from "effect/Effect"
import { FSUtil } from "@alphacode-ai/core/fs-util"

export const files = Effect.fn("ConfigPaths.projectFiles")(function* (
  name: string,
  directory: string,
  worktree?: string,
) {
  const afs = yield* FSUtil.Service
  return (yield* afs.up({
    targets: [`${name}.jsonc`, `${name}.json`],
    start: directory,
    stop: worktree,
  })).toReversed()
})

export const directories = Effect.fn("ConfigPaths.directories")(function* (directory: string, worktree?: string) {
  const afs = yield* FSUtil.Service
  return unique([
    Global.Path.config,
    ...(!Flag.ALPHACODE_DISABLE_PROJECT_CONFIG
      ? yield* afs.up({
          targets: [".alphacode"],
          start: directory,
          stop: worktree,
        })
      : []),
    ...(yield* afs.up({
      targets: [".alphacode"],
      start: Global.Path.home,
      stop: Global.Path.home,
    })),
    ...(Flag.ALPHACODE_CONFIG_DIR ? [Flag.ALPHACODE_CONFIG_DIR] : []),
  ])
})

export function fileInDirectory(dir: string, name: string) {
  return [path.join(dir, `${name}.json`), path.join(dir, `${name}.jsonc`)]
}
