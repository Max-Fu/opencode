import { Flag } from "@alphacode-ai/core/flag/flag"
import { Effect } from "effect"
import path from "path"

const preserveExerciseGlobalRoot = !!process.env.ALPHACODE_HTTPAPI_EXERCISE_GLOBAL
export const exerciseGlobalRoot =
  process.env.ALPHACODE_HTTPAPI_EXERCISE_GLOBAL ??
  path.join(process.env.TMPDIR ?? "/tmp", `alphacode-httpapi-global-${process.pid}`)
process.env.XDG_DATA_HOME = path.join(exerciseGlobalRoot, "data")
process.env.XDG_CONFIG_HOME = path.join(exerciseGlobalRoot, "config")
process.env.XDG_STATE_HOME = path.join(exerciseGlobalRoot, "state")
process.env.XDG_CACHE_HOME = path.join(exerciseGlobalRoot, "cache")
process.env.ALPHACODE_DISABLE_SHARE = "true"
export const exerciseConfigDirectory = path.join(exerciseGlobalRoot, "config", "alphacode")
export const exerciseDataDirectory = path.join(exerciseGlobalRoot, "data", "alphacode")

const preserveExerciseDatabase = !!process.env.ALPHACODE_HTTPAPI_EXERCISE_DB
export const exerciseDatabasePath =
  process.env.ALPHACODE_HTTPAPI_EXERCISE_DB ??
  path.join(process.env.TMPDIR ?? "/tmp", `alphacode-httpapi-exercise-${process.pid}.db`)
process.env.ALPHACODE_DB = exerciseDatabasePath
Flag.ALPHACODE_DB = exerciseDatabasePath

export const original = {
  ALPHACODE_SERVER_PASSWORD: Flag.ALPHACODE_SERVER_PASSWORD,
  ALPHACODE_SERVER_USERNAME: Flag.ALPHACODE_SERVER_USERNAME,
}

export const cleanupExercisePaths = Effect.promise(async () => {
  const fs = await import("fs/promises")
  if (!preserveExerciseDatabase) {
    await Promise.all(
      [exerciseDatabasePath, `${exerciseDatabasePath}-wal`, `${exerciseDatabasePath}-shm`].map((file) =>
        fs.rm(file, { force: true }).catch(() => undefined),
      ),
    )
  }
  if (!preserveExerciseGlobalRoot)
    await fs.rm(exerciseGlobalRoot, { recursive: true, force: true }).catch(() => undefined)
})
