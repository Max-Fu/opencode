import path from "path"

process.env.ALPHACODE_DB = ":memory:"
process.env.ALPHACODE_MODELS_PATH = path.join(import.meta.dir, "plugin", "fixtures", "models-dev.json")
process.env.ALPHACODE_DISABLE_MODELS_FETCH = "true"
