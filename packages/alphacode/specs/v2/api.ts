// @ts-nocheck

import { AlphaCode } from "@alphacode-ai/core"
import { ReadTool } from "@alphacode-ai/core/tools"

const alphacode = AlphaCode.make({})

alphacode.tool.add(ReadTool)

alphacode.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

alphacode.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

alphacode.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await alphacode.session.create({
  agent: "build",
})

alphacode.subscribe((event) => {
  console.log(event)
})

await alphacode.session.prompt({
  sessionID,
  text: "hey what is up",
})

await alphacode.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await alphacode.session.wait()

console.log(await alphacode.session.messages(sessionID))
