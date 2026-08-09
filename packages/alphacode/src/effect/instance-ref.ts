import { Context } from "effect"
import type { InstanceContext } from "@/project/instance-context"
import type { WorkspaceV2 } from "@alphacode-ai/core/workspace"

export const InstanceRef = Context.Reference<InstanceContext | undefined>("~alphacode/InstanceRef", {
  defaultValue: () => undefined,
})

export const WorkspaceRef = Context.Reference<WorkspaceV2.ID | undefined>("~alphacode/WorkspaceRef", {
  defaultValue: () => undefined,
})
