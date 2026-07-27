import { spawnSync } from "node:child_process";
import process from "node:process";

const skipBuild = process.argv.includes("--skip-build");
const runSmoke = process.argv.includes("--smoke");
const commands = [
  ["pnpm", ["format:check"]],
  ["pnpm", ["lint"]],
  ["pnpm", ["typecheck"]],
  ["pnpm", ["test"]],
  ...(!skipBuild ? [["pnpm", ["build"]]] : []),
  ["docker", ["compose", "config", "--quiet"]],
  ["docker", ["compose", "-f", "compose.production.yml", "config", "--quiet"]],
  ["node", ["scripts/security-scan.mjs"]],
  ["git", ["-c", "safe.directory=*", "diff", "--check"]],
  ...(runSmoke ? [["node", ["scripts/smoke-test.mjs"]]] : []),
];
for (const [command, args] of commands) {
  process.stdout.write(`> ${command} ${args.join(" ")}\n`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
process.stdout.write("Release verification passed.\n");
