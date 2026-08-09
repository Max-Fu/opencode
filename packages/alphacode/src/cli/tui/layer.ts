import { run as runTui, type TuiInput } from "@alphacode-ai/tui"
import { Global } from "@alphacode-ai/core/global"
import { AppNodeBuilder } from "@alphacode-ai/core/effect/app-node-builder"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(AppNodeBuilder.build(Global.node)))
}
