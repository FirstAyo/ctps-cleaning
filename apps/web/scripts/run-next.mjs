import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const [, , command, portVariable, defaultPort] = process.argv;
const port = process.env[portVariable] ?? defaultPort;
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, command, "--port", port], {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});
