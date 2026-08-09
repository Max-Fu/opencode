import { AgentV2 } from "@alphacode-ai/core/agent"
import { AISDK } from "@alphacode-ai/core/aisdk"
import { Catalog } from "@alphacode-ai/core/catalog"
import { CommandV2 } from "@alphacode-ai/core/command"
import { Credential } from "@alphacode-ai/core/credential"
import { AppNodeBuilder } from "@alphacode-ai/core/effect/app-node-builder"
import { LayerNodePlatform } from "@alphacode-ai/core/effect/app-node-platform"
import { LayerNode } from "@alphacode-ai/core/effect/layer-node"
import { EventV2 } from "@alphacode-ai/core/event"
import { FileSystem } from "@alphacode-ai/core/filesystem"
import { FSUtil } from "@alphacode-ai/core/fs-util"
import { Integration } from "@alphacode-ai/core/integration"
import { Location } from "@alphacode-ai/core/location"
import { Npm } from "@alphacode-ai/core/npm"
import { PluginV2 } from "@alphacode-ai/core/plugin"
import { Reference } from "@alphacode-ai/core/reference"
import { SkillV2 } from "@alphacode-ai/core/skill"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: () => Effect.succeed({ directory: "", entrypoint: undefined }),
    install: () => Effect.void,
    which: () => Effect.succeed(undefined),
  }),
)

export const PluginTestLayer = AppNodeBuilder.build(
  LayerNode.group([
    FileSystem.node,
    FSUtil.node,
    Location.node,
    Npm.node,
    Credential.node,
    EventV2.node,
    LayerNodePlatform.httpClient,
    PluginV2.node,
    AgentV2.node,
    AISDK.node,
    Catalog.node,
    CommandV2.node,
    Integration.node,
    Reference.node,
    SkillV2.node,
  ]),
  [
    [Location.node, tempLocationLayer],
    [Npm.node, npmLayer],
  ],
)
