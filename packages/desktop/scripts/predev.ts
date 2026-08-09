import { $ } from "bun"
import { downloadCliToResources } from "./utils"

await $`bun run install-electron`

await $`bun ./scripts/copy-icons.ts ${process.env.ALPHACODE_CHANNEL ?? "dev"}`

await $`cd ../alphacode && bun script/build-node.ts`
await downloadCliToResources()
