import { getComponentCatalogue } from "@opentui/solid/components"
import { registerSpinner } from "opentui-spinner/solid"

export function registerAlphacodeSpinner() {
  if (!getComponentCatalogue().spinner) registerSpinner()
}
