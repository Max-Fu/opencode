/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill"

import { define } from "./internal"
import { Effect } from "effect"
import { AbsolutePath } from "../schema"
import { SkillV2 } from "../skill"
import customizeAlphacodeContent from "./skill/customize-alphacode.md" with { type: "text" }

export const CustomizeAlphacodeContent = customizeAlphacodeContent

export const Plugin = define({
  id: "skill",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.skill.transform((draft) => {
      draft.source(
        SkillV2.EmbeddedSource.make({
          type: "embedded",
          skill: SkillV2.Info.make({
            name: "customize-alphacode",
            description:
              "Use ONLY when the user is editing or creating alphacode's own configuration: alphacode.json, alphacode.jsonc, files under .alphacode/, or files under ~/.config/alphacode/. Also use when creating or fixing alphacode agents, subagents, commands, skills, plugins, MCP servers, or permission rules. Do not use for the user's own application code, or for any project that is not configuring alphacode itself.",
            location: AbsolutePath.make("/builtin/customize-alphacode.md"),
            content: CustomizeAlphacodeContent,
          }),
        }),
      )
    })
  }),
})
