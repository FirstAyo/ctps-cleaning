export const workspaceRequirements = Object.freeze({
  node: ">=22.0.0 <23",
  packageScope: "@ctps",
} as const);

export { fetchFoundationHealth } from "./status-health";
