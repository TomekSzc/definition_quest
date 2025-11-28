// Feature flag module – universal (frontend & backend)

export type Env = "dev" | "test" | "prod";
export type Feature = "auth";

// Static configuration of feature flags per environment
const FEATURE_MATRIX: Record<Env, Record<Feature, boolean>> = {
  dev: { auth: true },
  test: { auth: true },
  prod: { auth: true },
};

// Resolve current execution environment.
// 1. Tries Astro/Build-time import.meta.env.ENV_NAME
// 2. Falls back to Node's process.env.ENV_NAME when available
// 3. Defaults to "dev" when unset or invalid
function resolveEnv(): Env {
  const fromImportMeta = import.meta.env.ENV_NAME as Env | undefined;
  const fromProcess = typeof process !== "undefined" ? (process.env.ENV_NAME as Env | undefined) : undefined;

  if (fromImportMeta && isValidEnv(fromImportMeta)) return fromImportMeta;
  if (fromProcess && isValidEnv(fromProcess)) return fromProcess;
  return "dev";
}

function isValidEnv(value: string): value is Env {
  return value === "dev" || value === "test" || value === "prod";
}

const CURRENT_ENV: Env = resolveEnv();

/**
 * Returns true when a given feature flag is enabled for the current environment.
 * Flags not present in the matrix evaluate to false by design.
 */
export function isEnabled(feature: Feature): boolean {
  const envFlags = FEATURE_MATRIX[CURRENT_ENV];
  return envFlags[feature] ?? false;
}

/**
 * Read-only snapshot of all flags for the current environment – handy for debugging.
 */
export const currentFlags: Readonly<Record<Feature, boolean>> = FEATURE_MATRIX[CURRENT_ENV];
